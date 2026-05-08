from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import statistics
from datetime import datetime, timezone, timedelta, date
from typing import List, Optional

import bcrypt
import jwt
import httpx
from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi.security import HTTPBearer
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# -----------------------------------------------------------------------------
# Setup
# -----------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ACCESS_TTL_DAYS = 30

app = FastAPI()
api = APIRouter(prefix="/api")
bearer_scheme = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=ACCESS_TTL_DAYS),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    bakery_name: str = Field(min_length=1, max_length=80)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    bakery_name: str
    created_at: str
    avatar_url: Optional[str] = None


class AuthOut(BaseModel):
    user: UserOut
    token: str


class ProfileUpdateIn(BaseModel):
    bakery_name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None  # data URL or https URL; "" to clear


class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class FlavorMix(BaseModel):
    name: str
    weight: int = Field(ge=1, le=100)  # relative weight


class SettingsIn(BaseModel):
    bakery_name: Optional[str] = None
    location_label: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    use_weather: Optional[bool] = None
    use_holidays: Optional[bool] = None
    conservative_buffer: Optional[float] = Field(default=None, ge=0, le=0.4)
    flavors: Optional[List[FlavorMix]] = None
    closed_days: Optional[List[int]] = None  # 0=Mon … 6=Sun


class SettingsOut(BaseModel):
    bakery_name: str
    location_label: str
    latitude: float
    longitude: float
    use_weather: bool
    use_holidays: bool
    conservative_buffer: float
    flavors: List[FlavorMix]
    closed_days: List[int]


class BatchIn(BaseModel):
    date: str  # YYYY-MM-DD
    baked: int = Field(ge=0, le=100000)
    sold: int = Field(ge=0, le=100000)
    note: Optional[str] = ""


class BatchOut(BaseModel):
    id: str
    date: str
    baked: int
    sold: int
    waste: int
    note: str


class ForecastFlavor(BaseModel):
    name: str
    qty: int
    share: int


class ForecastOut(BaseModel):
    target_date: str  # YYYY-MM-DD
    weekday: str
    predicted: int
    range_low: int
    range_high: int
    confidence: int
    weather_label: str
    weather_factor: float
    is_holiday: bool
    holiday_name: str
    holiday_factor: float
    conservative_factor: float
    baseline: int
    sample_size: int
    flavors: List[ForecastFlavor]
    notes: List[str]
    is_closed: bool = False
    closed_reason: str = ""


# -----------------------------------------------------------------------------
# Defaults
# -----------------------------------------------------------------------------
DEFAULT_FLAVORS = [
    {"name": "Matcha", "weight": 24},
    {"name": "Ube", "weight": 20},
    {"name": "Strawberry", "weight": 16},
    {"name": "Black Sesame", "weight": 14},
    {"name": "Mango", "weight": 14},
    {"name": "Classic Glaze", "weight": 12},
]

DEFAULT_SETTINGS = {
    "location_label": "New York, NY",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "use_weather": True,
    "use_holidays": True,
    "conservative_buffer": 0.05,
    "flavors": DEFAULT_FLAVORS,
    "closed_days": [],
}


# US Federal & common bakery-impactful holidays (2025-2027)
US_HOLIDAYS = {
    # 2025
    "2025-01-01": "New Year's Day",
    "2025-02-14": "Valentine's Day",
    "2025-04-20": "Easter Sunday",
    "2025-05-26": "Memorial Day",
    "2025-07-04": "Independence Day",
    "2025-09-01": "Labor Day",
    "2025-10-31": "Halloween",
    "2025-11-27": "Thanksgiving",
    "2025-12-24": "Christmas Eve",
    "2025-12-25": "Christmas Day",
    # 2026
    "2026-01-01": "New Year's Day",
    "2026-02-14": "Valentine's Day",
    "2026-04-05": "Easter Sunday",
    "2026-05-25": "Memorial Day",
    "2026-07-04": "Independence Day",
    "2026-09-07": "Labor Day",
    "2026-10-31": "Halloween",
    "2026-11-26": "Thanksgiving",
    "2026-12-24": "Christmas Eve",
    "2026-12-25": "Christmas Day",
    # 2027
    "2027-01-01": "New Year's Day",
    "2027-02-14": "Valentine's Day",
    "2027-03-28": "Easter Sunday",
    "2027-05-31": "Memorial Day",
    "2027-07-04": "Independence Day",
    "2027-09-06": "Labor Day",
    "2027-10-31": "Halloween",
    "2027-11-25": "Thanksgiving",
    "2027-12-24": "Christmas Eve",
    "2027-12-25": "Christmas Day",
}


def weather_code_to_label_factor(code: int) -> tuple[str, float]:
    if code == 0:
        return ("Clear", 1.05)
    if code in (1, 2, 3):
        return ("Partly cloudy", 1.0)
    if code in (45, 48):
        return ("Fog", 0.95)
    if code in (51, 53, 55, 56, 57):
        return ("Drizzle", 0.92)
    if code in (61, 63, 65, 66, 67, 80, 81, 82):
        return ("Rain", 0.88)
    if code in (71, 73, 75, 77, 85, 86):
        return ("Snow", 0.78)
    if code in (95, 96, 99):
        return ("Storm", 0.75)
    return ("Mild", 1.0)


async def fetch_weather(lat: float, lon: float, target_date: str) -> tuple[str, float, str]:
    """Returns (label, factor, temperature_str). Falls back gracefully on error."""
    try:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "weather_code,temperature_2m_max",
            "timezone": "auto",
            "forecast_days": 7,
            "temperature_unit": "fahrenheit",
        }
        async with httpx.AsyncClient(timeout=6.0) as cx:
            r = await cx.get(url, params=params)
            r.raise_for_status()
            data = r.json()
        days = data.get("daily", {}).get("time", [])
        codes = data.get("daily", {}).get("weather_code", [])
        temps = data.get("daily", {}).get("temperature_2m_max", [])
        if target_date in days:
            i = days.index(target_date)
            label, factor = weather_code_to_label_factor(int(codes[i]))
            temp = f"{round(temps[i])}°F"
            return (f"{label} · {temp}", factor, temp)
    except Exception as e:
        logger.warning(f"Weather fetch failed: {e}")
    return ("Unavailable", 1.0, "—")


async def get_or_create_settings(user_id: str) -> dict:
    s = await db.settings.find_one({"user_id": user_id}, {"_id": 0})
    if s:
        # backfill any missing keys added in later versions
        if "closed_days" not in s:
            await db.settings.update_one({"user_id": user_id}, {"$set": {"closed_days": []}})
            s["closed_days"] = []
        return s
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    new_settings = {
        "user_id": user_id,
        "bakery_name": user["bakery_name"] if user else "My Bakery",
        **DEFAULT_SETTINGS,
    }
    await db.settings.insert_one({**new_settings})
    return await db.settings.find_one({"user_id": user_id}, {"_id": 0})


# -----------------------------------------------------------------------------
# Auth Routes
# -----------------------------------------------------------------------------
@api.post("/auth/register", response_model=AuthOut)
async def register(payload: RegisterIn):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    user_doc = {
        "id": user_id,
        "email": email,
        "bakery_name": payload.bakery_name.strip(),
        "password_hash": hash_password(payload.password),
        "avatar_url": None,
        "created_at": now,
    }
    await db.users.insert_one(user_doc)
    # seed default settings
    await db.settings.insert_one({
        "user_id": user_id,
        "bakery_name": payload.bakery_name.strip(),
        **DEFAULT_SETTINGS,
    })
    token = create_access_token(user_id, email)
    return AuthOut(
        user=UserOut(id=user_id, email=email, bakery_name=payload.bakery_name.strip(), created_at=now, avatar_url=None),
        token=token,
    )


@api.post("/auth/login", response_model=AuthOut)
async def login(payload: LoginIn):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email)
    return AuthOut(
        user=UserOut(id=user["id"], email=email, bakery_name=user["bakery_name"], created_at=user["created_at"], avatar_url=user.get("avatar_url")),
        token=token,
    )


@api.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return UserOut(id=user["id"], email=user["email"], bakery_name=user["bakery_name"], created_at=user["created_at"], avatar_url=user.get("avatar_url"))


@api.put("/profile", response_model=UserOut)
async def update_profile(payload: ProfileUpdateIn, user: dict = Depends(get_current_user)):
    update: dict = {}
    if payload.bakery_name is not None:
        update["bakery_name"] = payload.bakery_name.strip()
    if payload.email is not None:
        new_email = payload.email.lower()
        if new_email != user["email"]:
            existing = await db.users.find_one({"email": new_email, "id": {"$ne": user["id"]}})
            if existing:
                raise HTTPException(status_code=400, detail="Email already in use")
            update["email"] = new_email
    if payload.avatar_url is not None:
        # "" to clear; validate size to prevent absurd payloads (~1MB cap)
        if payload.avatar_url and len(payload.avatar_url) > 1_400_000:
            raise HTTPException(status_code=413, detail="Avatar too large (max ~1MB)")
        update["avatar_url"] = payload.avatar_url or None
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
        if "bakery_name" in update:
            await db.settings.update_one({"user_id": user["id"]}, {"$set": {"bakery_name": update["bakery_name"]}})
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return UserOut(id=fresh["id"], email=fresh["email"], bakery_name=fresh["bakery_name"], created_at=fresh["created_at"], avatar_url=fresh.get("avatar_url"))


@api.post("/profile/password")
async def change_password(payload: PasswordChangeIn, user: dict = Depends(get_current_user)):
    full = await db.users.find_one({"id": user["id"]})
    if not full or not verify_password(payload.current_password, full["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": hash_password(payload.new_password)}})
    return {"ok": True}


# -----------------------------------------------------------------------------
# Settings Routes
# -----------------------------------------------------------------------------
@api.get("/settings", response_model=SettingsOut)
async def get_settings(user: dict = Depends(get_current_user)):
    s = await get_or_create_settings(user["id"])
    return SettingsOut(**{k: s[k] for k in SettingsOut.model_fields.keys()})


@api.put("/settings", response_model=SettingsOut)
async def update_settings(payload: SettingsIn, user: dict = Depends(get_current_user)):
    s = await get_or_create_settings(user["id"])
    update = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if "flavors" in update:
        update["flavors"] = [f.model_dump() if hasattr(f, "model_dump") else f for f in update["flavors"]]
        if len(update["flavors"]) == 0:
            update["flavors"] = DEFAULT_FLAVORS
    if "closed_days" in update:
        update["closed_days"] = sorted({int(d) for d in update["closed_days"] if 0 <= int(d) <= 6})
    if update:
        await db.settings.update_one({"user_id": user["id"]}, {"$set": update})
        # reflect bakery_name change on user too
        if "bakery_name" in update:
            await db.users.update_one({"id": user["id"]}, {"$set": {"bakery_name": update["bakery_name"]}})
    s = await db.settings.find_one({"user_id": user["id"]}, {"_id": 0})
    return SettingsOut(**{k: s[k] for k in SettingsOut.model_fields.keys()})


# -----------------------------------------------------------------------------
# Batch Routes
# -----------------------------------------------------------------------------
@api.post("/batches", response_model=BatchOut)
async def create_batch(payload: BatchIn, user: dict = Depends(get_current_user)):
    try:
        date.fromisoformat(payload.date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date (YYYY-MM-DD)")
    if payload.sold > payload.baked:
        raise HTTPException(status_code=400, detail="Sold cannot exceed baked")
    # one batch per (user, date)
    existing = await db.batches.find_one({"user_id": user["id"], "date": payload.date})
    waste = payload.baked - payload.sold
    doc = {
        "id": existing["id"] if existing else str(uuid.uuid4()),
        "user_id": user["id"],
        "date": payload.date,
        "baked": payload.baked,
        "sold": payload.sold,
        "waste": waste,
        "note": payload.note or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.batches.update_one(
        {"user_id": user["id"], "date": payload.date},
        {"$set": doc},
        upsert=True,
    )
    return BatchOut(id=doc["id"], date=doc["date"], baked=doc["baked"], sold=doc["sold"], waste=waste, note=doc["note"])


@api.get("/batches", response_model=List[BatchOut])
async def list_batches(user: dict = Depends(get_current_user), limit: int = 60):
    cursor = db.batches.find({"user_id": user["id"]}, {"_id": 0}).sort("date", -1).limit(limit)
    items = await cursor.to_list(length=limit)
    items.reverse()  # ascending for charting
    return [BatchOut(id=b["id"], date=b["date"], baked=b["baked"], sold=b["sold"], waste=b["waste"], note=b.get("note", "")) for b in items]


@api.delete("/batches/{batch_id}")
async def delete_batch(batch_id: str, user: dict = Depends(get_current_user)):
    res = await db.batches.delete_one({"id": batch_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Batch not found")
    return {"ok": True}


# -----------------------------------------------------------------------------
# Forecast
# -----------------------------------------------------------------------------
@api.get("/forecast/tomorrow", response_model=ForecastOut)
async def forecast_tomorrow(user: dict = Depends(get_current_user)):
    settings = await get_or_create_settings(user["id"])
    target = date.today() + timedelta(days=1)
    target_str = target.isoformat()
    weekday_name = target.strftime("%A")
    target_dow = target.weekday()

    # Pull batches
    cursor = db.batches.find({"user_id": user["id"]}, {"_id": 0}).sort("date", -1).limit(120)
    batches = await cursor.to_list(length=120)

    notes: list[str] = []
    sample_size = len(batches)

    # Baseline
    if sample_size == 0:
        baseline = 200
        notes.append("No batch history yet — using a generic starting baseline of 200.")
        std_dev = 60
    else:
        sold_values = [b["sold"] for b in batches]
        # day-of-week match
        same_dow = [b["sold"] for b in batches if date.fromisoformat(b["date"]).weekday() == target_dow]
        if len(same_dow) >= 2:
            baseline = round(statistics.mean(same_dow))
            std_dev = statistics.stdev(same_dow) if len(same_dow) >= 2 else statistics.pstdev(sold_values) or 1
            notes.append(f"Based on {len(same_dow)} previous {weekday_name}(s).")
        else:
            baseline = round(statistics.mean(sold_values))
            std_dev = statistics.pstdev(sold_values) or max(round(baseline * 0.15), 10)
            notes.append("Using overall daily average — log more days for day-of-week tuning.")

        # 7-day momentum
        if sample_size >= 14:
            last_7 = [b["sold"] for b in batches[:7]]
            prior_7 = [b["sold"] for b in batches[7:14]]
            if statistics.mean(prior_7) > 0:
                ratio = statistics.mean(last_7) / statistics.mean(prior_7)
                ratio = max(0.7, min(1.3, ratio))
                baseline = round(baseline * ratio)
                if abs(ratio - 1) > 0.03:
                    direction = "up" if ratio > 1 else "down"
                    notes.append(f"Recent 7-day trend is {direction} ({(ratio - 1) * 100:+.0f}%).")

    # Weather
    weather_label = "Disabled"
    weather_factor = 1.0
    if settings["use_weather"]:
        weather_label, weather_factor, _ = await fetch_weather(
            settings["latitude"], settings["longitude"], target_str
        )

    # Holiday
    holiday_name = US_HOLIDAYS.get(target_str, "")
    is_holiday = bool(holiday_name)
    holiday_factor = 1.0
    if settings["use_holidays"] and is_holiday:
        # Holidays usually drive bakery demand up
        holiday_factor = 1.25
        notes.append(f"{holiday_name} — bumping expected demand.")
    elif is_holiday and not settings["use_holidays"]:
        notes.append(f"{holiday_name} (holiday awareness disabled).")

    # Conservative buffer
    conservative_factor = 1.0 - float(settings.get("conservative_buffer") or 0.0)

    predicted = round(baseline * weather_factor * holiday_factor * conservative_factor)
    predicted = max(0, predicted)

    # Closed day check
    closed_days = settings.get("closed_days") or []
    is_closed = target_dow in closed_days
    closed_reason = ""
    if is_closed:
        closed_reason = f"Typically closed on {weekday_name}s"
        notes.append(closed_reason + " — forecast shown for reference.")

    # Confidence
    if sample_size == 0:
        confidence = 35
    else:
        rel = std_dev / max(baseline, 1)
        # confidence shrinks with variance, grows with sample size
        confidence = round(max(40, min(98, 95 - rel * 100 + min(sample_size, 30) * 0.2)))

    range_spread = round(max(std_dev, predicted * 0.05))
    range_low = max(0, predicted - range_spread)
    range_high = predicted + range_spread

    # Flavor distribution
    flavors_settings = settings.get("flavors") or DEFAULT_FLAVORS
    total_weight = sum(int(f["weight"]) for f in flavors_settings) or 1
    flavor_results: list[ForecastFlavor] = []
    running = 0
    for i, f in enumerate(flavors_settings):
        share = round(int(f["weight"]) / total_weight * 100)
        if i == len(flavors_settings) - 1:
            qty = max(0, predicted - running)
        else:
            qty = round(predicted * int(f["weight"]) / total_weight)
            running += qty
        flavor_results.append(ForecastFlavor(name=f["name"], qty=qty, share=share))

    return ForecastOut(
        target_date=target_str,
        weekday=weekday_name,
        predicted=predicted,
        range_low=range_low,
        range_high=range_high,
        confidence=confidence,
        weather_label=weather_label,
        weather_factor=round(weather_factor, 3),
        is_holiday=is_holiday,
        holiday_name=holiday_name,
        holiday_factor=round(holiday_factor, 3),
        conservative_factor=round(conservative_factor, 3),
        baseline=int(baseline),
        sample_size=sample_size,
        flavors=flavor_results,
        notes=notes,
        is_closed=is_closed,
        closed_reason=closed_reason,
    )


# -----------------------------------------------------------------------------
# Stats
# -----------------------------------------------------------------------------
class StatsOut(BaseModel):
    total_sold_7d: int
    total_baked_7d: int
    total_waste_7d: int
    avg_waste_per_day: float
    stockouts_7d: int
    accuracy_pct: int
    week_over_week_change: float


@api.get("/stats", response_model=StatsOut)
async def stats(user: dict = Depends(get_current_user)):
    cursor = db.batches.find({"user_id": user["id"]}, {"_id": 0}).sort("date", -1).limit(14)
    items = await cursor.to_list(length=14)
    last_7 = items[:7]
    prior_7 = items[7:14]
    total_sold_7d = sum(b["sold"] for b in last_7)
    total_baked_7d = sum(b["baked"] for b in last_7)
    total_waste_7d = sum(b["waste"] for b in last_7)
    avg_waste = (total_waste_7d / len(last_7)) if last_7 else 0.0
    stockouts = sum(1 for b in last_7 if b["sold"] == b["baked"] and b["baked"] > 0)
    accuracy = round((1 - (total_waste_7d / total_baked_7d)) * 100) if total_baked_7d else 0
    prior_sold = sum(b["sold"] for b in prior_7)
    wow = ((total_sold_7d - prior_sold) / prior_sold * 100) if prior_sold else 0.0
    return StatsOut(
        total_sold_7d=total_sold_7d,
        total_baked_7d=total_baked_7d,
        total_waste_7d=total_waste_7d,
        avg_waste_per_day=round(avg_waste, 1),
        stockouts_7d=stockouts,
        accuracy_pct=accuracy,
        week_over_week_change=round(wow, 1),
    )


# -----------------------------------------------------------------------------
# Health
# -----------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"message": "DoughCast API", "version": "0.2.0"}


# -----------------------------------------------------------------------------
# App wiring
# -----------------------------------------------------------------------------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.batches.create_index([("user_id", 1), ("date", 1)], unique=True)
    await db.settings.create_index("user_id", unique=True)
    logger.info("DoughCast API ready")


@app.on_event("shutdown")
async def shutdown_event():
    client.close()
