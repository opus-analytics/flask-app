"""RiddleX applications + dashboard: pure validation/calculators plus ALL applications SQL.

Every query reaches applications through riddlex_jobs and filters on j.org_email, so a foreign
application id simply matches nothing (the routes turn that into 404).
"""
import datetime
import json
import math

from opus_api.db import get_db

from .errors import ApiError
from .repo_jobs import _COLS as _JOB_COLS, iso, job_row_to_json
from .schemas import STAGES

SORTS = ("newest", "oldest", "match")
PAGE_SIZE_DEFAULT = 50
PAGE_SIZE_MAX = 100
QUERY_MAX = 200
NOTES_MAX = 5000
ACTIVE_STAGES = ("New", "In Review", "Interview", "Offer")  # mirrors RiddleXDashboard.tsx
REACHED_INTERVIEW_STAGES = ("Interview", "Offer", "Hired")  # mirrors RiddleXDashboard.tsx
TREND_DAYS = 30
WEEK_DAYS = 7
AWAITING_REVIEW_LIMIT = 5

_ORDER = {
    "newest": "a.created_at DESC, a.id DESC",
    "oldest": "a.created_at ASC, a.id ASC",
    "match": "a.skills_match DESC, a.created_at DESC, a.id DESC",
}
_APP_COLS = ("a.id, a.job_id, a.applicant_name, a.applicant_email, a.mobile_number, "
             "a.resume_file_name, a.answers, a.skills, a.skills_match, a.stage, a.notes, "
             "a.created_at, a.updated_at, j.title AS job_title")
_FROM = "FROM riddlex_applications a JOIN riddlex_jobs j ON j.id = a.job_id"


# ---------------------------------------------------------------- pure helpers

def _int_arg(raw, default, label, lo):
    if raw is None or raw == "":
        return default
    try:
        value = int(raw)
    except (TypeError, ValueError):
        raise ApiError(400, f"{label} must be a whole number.")
    if value < lo:
        raise ApiError(400, f"{label} must be at least {lo}.")
    return value


def parse_list_args(args) -> dict:
    """Validate GET /applications query params (a dict or werkzeug MultiDict). Raises ApiError(400)."""
    stage = args.get("stage") or ""
    if stage and stage not in STAGES:
        raise ApiError(400, "Choose a valid stage.")
    sort = args.get("sort") or "newest"
    if sort not in SORTS:
        raise ApiError(400, "Sort must be newest, oldest or match.")
    q = (args.get("q") or "").strip()
    if len(q) > QUERY_MAX:
        raise ApiError(400, f"Search must be at most {QUERY_MAX} characters.")
    page_size = _int_arg(args.get("pageSize"), PAGE_SIZE_DEFAULT, "Page size", 1)
    return {
        "job_id": (args.get("jobId") or "").strip(),
        "stage": stage,
        "q": q,
        "sort": sort,
        "page": _int_arg(args.get("page"), 1, "Page", 1),
        "page_size": min(page_size, PAGE_SIZE_MAX),
    }


def escape_like(text: str) -> str:
    """Escape LIKE wildcards (and the escape char itself) so user input matches literally."""
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def validate_update(body):
    """Validate a PATCH /applications/<id> body -> (stage, notes-or-None). Raises ApiError(400).

    notes None means "leave the stored notes unchanged".
    """
    if not isinstance(body, dict):
        raise ApiError(400, "Invalid request body.")
    stage = body.get("stage")
    if not isinstance(stage, str) or stage not in STAGES:
        raise ApiError(400, "Choose a valid stage.")
    notes = body.get("notes")
    if notes is not None:
        if not isinstance(notes, str):
            raise ApiError(400, "Notes must be text.")
        if len(notes) > NOTES_MAX:
            raise ApiError(400, f"Notes must be at most {NOTES_MAX} characters.")
    return stage, notes


def _json_col(value):
    if isinstance(value, (bytes, bytearray)):
        value = value.decode("utf-8")
    if isinstance(value, str):
        return json.loads(value)
    return value


def _ts(value):
    return iso(value) if isinstance(value, datetime.datetime) else value


def application_row_to_json(row: dict, history: list, with_job: bool = True) -> dict:
    """Map a joined applications row to the camelCase Application / ApplicationWithJob shape.

    Explicit key list: resume_blob_path is never copied into the output.
    """
    out = {
        "id": row["id"],
        "jobId": row["job_id"],
        "applicantName": row["applicant_name"],
        "applicantEmail": row["applicant_email"],
        "mobileNumber": row["mobile_number"],
        "resumeFileName": row["resume_file_name"],
        "answers": _json_col(row["answers"]),
        "skills": _json_col(row["skills"]),
        "skillsMatch": int(row["skills_match"]),
        "stage": row["stage"],
        "notes": row["notes"],
        "createdAt": _ts(row["created_at"]),
        "updatedAt": _ts(row["updated_at"]),
        "history": history,
    }
    if with_job:
        out["jobTitle"] = row["job_title"]
    return out


def round_half_up(x: float) -> int:
    """Same as JS Math.round for non-negative values (.5 rounds up)."""
    return math.floor(x + 0.5)


def pct(n: int, d: int) -> int:
    """Whole-number percentage; 0 when the denominator is 0 (UI shows a dash in that case)."""
    return round_half_up(n / d * 100) if d else 0


def avg_match(match_sum: int, count: int):
    """Average skills match rounded like the UI; None when there are no applications."""
    return round_half_up(match_sum / count) if count else None


def job_stats(stage_counts: dict, match_sum: int) -> dict:
    """newCount / active / hired / avgMatch for one job from its per-stage counts."""
    count = sum(stage_counts.values())
    return {
        "newCount": stage_counts.get("New", 0),
        "active": sum(stage_counts.get(s, 0) for s in ACTIVE_STAGES),
        "hired": stage_counts.get("Hired", 0),
        "avgMatch": avg_match(match_sum, count),
    }


def trend_dates(today: datetime.date, days: int = TREND_DAYS) -> list:
    """ISO dates for the trend window, oldest first, ending today (UTC)."""
    return [(today - datetime.timedelta(days=i)).isoformat() for i in range(days - 1, -1, -1)]


def build_trend(counts_by_date: dict, today: datetime.date, days: int = TREND_DAYS) -> list:
    return [{"date": d, "count": int(counts_by_date.get(d, 0))} for d in trend_dates(today, days)]


# ---------------------------------------------------------------- SQL

def _cursor():
    return get_db().cursor(dictionary=True)


def _histories(cur, app_ids) -> dict:
    """{application_id: [{stage, at}, ...]} in ascending order, fetched in one query."""
    if not app_ids:
        return {}
    marks = ",".join(["%s"] * len(app_ids))
    cur.execute(
        "SELECT id, application_id, stage, at FROM riddlex_application_history "
        f"WHERE application_id IN ({marks}) ORDER BY at ASC, id ASC",
        tuple(app_ids),
    )
    out = {}
    for r in cur.fetchall():
        out.setdefault(r["application_id"], []).append({"stage": r["stage"], "at": iso(r["at"])})
    return out


def applications_list(org: str, args: dict) -> dict:
    where = ["j.org_email = %s"]
    params = [org]
    if args["job_id"]:
        where.append("a.job_id = %s")
        params.append(args["job_id"])
    if args["stage"]:
        where.append("a.stage = %s")
        params.append(args["stage"])
    if args["q"]:
        pattern = f"%{escape_like(args['q'])}%"
        where.append("(a.applicant_name LIKE %s OR a.applicant_email LIKE %s)")
        params += [pattern, pattern]
    where_sql = " AND ".join(where)
    offset = (args["page"] - 1) * args["page_size"]

    cur = _cursor()
    try:
        cur.execute(f"SELECT COUNT(*) AS n {_FROM} WHERE {where_sql}", tuple(params))
        total = int(cur.fetchone()["n"])
        cur.execute(
            f"SELECT {_APP_COLS} {_FROM} WHERE {where_sql} ORDER BY {_ORDER[args['sort']]} "
            "LIMIT %s OFFSET %s",
            tuple(params + [args["page_size"], offset]),
        )
        rows = cur.fetchall()
        hist = _histories(cur, [r["id"] for r in rows])
    finally:
        cur.close()
    return {
        "items": [application_row_to_json(r, hist.get(r["id"], [])) for r in rows],
        "total": total,
        "page": args["page"],
        "pageSize": args["page_size"],
    }


def application_get(org: str, app_id: str, with_job: bool = True):
    cur = _cursor()
    try:
        cur.execute(f"SELECT {_APP_COLS} {_FROM} WHERE a.id = %s AND j.org_email = %s", (app_id, org))
        row = cur.fetchone()
        if row is None:
            return None
        hist = _histories(cur, [app_id]).get(app_id, [])
    finally:
        cur.close()
    return application_row_to_json(row, hist, with_job)


def application_update(org: str, app_id: str, stage: str, notes):
    """Set stage (+ optional notes) in ONE transaction. History row only when the stage changed.

    Returns the updated Application, or None when the id is not visible to this org.
    """
    db = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute(
            "SELECT a.stage FROM riddlex_applications a JOIN riddlex_jobs j ON j.id = a.job_id "
            "WHERE a.id = %s AND j.org_email = %s FOR UPDATE",
            (app_id, org),
        )
        row = cur.fetchone()
        if row is None:
            db.rollback()
            return None
        now = datetime.datetime.utcnow()
        if row["stage"] != stage:
            cur.execute(
                "INSERT INTO riddlex_application_history (application_id, stage, at) VALUES (%s, %s, %s)",
                (app_id, stage, now),
            )
        cur.execute(
            "UPDATE riddlex_applications SET stage = %s, notes = COALESCE(%s, notes), updated_at = %s "
            "WHERE id = %s",
            (stage, notes, now, app_id),
        )
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        cur.close()
    return application_get(org, app_id, with_job=False)


def application_resume(org: str, app_id: str):
    """{blobPath, fileName} for the resume, or None. Internal: routes must not return blobPath."""
    cur = _cursor()
    try:
        cur.execute(
            "SELECT a.resume_blob_path, a.resume_file_name FROM riddlex_applications a "
            "JOIN riddlex_jobs j ON j.id = a.job_id WHERE a.id = %s AND j.org_email = %s",
            (app_id, org),
        )
        row = cur.fetchone()
    finally:
        cur.close()
    if row is None:
        return None
    return {"blobPath": row["resume_blob_path"], "fileName": row["resume_file_name"]}


def dashboard(org: str, now: datetime.datetime = None) -> dict:
    """GET /dashboard payload. Five queries total, no per-job lookups."""
    now = now or datetime.datetime.utcnow()
    today = now.date()
    week_ago = now - datetime.timedelta(days=WEEK_DAYS)
    trend_start = datetime.datetime.combine(today - datetime.timedelta(days=TREND_DAYS - 1), datetime.time.min)
    reached_marks = ",".join(["%s"] * len(REACHED_INTERVIEW_STAGES))

    cur = _cursor()
    try:
        cur.execute(f"SELECT {_JOB_COLS} FROM riddlex_jobs WHERE org_email = %s "
                    "ORDER BY created_at DESC, id DESC", (org,))
        jobs = cur.fetchall()

        cur.execute(f"SELECT a.job_id, a.stage, COUNT(*) AS n, SUM(a.skills_match) AS match_sum "
                    f"{_FROM} WHERE j.org_email = %s GROUP BY a.job_id, a.stage", (org,))
        grouped = cur.fetchall()

        cur.execute(
            "SELECT COUNT(DISTINCT h.application_id) AS n FROM riddlex_application_history h "
            "JOIN riddlex_applications a ON a.id = h.application_id "
            "JOIN riddlex_jobs j ON j.id = a.job_id "
            f"WHERE j.org_email = %s AND h.stage IN ({reached_marks})",
            (org, *REACHED_INTERVIEW_STAGES),
        )
        reached = int(cur.fetchone()["n"])

        cur.execute(f"SELECT COUNT(*) AS n {_FROM} WHERE j.org_email = %s AND a.created_at >= %s",
                    (org, week_ago))
        new_this_week = int(cur.fetchone()["n"])

        cur.execute(f"SELECT DATE(a.created_at) AS d, COUNT(*) AS n {_FROM} "
                    "WHERE j.org_email = %s AND a.created_at >= %s GROUP BY d", (org, trend_start))
        trend_rows = cur.fetchall()

        cur.execute(f"SELECT {_APP_COLS} {_FROM} WHERE j.org_email = %s AND a.stage = 'New' "
                    "ORDER BY a.created_at DESC, a.id DESC LIMIT %s", (org, AWAITING_REVIEW_LIMIT))
        review_rows = cur.fetchall()
        hist = _histories(cur, [r["id"] for r in review_rows])
    finally:
        cur.close()

    by_stage = {s: 0 for s in STAGES}
    per_job = {}
    total = 0
    for g in grouped:
        n = int(g["n"])
        total += n
        by_stage[g["stage"]] += n
        entry = per_job.setdefault(g["job_id"], {"stages": {}, "match_sum": 0})
        entry["stages"][g["stage"]] = n
        entry["match_sum"] += int(g["match_sum"] or 0)

    job_rows = []
    for job in jobs:
        entry = per_job.get(job["id"], {"stages": {}, "match_sum": 0})
        job_rows.append({"jobId": job["id"], "title": job["title"], "status": job["status"],
                         "job": job_row_to_json(job), "total": sum(entry["stages"].values()),
                         **job_stats(entry["stages"], entry["match_sum"])})

    trend_counts = {str(r["d"]): int(r["n"]) for r in trend_rows}
    return {
        "totalJobs": len(jobs),
        "totalApplications": total,
        "openJobs": sum(1 for j in jobs if j["status"] == "Open"),
        "newThisWeek": new_this_week,
        "active": sum(by_stage[s] for s in ACTIVE_STAGES),
        "byStage": by_stage,
        "reachedInterviewRate": pct(reached, total),
        "trend": build_trend(trend_counts, today),
        "jobRows": job_rows,
        "awaitingReview": [application_row_to_json(r, hist.get(r["id"], [])) for r in review_rows],
    }
