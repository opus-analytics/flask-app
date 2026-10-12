"""RiddleX test harness.

DB fixtures are opt-in (never autouse). They read RIDDLEX_TEST_DB_HOST / _PORT (default 3306) /
_USER / _PASSWORD / _NAME, skip when any is missing, and hard-fail unless the DB name ends in
`_test` so the real database can never be wiped.
"""
import datetime
import os
from pathlib import Path

import jwt
import mysql.connector
import pytest

SCHEMA = Path(__file__).resolve().parents[2] / "riddlex" / "migrations" / "001_schema.sql"
_REQUIRED = ("HOST", "USER", "PASSWORD", "NAME")

# Minimal stand-ins for the pre-existing tables, created in the *test* DB only (IF NOT EXISTS).
_USERS_DDL = """
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NULL,
  company_name VARCHAR(255) NULL,
  user_type VARCHAR(50) NOT NULL DEFAULT 'Standard',
  verification_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  created_at DATETIME NULL,
  login_count INT NOT NULL DEFAULT 0,
  phoneNo VARCHAR(50) NULL,
  verification_token VARCHAR(255) NULL,
  token_expiration DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
"""
_SUBSCRIPTION_DDL = """
CREATE TABLE IF NOT EXISTS subscription (
  my_row_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  subscription VARCHAR(100) NOT NULL,
  subscription_status VARCHAR(20) NOT NULL,
  subscription_from_date DATETIME NULL,
  subscription_expiration_date DATETIME NULL,
  resource_id VARCHAR(255) NULL,
  owner VARCHAR(255) NULL,
  tag VARCHAR(50) NOT NULL DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
"""


def _db_settings():
    env = {k: os.environ.get(f"RIDDLEX_TEST_DB_{k}") for k in _REQUIRED}
    if not all(env.values()):
        pytest.skip("set RIDDLEX_TEST_DB_HOST/_USER/_PASSWORD/_NAME (and optional _PORT) to run DB tests")
    if not env["NAME"].endswith("_test"):
        raise RuntimeError("RIDDLEX_TEST_DB_NAME must end with '_test' (refusing to touch a non-test database)")
    env["PORT"] = int(os.environ.get("RIDDLEX_TEST_DB_PORT") or 3306)
    return env


def _split_sql(text):
    lines = [ln for ln in text.splitlines() if not ln.strip().startswith("--")]
    return [s.strip() for s in "\n".join(lines).split(";") if s.strip()]


def _connect(s):
    return mysql.connector.connect(
        host=s["HOST"], port=s["PORT"], user=s["USER"], password=s["PASSWORD"],
        database=s["NAME"], use_pure=True,
    )


@pytest.fixture(scope="session")
def db_settings():
    return _db_settings()


@pytest.fixture(scope="session")
def _db_schema(db_settings):
    conn = _connect(db_settings)
    cur = conn.cursor()
    cur.execute(_USERS_DDL)
    cur.execute(_SUBSCRIPTION_DDL)
    for stmt in _split_sql(SCHEMA.read_text(encoding="utf-8")):
        cur.execute(stmt)
    conn.commit()
    conn.close()


@pytest.fixture
def db(db_settings, _db_schema):
    """Direct connection to the test DB; riddlex_* (plus the test-only users/subscription) emptied per test."""
    conn = _connect(db_settings)
    cur = conn.cursor()
    cur.execute("SET FOREIGN_KEY_CHECKS=0")
    cur.execute("SHOW TABLES")
    for (name,) in cur.fetchall():
        if name.startswith("riddlex_") or name in ("users", "subscription"):
            cur.execute(f"TRUNCATE TABLE `{name}`")
    cur.execute("SET FOREIGN_KEY_CHECKS=1")
    conn.commit()
    yield conn
    conn.close()


_NO_DB = {  # .invalid never resolves (RFC 2606): any accidental DB access fails instead of hitting prod
    "MYSQL_HOST": "riddlex-no-db.invalid",
    "MYSQL_DATABASE": "riddlex_no_db_test",
    "MYSQL_USER": "nobody",
    "MYSQL_PASSWORD": "nobody",
}


@pytest.fixture
def anon_client():
    """Flask test client that needs no DB (unauthenticated / handler-only tests).

    app.config ships with the real MYSQL_* values from opus_api.config, so they are swapped for an
    unresolvable host for the duration of the test.
    """
    from app import app

    saved = {k: app.config.get(k) for k in (*_NO_DB, "TESTING")}
    app.config.update(TESTING=True, **_NO_DB)
    yield app.test_client()
    app.config.update(saved)


@pytest.fixture
def client(db, db_settings):
    """Flask test client whose request handlers hit the TEST database (MYSQL_* from RIDDLEX_TEST_DB_*)."""
    from app import app

    if db_settings["PORT"] != 3306:
        # opus_api.db.get_db does not pass a port, so handlers can only reach port 3306.
        raise RuntimeError("opus_api.db.get_db connects on the default port 3306 only")
    keys = ("MYSQL_HOST", "MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD", "TESTING")
    saved = {k: app.config.get(k) for k in keys}
    app.config.update(
        TESTING=True,
        MYSQL_HOST=db_settings["HOST"],
        MYSQL_DATABASE=db_settings["NAME"],
        MYSQL_USER=db_settings["USER"],
        MYSQL_PASSWORD=db_settings["PASSWORD"],
    )
    yield app.test_client()
    app.config.update(saved)


@pytest.fixture
def auth_headers(db):
    """auth_headers(org=, user=, subscription="RiddleX", status="active", expires_in_days=365); None subscription = no row."""
    from app import app

    def make(org="owner@x.com", user="owner@x.com", subscription="RiddleX", status="active", expires_in_days=365):
        cur = db.cursor()
        cur.execute(
            "INSERT INTO users (email, password_hash, verification_status, created_at) "
            "VALUES (%s, 'x', 'Verified', NOW()) ON DUPLICATE KEY UPDATE verification_status='Verified'",
            (user,),
        )
        cur.execute("SELECT user_id FROM users WHERE email=%s", (user,))
        user_id = cur.fetchone()[0]
        if subscription is not None:
            cur.execute(
                "INSERT INTO subscription (email, subscription, subscription_status, subscription_from_date, "
                "subscription_expiration_date, resource_id, owner) "
                "VALUES (%s, %s, %s, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL %s DAY), %s, %s)",
                (user, subscription, status, expires_in_days, f"res-{user}-{subscription}", org),
            )
        db.commit()
        token = jwt.encode(
            {
                "user_id": user_id,
                "user_email": user,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1),
            },
            app.config["JWT_SECRET_KEY"],
            algorithm=app.config["JWT_ALGORITHM"],
        )
        return {"Authorization": f"Bearer {token}"}

    return make
