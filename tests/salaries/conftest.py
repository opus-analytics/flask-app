"""Salaries test harness. No DB: the repo layer is monkeypatched per test, and the Bearer check is stubbed.

app.config MYSQL_* is pointed at an unresolvable host so any accidental DB access fails fast.
"""
import pytest

GOOD_TOKEN = "good-token"
SESSION_EXPIRED = "Your session has expired. Please sign in again."

_NO_DB = {
    "MYSQL_HOST": "salaries-no-db.invalid",
    "MYSQL_DATABASE": "salaries_no_db_test",
    "MYSQL_USER": "nobody",
    "MYSQL_PASSWORD": "nobody",
}


@pytest.fixture
def anon_client():
    """Flask test client with no valid token available (401 paths only)."""
    from app import app

    saved = {k: app.config.get(k) for k in (*_NO_DB, "TESTING")}
    app.config.update(TESTING=True, **_NO_DB)
    yield app.test_client()
    app.config.update(saved)


@pytest.fixture
def client(monkeypatch):
    """Test client where GOOD_TOKEN is a valid login. Callers monkeypatch salaries.repo as needed."""
    from app import app
    from salaries import auth as salaries_auth

    saved = {k: app.config.get(k) for k in (*_NO_DB, "TESTING")}
    app.config.update(TESTING=True, **_NO_DB)
    monkeypatch.setattr(
        salaries_auth.auth,
        "verify_token_callback",
        lambda token: "user@x.com" if token == GOOD_TOKEN else None,
    )
    yield app.test_client()
    app.config.update(saved)


@pytest.fixture
def bearer():
    return {"Authorization": f"Bearer {GOOD_TOKEN}"}
