"""Connector DB access. Parameterised SQL only, every call keyed by the user's email."""
import logging

import mysql.connector

from opus_api.db import get_cursor, get_db

log = logging.getLogger("connectors")

STATUSES = ("active", "revoked", "error")
_COLS = "id, user_email, provider, account_label, refresh_token_enc, scopes, status, updated_at"

# Plan flag: at least one Active, unexpired subscription row of this user with connectors_enabled = 1.
_ENABLED_SQL = """
SELECT 1 FROM subscription
WHERE email = %s AND subscription_status = 'Active'
  AND (subscription_expiration_date IS NULL OR subscription_expiration_date > NOW())
  AND connectors_enabled = 1
LIMIT 1
"""


def get_account(email, provider):
    cur = get_cursor(dictionary=True)
    cur.execute(f"SELECT {_COLS} FROM connector_accounts WHERE user_email = %s AND provider = %s",
                (email, provider))
    return cur.fetchone()


def list_accounts(email):
    cur = get_cursor(dictionary=True)
    cur.execute(f"SELECT {_COLS} FROM connector_accounts WHERE user_email = %s", (email,))
    return cur.fetchall()


def upsert_account(email, provider, label, refresh_token_enc, scopes):
    cur = get_cursor()
    cur.execute(
        "INSERT INTO connector_accounts (user_email, provider, account_label, refresh_token_enc, scopes, status) "
        "VALUES (%s, %s, %s, %s, %s, 'active') "
        "ON DUPLICATE KEY UPDATE account_label = VALUES(account_label), "
        "refresh_token_enc = VALUES(refresh_token_enc), scopes = VALUES(scopes), "
        "status = 'active', updated_at = NOW(3)",
        (email, provider, label, refresh_token_enc, scopes),
    )
    get_db().commit()


def update_refresh_token(email, provider, refresh_token_enc):
    cur = get_cursor()
    cur.execute("UPDATE connector_accounts SET refresh_token_enc = %s, updated_at = NOW(3) "
                "WHERE user_email = %s AND provider = %s", (refresh_token_enc, email, provider))
    get_db().commit()


def set_status(email, provider, status):
    if status not in STATUSES:
        raise ValueError("invalid connector status")
    cur = get_cursor()
    cur.execute("UPDATE connector_accounts SET status = %s, updated_at = NOW(3) "
                "WHERE user_email = %s AND provider = %s", (status, email, provider))
    get_db().commit()


def delete_account(email, provider):
    cur = get_cursor()
    cur.execute("DELETE FROM connector_accounts WHERE user_email = %s AND provider = %s", (email, provider))
    get_db().commit()


def connectors_enabled(email) -> bool:
    try:
        cur = get_cursor()
        cur.execute(_ENABLED_SQL, (email,))
        return cur.fetchone() is not None
    except mysql.connector.Error as err:
        # Usually means migrations/001_connectors.sql has not been applied. Treat as disabled, no PII logged.
        log.warning("connector plan flag check failed errno=%s", err.errno)
        return False
