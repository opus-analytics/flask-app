"""Route + login-hook tests. Repo and the User/Subscription lookups used by login are monkeypatched."""
from datetime import datetime

import pytest

from routes import auth as auth_routes
from user_stats import repo
from user_stats.routes import stats  # noqa: F401  (ensures route module is loaded)
from user_stats import tracker

SESSION_EXPIRED = "Your session has expired. Please sign in again."


@pytest.fixture
def db(monkeypatch):
    """Replace every repo call used by /stats. Returns a dict of recorded calls."""
    calls = {"emails": []}

    def events_for_user(email):
        calls["emails"].append(email)
        return [
            {"event_type": "feature_use", "feature": "resume_analyze", "product": "Start",
             "created_at": datetime(2026, 10, 2, 9, 0)},
            {"event_type": "login", "feature": None, "product": None,
             "created_at": datetime(2026, 9, 1, 9, 0)},
        ]

    monkeypatch.setattr(repo, "events_for_user", events_for_user)
    monkeypatch.setattr(repo, "subscription_rows", lambda email: [
        {"subscription": "Start", "subscription_status": "Active", "subscription_expiration_date": None},
    ])
    monkeypatch.setattr(repo, "get_user_name", lambda email: "Omar Test")
    monkeypatch.setattr(repo, "tracking_since", lambda: datetime(2026, 9, 1, 8, 0))
    return calls


# --- /api/user/stats ---

def test_stats_without_token_is_401(anon_client):
    r = anon_client.get("/api/user/stats")
    assert r.status_code == 401
    assert r.get_json() == {"message": SESSION_EXPIRED}


def test_stats_bad_token_is_401(client):
    r = client.get("/api/user/stats", headers={"Authorization": "Bearer nope"})
    assert r.status_code == 401
    assert r.get_json() == {"message": SESSION_EXPIRED}


@pytest.mark.parametrize("value", ["0", "13", "abc", "", "-1", "6.5"])
def test_stats_bad_months_is_400(client, bearer, db, value):
    r = client.get(f"/api/user/stats?months={value}", headers=bearer)
    assert r.status_code == 400
    assert "message" in r.get_json()


def test_stats_200_shape(client, bearer, db):
    r = client.get("/api/user/stats?months=3", headers=bearer)
    assert r.status_code == 200
    body = r.get_json()
    assert set(body) == {"user", "scorecards", "featureUsage", "loginsVsFeatures", "recentActivity", "trackingSince"}
    assert body["user"] == {"email": "user@x.com", "fullName": "Omar Test"}
    assert set(body["scorecards"]) == {"usedFeatures", "activeSubscriptions", "monthlyStreak", "logins"}
    assert [r_["month"] for r_ in body["featureUsage"]] == ["2026-08", "2026-09", "2026-10"]
    assert body["featureUsage"][-1]["Start"] == 1
    assert body["loginsVsFeatures"][1]["logins"] == 1
    assert body["recentActivity"][0]["at"] == "2026-10-02T09:00:00.000Z"
    assert body["trackingSince"] == "2026-09-01T08:00:00.000Z"
    assert body["scorecards"]["activeSubscriptions"] == {"value": 1, "products": ["Start"]}


def test_stats_default_months_is_6(client, bearer, db):
    body = client.get("/api/user/stats", headers=bearer).get_json()
    assert len(body["featureUsage"]) == 6
    assert len(body["loginsVsFeatures"]) == 6


def test_stats_email_only_from_token(client, bearer, db):
    r = client.get("/api/user/stats?email=victim@x.com&user_email=victim@x.com", headers=bearer)
    assert r.status_code == 200
    assert r.get_json()["user"]["email"] == "user@x.com"
    assert db["emails"] == ["user@x.com"]


# --- login hook ---

class _FakeUser:
    user_id = 42
    email = "user@x.com"
    full_name = "U"
    user_type = "Client"
    verification_status = "Verified"

    @staticmethod
    def find_by_email(email):
        return _FakeUser()

    def check_password(self, pw):
        return pw == "pw"


class _FakeSub:
    subscription = "Start"


class _FakeSubModel:
    @staticmethod
    def find_by_email(email, include_inactive=False):
        return [_FakeSub()]


@pytest.fixture
def login_env(app_obj, monkeypatch):
    monkeypatch.setattr(auth_routes, "User", _FakeUser)
    monkeypatch.setattr(auth_routes, "Subscription", _FakeSubModel)
    return app_obj.test_client()


def test_login_success_records_login(login_env, monkeypatch):
    logged = []
    monkeypatch.setattr(repo, "insert_event", lambda *a, **k: logged.append(a))
    monkeypatch.setattr(repo, "touch_login", lambda email, when: logged.append(("touch", email)))
    r = login_env.post("/api/auth/login", json={"email": "user@x.com", "password": "pw"})
    assert r.status_code == 200
    assert r.get_json()["message"] == "Login successful"
    assert logged[0][1] == "login" and logged[0][0] == "user@x.com" and logged[0][5] == 42
    assert logged[1] == ("touch", "user@x.com")


def test_login_failed_password_records_nothing(login_env, monkeypatch):
    logged = []
    monkeypatch.setattr(repo, "insert_event", lambda *a, **k: logged.append(a))
    monkeypatch.setattr(repo, "touch_login", lambda *a, **k: logged.append(a))
    r = login_env.post("/api/auth/login", json={"email": "user@x.com", "password": "wrong"})
    assert r.status_code == 401
    assert logged == []


def test_login_still_succeeds_when_tracking_fails(login_env, monkeypatch):
    def fail(*a, **k):
        raise RuntimeError("db write failed")
    monkeypatch.setattr(repo, "insert_event", fail)
    monkeypatch.setattr(repo, "touch_login", fail)
    r = login_env.post("/api/auth/login", json={"email": "user@x.com", "password": "pw"})
    assert r.status_code == 200
    body = r.get_json()
    assert body["message"] == "Login successful"
    assert body["access_token"]
    assert body["subscriptions"] == ["Start"]


def test_login_still_succeeds_when_tracker_itself_breaks(login_env, monkeypatch):
    def fail(*a, **k):
        raise RuntimeError("tracker exploded")
    monkeypatch.setattr(tracker, "record_login", fail)
    r = login_env.post("/api/auth/login", json={"email": "user@x.com", "password": "pw"})
    assert r.status_code == 200
