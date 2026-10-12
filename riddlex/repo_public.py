"""All SQL for the unauthenticated candidate flow (public job/site reads, questionnaire persistence).

Tokens are never compared in SQL: `get_job` returns the row (incl. the secret `public_token`,
under key "publicToken") and the route layer does the constant-time comparison. Use
`to_public_job` before anything leaves the server.
"""
import copy
import json
from datetime import datetime

from opus_api.db import get_db

from . import questionnaire
from .schemas import LANGUAGES

KINDS = ("screening", "skills")
AI_TEXT_MAX = 4000  # per job text field sent to the AI / stored-questionnaire generator

DEFAULT_SITE = {
    "companyName": "Opus Analytics",
    "slug": "",
    "tagline": "",
    "logoUrl": "",
    "colors": {"primary": "#b94f9c", "accent": "#8884d8", "background": "#ffffff", "text": "#131316"},
    "font": "inter",
    "hiringLocations": [],
    "languages": ["en"],
    "defaultLanguage": "en",
    "published": False,
}

_JOB_COLS = ("id, org_email, title, description, requirements, location, job_type, language, "
             "status, public_token, created_at")
_SITE_COLS = ("org_email, company_name, slug, tagline, logo_url, colors, font, hiring_locations, "
              "languages, default_language, published")


def default_site() -> dict:
    return copy.deepcopy(DEFAULT_SITE)


def _iso(dt) -> str:
    return dt.isoformat(timespec="milliseconds") + "Z" if isinstance(dt, datetime) else dt


def _json(value):
    if isinstance(value, (bytes, bytearray)):
        value = value.decode("utf-8")
    return json.loads(value) if isinstance(value, str) else value


def _cursor():
    return get_db().cursor(dictionary=True)


def _row_to_job(row: dict) -> dict:
    return {
        "id": row["id"],
        "orgEmail": row["org_email"],
        "title": row["title"],
        "description": row["description"],
        "requirements": row["requirements"],
        "location": row["location"],
        "jobType": row["job_type"],
        "language": row["language"],
        "status": row["status"],
        "publicToken": row["public_token"],
        "createdAt": _iso(row["created_at"]),
    }


def to_public_job(job: dict) -> dict:
    """Strip every server-only field (publicToken, orgEmail)."""
    return {k: v for k, v in job.items() if k not in ("publicToken", "orgEmail")}


def site_row_to_public(row: dict) -> dict:
    """DB career-site row -> PublicCareerSite (camelCase, `logoUrl`, no updatedAt/org)."""
    return {
        "companyName": row["company_name"],
        "slug": row["slug"],
        "tagline": row["tagline"] or "",
        "logoUrl": row["logo_url"] or "",
        "colors": _json(row["colors"]),
        "font": row["font"],
        "hiringLocations": _json(row["hiring_locations"]),
        "languages": _json(row["languages"]),
        "defaultLanguage": row["default_language"],
        "published": bool(row["published"]),
    }


def get_job(job_id):
    """Job (internal shape, incl. publicToken/orgEmail) or None."""
    if not isinstance(job_id, str) or not job_id or len(job_id) > 64:
        return None
    cur = _cursor()
    try:
        cur.execute(f"SELECT {_JOB_COLS} FROM riddlex_jobs WHERE id = %s", (job_id,))
        row = cur.fetchone()
    finally:
        cur.close()
    return _row_to_job(row) if row else None


def get_site_for_org(org_email):
    """PublicCareerSite for the org, or None when the org has no site row."""
    cur = _cursor()
    try:
        cur.execute(f"SELECT {_SITE_COLS} FROM riddlex_career_sites WHERE org_email = %s", (org_email,))
        row = cur.fetchone()
    finally:
        cur.close()
    return site_row_to_public(row) if row else None


def get_published_site_by_slug(slug):
    """(org_email, PublicCareerSite) for a published site, else None."""
    if not isinstance(slug, str) or not slug or len(slug) > 80:
        return None
    cur = _cursor()
    try:
        cur.execute(f"SELECT {_SITE_COLS} FROM riddlex_career_sites WHERE slug = %s AND published = 1",
                    (slug,))
        row = cur.fetchone()
    finally:
        cur.close()
    return (row["org_email"], site_row_to_public(row)) if row else None


def list_open_jobs(org_email):
    """Open jobs (internal shape, newest first)."""
    cur = _cursor()
    try:
        cur.execute(f"SELECT {_JOB_COLS} FROM riddlex_jobs WHERE org_email = %s AND status = 'Open' "
                    "ORDER BY created_at DESC, id DESC", (org_email,))
        return [_row_to_job(r) for r in cur.fetchall()]
    finally:
        cur.close()


# ---------------------------------------------------------------------------
# Questionnaire persistence (Task 4)
# ---------------------------------------------------------------------------

def _truncated(job: dict) -> dict:
    return {k: (v[:AI_TEXT_MAX] if isinstance(v, str) else v) for k, v in job.items()}


def _read_questionnaire(job_id, kind, lang):
    cur = _cursor()
    try:
        cur.execute("SELECT payload FROM riddlex_job_questionnaires "
                    "WHERE job_id = %s AND kind = %s AND lang = %s", (job_id, kind, lang))
        row = cur.fetchone()
    finally:
        cur.close()
    return _json(row["payload"]) if row else None


def get_or_create_questionnaire(job: dict, kind: str, lang: str) -> list:
    """Persisted questionnaire for (job, kind, lang); generated once, then identical forever.

    `lang` must already be validated against LANGUAGES by the caller (re-checked here because it
    becomes part of the primary key and the AI prompt). Skills questionnaires are English-only.
    """
    if kind not in KINDS:
        raise ValueError("kind must be 'screening' or 'skills'")
    if kind == "skills":
        lang = "en"
    if lang not in LANGUAGES:
        raise ValueError("unsupported language")

    existing = _read_questionnaire(job["id"], kind, lang)
    if existing is not None:
        return existing

    payload, source = questionnaire.generate_with_fallback(_truncated(job), kind, lang)
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute(
            "INSERT INTO riddlex_job_questionnaires (job_id, kind, lang, payload, generated_by, created_at) "
            "VALUES (%s, %s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE job_id = job_id",
            (job["id"], kind, lang, json.dumps(payload, ensure_ascii=False), source, datetime.utcnow()),
        )
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        cur.close()
    # Re-read so concurrent first requests converge on whichever row won.
    stored = _read_questionnaire(job["id"], kind, lang)
    return stored if stored is not None else payload


# ---------------------------------------------------------------------------
# Application submission (Task 6)
# ---------------------------------------------------------------------------

def insert_application(app_id: str, job_id: str, a: dict) -> None:
    """Insert the application and its first history row (stage New) in ONE transaction.

    `a` carries the already-validated fields. A duplicate (job, email) surfaces as
    mysql.connector.IntegrityError (errno 1062) for the caller to map to 409; any error rolls back.
    """
    now = datetime.utcnow()
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute(
            "INSERT INTO riddlex_applications (id, job_id, applicant_name, applicant_email, mobile_number, "
            "resume_file_name, resume_blob_path, answers, skills, skills_match, stage, notes, created_at, "
            "updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'New', '', %s, %s)",
            (app_id, job_id, a["name"], a["email"], a["mobile"], a["resume_file_name"],
             a["resume_blob_path"], json.dumps(a["answers"], ensure_ascii=False),
             json.dumps(a["skills"], ensure_ascii=False), a["skills_match"], now, now),
        )
        cur.execute(
            "INSERT INTO riddlex_application_history (application_id, stage, at) VALUES (%s, 'New', %s)",
            (app_id, now),
        )
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        cur.close()
