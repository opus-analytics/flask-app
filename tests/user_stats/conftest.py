"""User-stats test harness. No DB: the repo layer is monkeypatched per test, and the Bearer check is stubbed.

app.config MYSQL_* is pointed at an unresolvable host so any accidental DB access fails fast.
"""
import pytest

GOOD_TOKEN = "good-token"
SESSION_EXPIRED = "Your session has expired. Please sign in again."

_NO_DB = {
    "MYSQL_HOST": "user-stats-no-db.invalid",
    "MYSQL_DATABASE": "user_stats_no_db_test",
    "MYSQL_USER": "nobody",
    "MYSQL_PASSWORD": "nobody",
}


@pytest.fixture
def app_obj():
    from app import app

    saved = {k: app.config.get(k) for k in (*_NO_DB, "TESTING")}
    app.config.update(TESTING=True, **_NO_DB)
    yield app
    app.config.update(saved)


@pytest.fixture
def anon_client(app_obj):
    return app_obj.test_client()


@pytest.fixture
def client(app_obj, monkeypatch):
    """Test client where GOOD_TOKEN is a valid login for user@x.com."""
    from user_stats import auth as stats_auth

    monkeypatch.setattr(
        stats_auth.auth,
        "verify_token_callback",
        lambda token: "user@x.com" if token == GOOD_TOKEN else None,
    )
    return app_obj.test_client()


@pytest.fixture
def bearer():
    return {"Authorization": f"Bearer {GOOD_TOKEN}"}
