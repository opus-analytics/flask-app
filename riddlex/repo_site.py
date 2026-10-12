"""All SQL for the white-label career site (riddlex_career_sites)."""
import datetime
import json

import mysql.connector

from opus_api.db import get_cursor, get_db

_COLS = ("company_name", "slug", "tagline", "logo_url", "colors", "font",
         "hiring_locations", "languages", "default_language", "published", "updated_at")


def _iso(dt) -> str:
    return dt.isoformat(timespec="milliseconds") + "Z"


def _json(value):
    if isinstance(value, (bytes, bytearray)):
        value = value.decode("utf-8")
    return json.loads(value) if isinstance(value, str) else value


def site_to_json(row) -> dict:
    return {
        "companyName": row["company_name"],
        "slug": row["slug"],
        "tagline": row["tagline"],
        "logoUrl": row["logo_url"],
        "colors": _json(row["colors"]),
        "font": row["font"],
        "hiringLocations": _json(row["hiring_locations"]),
        "languages": _json(row["languages"]),
        "defaultLanguage": row["default_language"],
        "published": bool(row["published"]),
        "updatedAt": _iso(row["updated_at"]),
    }


def get_site(org_email: str):
    cur = get_cursor(dictionary=True)
    cur.execute(f"SELECT {', '.join(_COLS)} FROM riddlex_career_sites WHERE org_email = %s", (org_email,))
    row = cur.fetchone()
    cur.close()
    return site_to_json(row) if row else None


def upsert_site(org_email: str, cfg: dict) -> bool:
    """Insert/update the org's row. Returns False when the slug belongs to another org.

    A slug clash would make ON DUPLICATE KEY UPDATE target the *other* org's row, so every
    assignment is guarded by `org_email = VALUES(org_email)` (a no-op on foreign rows) and the slug
    owner is verified afterwards. A 1062 from UNIQUE(slug) is also reported as a clash.
    """
    # Why this is safe (MySQL 8 / InnoDB): with several UNIQUE keys, ODKU updates ONE conflicting row.
    # - Org already has a row: the PK conflict is found first -> its own row is updated; moving onto a
    #   taken slug then raises 1062 -> False.
    # - Org has no row but the slug is taken: the OTHER org's row is targeted; the IF guard makes every
    #   assignment a no-op there (org_email itself is never assigned), and the owner check -> False.
    # VALUES() is deprecated since 8.0.20 but still supported in 8.0/8.4; the `AS new` row alias needs
    # 8.0.19+ and breaks on MariaDB/older Azure servers, so it is kept deliberately.
    # json.dumps keeps the default ensure_ascii=True: MySQL's JSON parser decodes the \\uXXXX escapes,
    # so Arabic round-trips as real UTF-8 regardless of the connection charset.
    db = get_db()
    cur = db.cursor()
    keep_logo = cfg["logoUrl"] is None  # key absent -> keep stored logo; "" clears it
    values = (
        org_email, cfg["companyName"], cfg["slug"], cfg["tagline"], cfg["logoUrl"] or "",
        json.dumps(cfg["colors"]), cfg["font"], json.dumps(cfg["hiringLocations"]),
        json.dumps(cfg["languages"]), cfg["defaultLanguage"], 1 if cfg["published"] else 0,
        datetime.datetime.utcnow(),
    )
    update_cols = [c for c in _COLS if not (keep_logo and c == "logo_url")]
    guarded = ", ".join(f"{c} = IF(org_email = VALUES(org_email), VALUES({c}), {c})" for c in update_cols)
    sql = (
        f"INSERT INTO riddlex_career_sites (org_email, {', '.join(_COLS)}) "
        f"VALUES ({', '.join(['%s'] * (len(_COLS) + 1))}) ON DUPLICATE KEY UPDATE {guarded}"
    )
    try:
        cur.execute(sql, values)
        cur.execute("SELECT org_email FROM riddlex_career_sites WHERE slug = %s", (cfg["slug"],))
        owner = cur.fetchone()
        if owner is None or owner[0] != org_email:
            db.rollback()
            return False
        db.commit()
        return True
    except mysql.connector.IntegrityError as e:
        db.rollback()
        if e.errno == 1062:
            return False
        raise
    except Exception:
        db.rollback()
        raise
    finally:
        cur.close()
