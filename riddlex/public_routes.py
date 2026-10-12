"""Unauthenticated candidate endpoints under /public/* (token-gated, rate limited)."""
import hmac
import json
import re
import uuid
from urllib.parse import quote

import mysql.connector
from flask import jsonify, request

from . import blob_storage, questionnaire, repo_public, riddlex_bp
from .errors import ApiError
from .limits import limit_apply, limit_get, limit_post, register_rate_limit_handler
from .schemas import EMAIL_PATTERN, LANGUAGES, SLUG_PATTERN

NOT_FOUND = "This job could not be found."
BAD_TOKEN = "This apply link is invalid or has expired."
CLOSED = "This job is no longer accepting applications."
SITE_NOT_FOUND = "This careers page could not be found."
BAD_LANG = "Choose a supported language."

register_rate_limit_handler(riddlex_bp)


def require_public_job(job_id, token):
    """404 missing -> 403 bad/missing token (constant time, in Python) -> 410 closed. Returns the internal job."""
    job = repo_public.get_job(job_id)
    if job is None:
        raise ApiError(404, NOT_FOUND)
    if not isinstance(token, str) or not token:
        raise ApiError(403, BAD_TOKEN)
    if not hmac.compare_digest(token.encode("utf-8"), str(job["publicToken"]).encode("utf-8")):
        raise ApiError(403, BAD_TOKEN)
    if job["status"] != "Open":
        raise ApiError(410, CLOSED)
    return job


def _body():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise ApiError(400, "Invalid request body.")
    return body


def _valid_lang(value):
    if not isinstance(value, str) or value not in LANGUAGES:
        raise ApiError(400, BAD_LANG)
    return value


def _site_for(job):
    return repo_public.get_site_for_org(job["orgEmail"]) or repo_public.default_site()


@riddlex_bp.route("/public/jobs/<job_id>", methods=["GET"])
@limit_get
def public_job(job_id):
    job = require_public_job(job_id, request.args.get("token"))
    return jsonify({"job": repo_public.to_public_job(job), "site": _site_for(job)})


@riddlex_bp.route("/public/questions", methods=["POST"])
@limit_post
def public_questions():
    body = _body()
    lang = _valid_lang(body.get("lang"))  # validated before it can reach the prompt / primary key
    job = require_public_job(body.get("jobId"), body.get("token"))
    return jsonify(repo_public.get_or_create_questionnaire(job, "screening", lang))


@riddlex_bp.route("/public/skills-questionnaire", methods=["POST"])
@limit_post
def public_skills_questionnaire():
    body = _body()
    job = require_public_job(body.get("jobId"), body.get("token"))
    return jsonify(repo_public.get_or_create_questionnaire(job, "skills", "en"))


@riddlex_bp.route("/public/careers/<slug>", methods=["GET"])
@limit_get
def public_careers(slug):
    found = repo_public.get_published_site_by_slug(slug) if SLUG_PATTERN.match(slug) else None
    if found is None:
        raise ApiError(404, SITE_NOT_FOUND)
    org_email, site = found
    jobs = []
    for job in repo_public.list_open_jobs(org_email):
        pub = repo_public.to_public_job(job)
        pub["applyPath"] = f"/riddlex/apply/{quote(job['id'], safe='')}?token={quote(job['publicToken'], safe='')}"
        jobs.append(pub)
    return jsonify({"site": site, "jobs": jobs})


# ---------------------------------------------------------------------------
# POST /public/apply (Task 6)
# ---------------------------------------------------------------------------

MAX_RESUME_BYTES = 5 * 1024 * 1024
MAX_PAYLOAD_CHARS = 200_000
MAX_ANSWER_CHARS = 5000
YEARS_BANDS = ("<1", "1-2", "3-5", "5+")
MSG_BASICS = "Name, a valid email and a resume are required."
MSG_ANSWERS = "Please answer all 3 questions."
MSG_SKILLS = "Please rate every skill in the questionnaire."
MSG_DUPLICATE = "You have already applied to this job with this email."
MSG_RESUME_TYPE = "The resume must be a PDF, DOC or DOCX file."
MSG_RESUME_SIZE = "The resume must be 5 MB or smaller."
MAX_REQUEST_BYTES = MAX_RESUME_BYTES + MAX_PAYLOAD_CHARS * 4 + 64 * 1024  # resume + UTF-8 payload + multipart overhead
# C0/C1 controls (CR/LF header injection), zero-width chars and bidi overrides (RTL spoofing "cv‮fdp.exe").
_CTRL = re.compile("[\x00-\x1f\x7f-\x9f​-‏‪-‮⁦-⁩﻿]")


def sniff_resume(data: bytes):
    """(ext, mime) from magic bytes, or None. The filename is never consulted."""
    if data.startswith(b"%PDF"):
        return "pdf", "application/pdf"
    if data.startswith(b"PK\x03\x04"):
        return "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    if data.startswith(b"\xd0\xcf\x11\xe0"):
        return "doc", "application/msword"
    return None


def safe_file_name(name, ext: str) -> str:
    base = _CTRL.sub("", str(name or "")).replace("\\", "/").split("/")[-1].strip()
    return base[:255] if base not in ("", ".", "..") else f"resume.{ext}"


def parse_payload(raw) -> dict:
    if not isinstance(raw, str) or not raw or len(raw) > MAX_PAYLOAD_CHARS:
        raise ApiError(400, "Invalid request body.")
    try:
        payload = json.loads(raw)
    except ValueError:
        raise ApiError(400, "Invalid request body.") from None
    if not isinstance(payload, dict):
        raise ApiError(400, "Invalid request body.")
    return payload


def _str(v) -> str:
    return v.strip() if isinstance(v, str) else ""


def validate_basics(payload: dict, has_resume: bool) -> dict:
    """Name, email, resume presence (mock order, first check)."""
    ap = payload.get("applicant")
    ap = ap if isinstance(ap, dict) else {}
    name, email, mobile = _str(ap.get("fullName")), _str(ap.get("email")), _str(ap.get("mobileNumber"))
    if (not name or len(name) > 200 or len(email) > 255 or not EMAIL_PATTERN.match(email)
            or len(mobile) > 40 or not has_resume):
        raise ApiError(400, MSG_BASICS)
    return {"name": name, "email": email.lower(), "mobile": mobile}


def validate_answers(payload: dict) -> list:
    answers = payload.get("answers")
    if not isinstance(answers, list) or len(answers) != 3:
        raise ApiError(400, MSG_ANSWERS)
    out = []
    for a in answers:
        text = _str(a.get("answer")) if isinstance(a, dict) else ""
        if not text or len(text) > MAX_ANSWER_CHARS:
            raise ApiError(400, MSG_ANSWERS)
        q = a.get("question")
        out.append({"question": q[:1000] if isinstance(q, str) else "", "answer": text})
    return out


def build_skill_ratings(payload: dict, skills_q: list) -> list:
    """Ratings rebuilt from the PERSISTED questionnaire; unknown/extra client ids are ignored."""
    given = payload.get("skills")
    by_id = {}
    for r in given if isinstance(given, list) else []:
        if isinstance(r, dict) and isinstance(r.get("id"), str):
            by_id.setdefault(r["id"], r)
    out = []
    for q in skills_q:
        r = by_id.get(q["id"])
        prof, years = (r or {}).get("proficiency"), (r or {}).get("years")
        if (r is None or isinstance(prof, bool) or not isinstance(prof, int) or not 1 <= prof <= 5
                or not isinstance(years, str) or years not in YEARS_BANDS):
            raise ApiError(400, MSG_SKILLS)
        out.append({**q, "proficiency": prof, "years": years})
    return out


def _delete_blob(container: str, path: str) -> None:
    try:
        blob_storage.delete(container, path)
    except Exception:  # best effort; never log payload/PII
        pass


@riddlex_bp.route("/public/apply", methods=["POST"])
@limit_apply
def public_apply():
    # No app-wide MAX_CONTENT_LENGTH (legacy app.py multi-file routes need larger bodies), so cap
    # here BEFORE request.form/files parse the body. Unknown length (chunked) is refused too.
    if request.content_length is None or request.content_length > MAX_REQUEST_BYTES:
        raise ApiError(413, MSG_RESUME_SIZE)
    payload = parse_payload(request.form.get("payload"))
    job = require_public_job(payload.get("jobId"), payload.get("token"))

    f = request.files.get("resume")
    data = f.stream.read(MAX_RESUME_BYTES + 1) if f else b""
    basics = validate_basics(payload, bool(data))
    if len(data) > MAX_RESUME_BYTES:
        raise ApiError(400, MSG_RESUME_SIZE)
    kind = sniff_resume(data)
    if kind is None:
        raise ApiError(400, MSG_RESUME_TYPE)
    answers = validate_answers(payload)
    skills = build_skill_ratings(payload, repo_public.get_or_create_questionnaire(job, "skills", "en"))

    ext, mime = kind
    app_id = str(uuid.uuid4())
    container, path = blob_storage.resume_container(), f"resumes/{uuid.uuid4()}.{ext}"
    blob_storage.upload(container, path, data, mime)
    try:
        repo_public.insert_application(app_id, job["id"], {
            **basics,
            "resume_file_name": safe_file_name(f.filename, ext),
            "resume_blob_path": path,
            "answers": answers,
            "skills": skills,
            "skills_match": questionnaire.score_skills(skills),
        })
    except mysql.connector.IntegrityError as e:
        _delete_blob(container, path)
        if e.errno == 1062:
            raise ApiError(409, MSG_DUPLICATE) from None
        raise
    except Exception:
        _delete_blob(container, path)
        raise
    return jsonify({"id": app_id}), 201
