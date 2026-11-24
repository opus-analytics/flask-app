"""User-stats SQL. Every query is parameterised (%s only); nothing is formatted into SQL."""
import json

from opus_api.db import get_cursor, get_db


def _fetch_all(sql, params=()):
    cur = get_cursor(dictionary=True)
    try:
        cur.execute(sql, params)
        return cur.fetchall()
    finally:
        cur.close()


def _fetch_one(sql, params=()):
    cur = get_cursor(dictionary=True)
    try:
        cur.execute(sql, params)
        return cur.fetchone()
    finally:
        cur.close()


def insert_event(email, event_type, feature, product, meta, user_id, created_at):
    cur = get_cursor()
    try:
        cur.execute(
            "INSERT INTO user_activity (user_email, user_id, event_type, feature, product, meta, created_at) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (email, user_id, event_type, feature, product,
             json.dumps(meta) if meta is not None else None, created_at),
        )
        get_db().commit()
    finally:
        cur.close()


def touch_login(email, when):
    cur = get_cursor()
    try:
        cur.execute(
            "UPDATE users SET last_login_at = %s, login_count = COALESCE(login_count, 0) + 1 WHERE email = %s",
            (when, email),
        )
        get_db().commit()
    finally:
        cur.close()


def get_user_name(email):
    row = _fetch_one("SELECT full_name FROM users WHERE email = %s", (email,))
    return row["full_name"] if row else None


def events_for_user(email):
    return _fetch_all(
        "SELECT event_type, feature, product, created_at FROM user_activity "
        "WHERE user_email = %s ORDER BY created_at DESC",
        (email,),
    )


def subscription_rows(email):
    return _fetch_all(
        "SELECT subscription, subscription_status, subscription_expiration_date FROM subscription "
        "WHERE email = %s AND subscription_status = 'Active'",
        (email,),
    )


def tracking_since():
    row = _fetch_one("SELECT MIN(created_at) AS first_at FROM user_activity")
    return row["first_at"] if row else None
