"""DoughCast v0.4 backend tests — closed_days, profile update, password change, JWT TTL."""
import os
import time
import uuid
import base64
import jwt as pyjwt
import pytest
import requests
from datetime import date, timedelta

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

STAMP = f"{int(time.time())}-{uuid.uuid4().hex[:6]}"
EMAIL = f"v04-{STAMP}@doughcast.com"
EMAIL2 = f"v04b-{STAMP}@doughcast.com"
PASSWORD = "mochi123"
BAKERY = "V04 Bakery"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth(session):
    r = session.post(f"{API}/auth/register", json={"email": EMAIL, "password": PASSWORD, "bakery_name": BAKERY}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def auth2(session):
    r = session.post(f"{API}/auth/register", json={"email": EMAIL2, "password": PASSWORD, "bakery_name": "Second"}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture
def auth_session(auth):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {auth['token']}"})
    return s


# --- Closed days ---
def test_settings_has_closed_days_default_empty(auth_session):
    r = auth_session.get(f"{API}/settings", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert "closed_days" in data
    assert data["closed_days"] == []


def test_settings_put_closed_days_dedup_sort(auth_session):
    # unsorted + duplicates + out of range — out of range should be filtered
    r = auth_session.put(f"{API}/settings", json={"closed_days": [6, 5, 5, 0, 9, -1]}, timeout=10)
    assert r.status_code == 200
    assert r.json()["closed_days"] == [0, 5, 6]
    g = auth_session.get(f"{API}/settings", timeout=10)
    assert g.json()["closed_days"] == [0, 5, 6]


def test_forecast_marks_closed_when_tomorrow_in_closed_days(auth_session):
    # Figure out tomorrow's weekday
    target_dow = (date.today() + timedelta(days=1)).weekday()
    # Set that weekday as closed; disable weather/holidays for deterministic predicted
    auth_session.put(f"{API}/settings", json={"closed_days": [target_dow], "use_weather": False, "use_holidays": False}, timeout=10)
    r = auth_session.get(f"{API}/forecast/tomorrow", timeout=15)
    assert r.status_code == 200
    f = r.json()
    assert f["is_closed"] is True
    assert f["closed_reason"]
    assert "Typically closed on" in f["closed_reason"]
    assert isinstance(f["predicted"], int)
    assert f["predicted"] > 0  # still positive reference number


def test_forecast_not_closed_when_weekday_not_in_closed_days(auth_session):
    # Pick a weekday that is NOT tomorrow's weekday
    tdow = (date.today() + timedelta(days=1)).weekday()
    other = (tdow + 1) % 7
    auth_session.put(f"{API}/settings", json={"closed_days": [other]}, timeout=10)
    r = auth_session.get(f"{API}/forecast/tomorrow", timeout=15)
    assert r.status_code == 200
    f = r.json()
    assert f["is_closed"] is False
    assert f["closed_reason"] == ""
    assert f["predicted"] > 0
    # cleanup
    auth_session.put(f"{API}/settings", json={"closed_days": []}, timeout=10)


# --- Profile update ---
def test_profile_update_bakery_name_mirrors_to_settings(auth_session):
    new_name = "V04 Updated Bakery"
    r = auth_session.put(f"{API}/profile", json={"bakery_name": new_name}, timeout=10)
    assert r.status_code == 200
    assert r.json()["bakery_name"] == new_name
    s = auth_session.get(f"{API}/settings", timeout=10)
    assert s.json()["bakery_name"] == new_name


def test_profile_update_email_changes(auth_session):
    new_email = f"v04-new-{STAMP}@doughcast.com"
    r = auth_session.put(f"{API}/profile", json={"email": new_email}, timeout=10)
    assert r.status_code == 200
    assert r.json()["email"] == new_email
    # Revert
    auth_session.put(f"{API}/profile", json={"email": EMAIL}, timeout=10)


def test_profile_update_duplicate_email_400(auth_session, auth2):
    r = auth_session.put(f"{API}/profile", json={"email": EMAIL2}, timeout=10)
    assert r.status_code == 400


def test_profile_avatar_set_and_clear(auth_session):
    # Set a tiny JPEG data URL
    tiny = "data:image/jpeg;base64," + base64.b64encode(b"\xff\xd8\xff\xe0" + b"\x00" * 100).decode()
    r = auth_session.put(f"{API}/profile", json={"avatar_url": tiny}, timeout=10)
    assert r.status_code == 200
    assert r.json()["avatar_url"] == tiny
    # Clear with ""
    r2 = auth_session.put(f"{API}/profile", json={"avatar_url": ""}, timeout=10)
    assert r2.status_code == 200
    assert r2.json().get("avatar_url") in (None, "")


def test_profile_avatar_too_large_413(auth_session):
    # >1.4MB payload
    huge = "data:image/jpeg;base64," + ("A" * 1_500_000)
    r = auth_session.put(f"{API}/profile", json={"avatar_url": huge}, timeout=20)
    assert r.status_code == 413


# --- Password change ---
def test_password_change_wrong_current_400(auth_session):
    r = auth_session.post(f"{API}/profile/password", json={"current_password": "wrong", "new_password": "newpass123"}, timeout=10)
    assert r.status_code == 400


def test_password_change_success_and_new_login(session, auth_session):
    new_pwd = "newMochi456"
    r = auth_session.post(f"{API}/profile/password", json={"current_password": PASSWORD, "new_password": new_pwd}, timeout=10)
    assert r.status_code == 200
    # Old password should fail
    bad = session.post(f"{API}/auth/login", json={"email": EMAIL, "password": PASSWORD}, timeout=10)
    assert bad.status_code == 401
    # New password works
    ok = session.post(f"{API}/auth/login", json={"email": EMAIL, "password": new_pwd}, timeout=10)
    assert ok.status_code == 200
    # Revert for other tests
    new_tok = ok.json()["token"]
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {new_tok}"})
    s.post(f"{API}/profile/password", json={"current_password": new_pwd, "new_password": PASSWORD}, timeout=10)


# --- JWT TTL ---
def test_jwt_ttl_is_30_days(auth):
    """Spec says 30-day TTL; decode token (no verify) and check exp - iat ~ 30 days."""
    token = auth["token"]
    payload = pyjwt.decode(token, options={"verify_signature": False, "verify_exp": False})
    assert "exp" in payload
    # exp is epoch seconds; we don't have iat, so compute vs now
    now = time.time()
    remaining_days = (payload["exp"] - now) / 86400
    # Must be roughly 30 days (allow 29.5-30.5 window)
    assert 29.5 <= remaining_days <= 30.5, f"Token TTL is {remaining_days:.2f} days, expected ~30"
