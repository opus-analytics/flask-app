"""RiddleX jobs: pure validation/mapping plus ALL jobs SQL (parameterised, org-scoped)."""
import json
import re
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
MAX_QUESTIONS = 20
QUESTION_TYPES = ("text", "textarea", "select")
_QID = re.compile(r"^[a-z0-9_-]{1,40}\Z")
LANGUAGE_MSG = "Choose one of your career site's supported languages."

_COLS = ("id, title, description, requirements, location, job_type, language, status, "
         "public_token, created_at, custom_questions")


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


def validate_custom_questions(raw) -> list:
    """Validate a customQuestions list. Raises ApiError(400). Returns normalised questions."""
    if not isinstance(raw, list):
        raise ApiError(400, "Custom questions must be a list.")
    if len(raw) > MAX_QUESTIONS:
        raise ApiError(400, f"Add at most {MAX_QUESTIONS} custom questions.")
    out, seen = [], set()
    for q in raw:
        if not isinstance(q, dict):
            raise ApiError(400, "Invalid custom question.")
        qid, label, qtype, req = q.get("id"), q.get("label"), q.get("type"), q.get("required")
        if not isinstance(qid, str) or not _QID.match(qid) or qid in seen:
            raise ApiError(400, "Each custom question needs a unique id (a-z, 0-9, _ or -, up to 40 characters).")
        seen.add(qid)
        label = label.strip() if isinstance(label, str) else ""
        if not 1 <= len(label) <= 200:
            raise ApiError(400, "Each custom question needs a label of 1-200 characters.")
        if qtype not in QUESTION_TYPES:
            raise ApiError(400, "Custom question type must be text, textarea or select.")
        if not isinstance(req, bool):
            raise ApiError(400, "Custom question required must be true or false.")
        item = {"id": qid, "label": label, "type": qtype, "required": req}
        opts = q.get("options")
        if qtype == "select":
            if isinstance(opts, list) and all(isinstance(o, str) for o in opts):
                opts = [o.strip() for o in opts]
            if (not isinstance(opts, list) or not 2 <= len(opts) <= 20
                    or not all(isinstance(o, str) and 1 <= len(o) <= 100 for o in opts)
                    or len(set(opts)) != len(opts)):
                raise ApiError(400, "Select questions need 2-20 unique options of 1-100 characters.")
            item["options"] = opts
        elif opts:
            raise ApiError(400, "Only select questions can have options.")
        out.append(item)
    return out


def validate_status(body) -> str:
    status = body.get("status") if isinstance(body, dict) else None
    if not isinstance(status, str) or status not in JOB_STATUSES:
        raise ApiError(400, "Status must be Open or Closed.")
    return status


def parse_questions(value) -> list:
    """JSON column -> list ([] for NULL)."""
    if isinstance(value, (bytes, bytearray)):
        value = value.decode("utf-8")
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (ValueError, TypeError):
            return []
    return value if isinstance(value, list) and value else []


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
        "customQuestions": parse_questions(row.get("custom_questions")),
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
            "job_type, language, status, public_token, created_at, custom_questions) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Open', %s, %s, %s)",
            (job_id, org, fields["title"], fields["description"], fields["requirements"],
             fields["location"], fields["job_type"], fields["language"], token, now,
             json.dumps(fields["custom_questions"], ensure_ascii=False) if fields.get("custom_questions") else None),
        )
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        cur.close()
    return job_get(org, job_id)


def job_set_questions(org: str, job_id: str, questions: list):
    """Replace the job's custom questions; returns the updated job or None (org-scoped, like job_set_status)."""
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute("UPDATE riddlex_jobs SET custom_questions = %s WHERE id = %s AND org_email = %s",
                    (json.dumps(questions, ensure_ascii=False) if questions else None, job_id, org))
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
