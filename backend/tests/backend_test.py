"""DoughCast backend integration tests against public REACT_APP_BACKEND_URL."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://donut-demand.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

EMAIL = f"test-{int(time.time())}-{uuid.uuid4().hex[:6]}@doughcast.com"
PASSWORD = "mochi123"
BAKERY = "Test Mochi"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth(session):
    r = session.post(f"{API}/auth/register", json={"email": EMAIL, "password": PASSWORD, "bakery_name": BAKERY}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    return data


@pytest.fixture(scope="session")
def token(auth):
    return auth["token"]


@pytest.fixture
def auth_session(session, token):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    return s


# --- Health ---
def test_root_health(session):
    r = session.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    assert r.json().get("message") == "DoughCast API"


# --- Auth ---
def test_register_returns_user_and_token(auth):
    assert "token" in auth and isinstance(auth["token"], str)
    assert auth["user"]["email"] == EMAIL
    assert auth["user"]["bakery_name"] == BAKERY
    assert "id" in auth["user"]


def test_register_duplicate_email_400(session, auth):
    r = session.post(f"{API}/auth/register", json={"email": EMAIL, "password": PASSWORD, "bakery_name": BAKERY}, timeout=10)
    assert r.status_code == 400


def test_login_success(session):
    r = session.post(f"{API}/auth/login", json={"email": EMAIL, "password": PASSWORD}, timeout=10)
    assert r.status_code == 200
    assert r.json()["user"]["email"] == EMAIL
    assert r.json()["token"]


def test_login_invalid_creds_401(session):
    r = session.post(f"{API}/auth/login", json={"email": EMAIL, "password": "wrong"}, timeout=10)
    assert r.status_code == 401


def test_me_requires_token(session):
    r = session.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 401


def test_me_returns_user(auth_session):
    r = auth_session.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 200
    assert r.json()["email"] == EMAIL


# --- Settings ---
def test_settings_default_mochi_flavors(auth_session):
    r = auth_session.get(f"{API}/settings", timeout=10)
    assert r.status_code == 200
    s = r.json()
    names = {f["name"] for f in s["flavors"]}
    assert {"Matcha", "Ube", "Strawberry", "Black Sesame", "Mango", "Classic Glaze"}.issubset(names)
    assert s["use_weather"] is True
    assert s["bakery_name"] == BAKERY


def test_settings_partial_update_persists(auth_session):
    payload = {"conservative_buffer": 0.15, "use_weather": False}
    r = auth_session.put(f"{API}/settings", json=payload, timeout=10)
    assert r.status_code == 200
    assert r.json()["conservative_buffer"] == 0.15
    assert r.json()["use_weather"] is False
    # GET to verify persistence
    g = auth_session.get(f"{API}/settings", timeout=10)
    assert g.json()["conservative_buffer"] == 0.15
    assert g.json()["use_weather"] is False
    # restore weather for forecast tests
    auth_session.put(f"{API}/settings", json={"use_weather": True, "conservative_buffer": 0.05}, timeout=10)


def test_settings_update_flavors(auth_session):
    new_flavors = [{"name": "Matcha", "weight": 50}, {"name": "Ube", "weight": 50}]
    r = auth_session.put(f"{API}/settings", json={"flavors": new_flavors}, timeout=10)
    assert r.status_code == 200
    assert len(r.json()["flavors"]) == 2
    # restore
    default = [
        {"name": "Matcha", "weight": 24}, {"name": "Ube", "weight": 20},
        {"name": "Strawberry", "weight": 16}, {"name": "Black Sesame", "weight": 14},
        {"name": "Mango", "weight": 14}, {"name": "Classic Glaze", "weight": 12},
    ]
    auth_session.put(f"{API}/settings", json={"flavors": default}, timeout=10)


# --- Batches ---
def test_create_batch_and_list_sorted_asc(auth_session):
    from datetime import date, timedelta
    today = date.today()
    dates = [(today - timedelta(days=i)).isoformat() for i in [3, 1, 2]]  # not sorted
    for i, d in enumerate(dates):
        r = auth_session.post(f"{API}/batches", json={"date": d, "baked": 100 + i, "sold": 80 + i, "note": f"d{i}"}, timeout=10)
        assert r.status_code == 200, r.text
    g = auth_session.get(f"{API}/batches", timeout=10)
    assert g.status_code == 200
    items = g.json()
    listed_dates = [b["date"] for b in items]
    assert listed_dates == sorted(listed_dates), f"expected ascending, got {listed_dates}"


def test_create_batch_sold_exceeds_baked_400(auth_session):
    from datetime import date
    r = auth_session.post(f"{API}/batches", json={"date": date.today().isoformat(), "baked": 10, "sold": 99}, timeout=10)
    assert r.status_code == 400


def test_create_batch_upsert_same_date(auth_session):
    from datetime import date, timedelta
    d = (date.today() - timedelta(days=5)).isoformat()
    r1 = auth_session.post(f"{API}/batches", json={"date": d, "baked": 100, "sold": 50}, timeout=10)
    r2 = auth_session.post(f"{API}/batches", json={"date": d, "baked": 120, "sold": 110}, timeout=10)
    assert r1.status_code == 200 and r2.status_code == 200
    assert r1.json()["id"] == r2.json()["id"]
    assert r2.json()["baked"] == 120


def test_delete_batch(auth_session):
    from datetime import date, timedelta
    d = (date.today() - timedelta(days=20)).isoformat()
    r = auth_session.post(f"{API}/batches", json={"date": d, "baked": 50, "sold": 40}, timeout=10)
    bid = r.json()["id"]
    dr = auth_session.delete(f"{API}/batches/{bid}", timeout=10)
    assert dr.status_code == 200
    # Deleting again should 404
    dr2 = auth_session.delete(f"{API}/batches/{bid}", timeout=10)
    assert dr2.status_code == 404


# --- Forecast ---
def test_forecast_tomorrow_shape_and_conservative_factor(auth_session):
    # set buffer 0.20, weather off, holidays off -> conservative_factor = 0.80
    auth_session.put(f"{API}/settings", json={"conservative_buffer": 0.20, "use_weather": False, "use_holidays": False}, timeout=10)
    r = auth_session.get(f"{API}/forecast/tomorrow", timeout=15)
    assert r.status_code == 200
    f = r.json()
    for k in ["predicted", "range_low", "range_high", "confidence", "weather_label", "is_holiday", "flavors", "conservative_factor"]:
        assert k in f
    assert abs(f["conservative_factor"] - 0.80) < 1e-3
    assert isinstance(f["flavors"], list) and len(f["flavors"]) >= 1
    assert f["range_low"] <= f["predicted"] <= f["range_high"]
    # restore
    auth_session.put(f"{API}/settings", json={"conservative_buffer": 0.05, "use_weather": True, "use_holidays": True}, timeout=10)


# --- Stats ---
def test_stats_returns_totals_and_wow(auth_session):
    r = auth_session.get(f"{API}/stats", timeout=10)
    assert r.status_code == 200
    s = r.json()
    for k in ["total_sold_7d", "total_baked_7d", "total_waste_7d", "avg_waste_per_day", "stockouts_7d", "accuracy_pct", "week_over_week_change"]:
        assert k in s
    assert s["total_sold_7d"] >= 0
