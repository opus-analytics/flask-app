"""RiddleX jobs: pure validation/mapping plus ALL jobs SQL (parameterised, org-scoped)."""
import json
import secrets
import uuid
from datetime import datetime

from opus_api.db import get_db

from .errors import ApiError
from .schemas import JOB_STATUSES, JOB_TYPES

TITLE_MAX = 200
LOCATION_MAX = 200
TEXT_MAX = 10000
TITLE_MIN = 3
LANGUAGE_MSG = "Choose one of your career site's supported languages."

_COLS = ("id, title, description, requirements, location, job_type, language, status, "
         "public_token, created_at")


def iso(dt: datetime) -> str:
    return dt.isoformat(timespec="milliseconds") + "Z"


def _text(body, key, max_len, label):
    v = body.get(key)
    if v is None:
        return ""
    if not isinstance(v, str):
        raise ApiError(400, f"{label} must be text.")
    v = v.strip()
    if len(v) > max_len:
        raise ApiError(400, f"{label} must be at most {max_len} characters.")
    return v


def validate_job_draft(body, allowed_languages) -> dict:
    """Validate/normalise a POST /jobs body. Raises ApiError(400). Returns clean snake_case fields."""
    if not isinstance(body, dict):
        raise ApiError(400, "Invalid request body.")
    title = _text(body, "title", TITLE_MAX, "Job title")
    if len(title) < TITLE_MIN:
        raise ApiError(400, "Job title must be at least 3 characters.")
    description = _text(body, "description", TEXT_MAX, "Description")
    requirements = _text(body, "requirements", TEXT_MAX, "Requirements")
    location = _text(body, "location", LOCATION_MAX, "Location") or "Remote"
    job_type = body.get("jobType")
    if not isinstance(job_type, str) or job_type not in JOB_TYPES:
        raise ApiError(400, "Choose a valid job type.")
    language = body.get("language")
    if not isinstance(language, str) or language not in list(allowed_languages):
        raise ApiError(400, LANGUAGE_MSG)
    return {"title": title, "description": description, "requirements": requirements,
            "location": location, "job_type": job_type, "language": language}


def validate_status(body) -> str:
    status = body.get("status") if isinstance(body, dict) else None
    if not isinstance(status, str) or status not in JOB_STATUSES:
        raise ApiError(400, "Status must be Open or Closed.")
    return status


def job_row_to_json(row: dict) -> dict:
    created = row["created_at"]
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "requirements": row["requirements"],
        "location": row["location"],
        "jobType": row["job_type"],
        "language": row["language"],
        "status": row["status"],
        "publicToken": row["public_token"],
        "createdAt": iso(created) if isinstance(created, datetime) else created,
    }


def _cursor():
    return get_db().cursor(dictionary=True)


def site_languages(org: str) -> list:
    """Languages enabled on the org's career site; ["en"] when there is no site."""
    cur = _cursor()
    try:
        cur.execute("SELECT languages FROM riddlex_career_sites WHERE org_email = %s", (org,))
        row = cur.fetchone()
    finally:
        cur.close()
    if not row:
        return ["en"]
    langs = row["languages"]
    if isinstance(langs, (bytes, bytearray)):
        langs = langs.decode("utf-8")
    if isinstance(langs, str):
        langs = json.loads(langs)
    return [lang for lang in langs if isinstance(lang, str)] or ["en"]


def jobs_list(org: str) -> list:
    cur = _cursor()
    try:
        cur.execute(f"SELECT {_COLS} FROM riddlex_jobs WHERE org_email = %s "
                    "ORDER BY created_at DESC, id DESC", (org,))
        return [job_row_to_json(r) for r in cur.fetchall()]
    finally:
        cur.close()


def job_get(org: str, job_id: str):
    cur = _cursor()
    try:
        cur.execute(f"SELECT {_COLS} FROM riddlex_jobs WHERE id = %s AND org_email = %s", (job_id, org))
        row = cur.fetchone()
    finally:
        cur.close()
    return job_row_to_json(row) if row else None


def job_create(org: str, fields: dict) -> dict:
    job_id = str(uuid.uuid4())
    token = secrets.token_urlsafe(24)
    now = datetime.utcnow()
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute(
            "INSERT INTO riddlex_jobs (id, org_email, title, description, requirements, location, "
            "job_type, language, status, public_token, created_at) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Open', %s, %s)",
            (job_id, org, fields["title"], fields["description"], fields["requirements"],
             fields["location"], fields["job_type"], fields["language"], token, now),
        )
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        cur.close()
    return job_get(org, job_id)


def job_set_status(org: str, job_id: str, status: str):
    """Returns the updated job, or None when it doesn't exist for this org.

    The UPDATE is org-scoped (a foreign id matches nothing); rowcount is not used because MySQL
    reports 0 affected rows when the status is unchanged, so existence is decided by the scoped SELECT.
    """
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute("UPDATE riddlex_jobs SET status = %s WHERE id = %s AND org_email = %s",
                    (status, job_id, org))
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        cur.close()
    return job_get(org, job_id)
