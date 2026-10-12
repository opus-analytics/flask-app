"""Seed DEV/STAGING RiddleX data for one org: 3 jobs and 10 applications.

Port of seed() in OpusReact/src/store/apis/riddlexMockServer.ts. Ratings are deterministic
(same formulas as the mock); ids and public tokens are random per run. Skills come from
riddlex.questionnaire.build_skill_catalog_questions + score_skills, answers from
build_screening_questions. Timestamps are stored as naive UTC; the mock used local hours,
so the "hour of day" values differ slightly from the browser demo.

Usage:
    python scripts/seed_riddlex.py --org owner@example.com [--reset]

Without --reset the script aborts if the org already has riddlex_jobs rows.
--reset deletes ONLY that org's jobs; the FK cascades remove applications, history and
questionnaires. Refuses to run when FLASK_ENV or RIDDLEX_ENV is "production".
"""
import argparse
import os
import re
import secrets
import sys
import uuid
from datetime import datetime, timedelta, timezone

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

STAGES = ["New", "In Review", "Interview", "Offer", "Hired", "Rejected"]
YEARS_BANDS = ["<1", "1-2", "3-5", "5+"]
SAMPLE_ANSWER = "Sample answer provided by the candidate in the demo data set."

# Same order and copy as the mock. "ago" is days before now; hour is the job's createdAt hour.
JOBS = [
    {
        "key": "job_frontend_engineer",
        "title": "Front-End Engineer (React)",
        "description": "Build fast, accessible interfaces for our HR analytics platform. You will own features end to end, from design handoff to production.",
        "requirements": "3+ years with React and TypeScript, Tailwind CSS, REST API integration, accessibility (WCAG) and performance profiling.",
        "location": "Hybrid — Cairo, Egypt",
        "jobType": "Full-time",
        "language": "en",
        "status": "Open",
        "ago": 28,
    },
    {
        "key": "job_data_analyst",
        "title": "People Data Analyst",
        "description": "Turn workforce data into insights for HR leaders across the region. Partner with People teams on dashboards and KPIs.",
        "requirements": "SQL, Python, Power BI or similar, statistics fundamentals, and clear written communication with non-technical stakeholders.",
        "location": "Riyadh, KSA",
        "jobType": "Full-time",
        "language": "en",
        "status": "Open",
        "ago": 21,
    },
    {
        "key": "job_hr_intern",
        "title": "Talent Acquisition Intern",
        "description": "Support the recruiting team with sourcing, screening and candidate communication.",
        "requirements": "Strong communication, organisation, LinkedIn sourcing and interest in HR technology.",
        "location": "Remote",
        "jobType": "Internship",
        "language": "en",
        "status": "Closed",
        "ago": 40,
    },
]

# (name, job key, mobile, stage, days ago)
PEOPLE = [
    ("Nour Abdelrahman", "job_frontend_engineer", "+20 10 5555 1122", "New", 1),
    ("Sarah El-Sayed", "job_frontend_engineer", "+20 10 5555 3344", "In Review", 4),
    ("Youssef Kamal", "job_frontend_engineer", "+20 11 2222 8899", "Interview", 9),
    ("Mariam Fathy", "job_frontend_engineer", "+20 12 7777 1234", "Offer", 15),
    ("Karim Adel", "job_frontend_engineer", "+20 10 9090 4545", "Rejected", 12),
    ("Faisal Al-Harbi", "job_data_analyst", "+966 50 123 4567", "New", 0),
    ("Lama Al-Qahtani", "job_data_analyst", "+966 55 987 6543", "Interview", 6),
    ("Hana Mostafa", "job_data_analyst", "+20 10 3030 6060", "In Review", 3),
    ("Omar Tarek", "job_hr_intern", "+20 11 4444 2020", "Hired", 30),
    ("Salma Hussein", "job_hr_intern", "+20 12 1212 3434", "Rejected", 33),
]


def _environment_problem():
    """Return an error message when the environment is production, else None."""
    for name in ("FLASK_ENV", "RIDDLEX_ENV"):
        if (os.environ.get(name) or "").strip().lower() == "production":
            return f"Refusing to seed: {name} is production."
    return None


def days_ago(days, hour=10, now=None):
    """Mirror of the mock's daysAgo(): N days back at `hour`, never later than now - 60s."""
    now = now or datetime.now(timezone.utc)
    date = (now - timedelta(days=days)).replace(hour=hour, minute=0, second=0, microsecond=0)
    return min(date, now - timedelta(seconds=60))


def to_db_time(value):
    """Aware datetime -> naive UTC with millisecond precision (DATETIME(3))."""
    return value.replace(microsecond=value.microsecond // 1000 * 1000, tzinfo=None)


def build_jobs(now):
    rows = []
    for spec in JOBS:
        rows.append({
            "id": str(uuid.uuid4()),
            "title": spec["title"],
            "description": spec["description"],
            "requirements": spec["requirements"],
            "location": spec["location"],
            "jobType": spec["jobType"],
            "language": spec["language"],
            "status": spec["status"],
            "publicToken": secrets.token_urlsafe(24),
            "createdAt": days_ago(spec["ago"], 10, now),
            "key": spec["key"],
        })
    return rows


def build_applications(jobs, now):
    # Imported here so --help works without the app or riddlex package loading.
    from riddlex.questionnaire import (
        build_screening_questions,
        build_skill_catalog_questions,
        score_skills,
    )

    jobs_by_key = {j["key"]: j for j in jobs}
    apps = []
    for i, (name, job_key, mobile, stage, ago) in enumerate(PEOPLE):
        job = jobs_by_key[job_key]
        created_at = days_ago(ago, 9 + (i % 8), now)

        if stage == "Rejected":
            reached = STAGES[:2] + ["Rejected"]
        else:
            reached = STAGES[: STAGES.index(stage) + 1]
        history = []
        for idx, s in enumerate(reached):
            at = created_at if idx == 0 else days_ago(max(ago - idx * 2, 0), 14, now)
            history.append({"stage": s, "at": at})

        # Deterministic demo ratings: rejected candidates rate lower than the rest.
        skills = []
        for idx, q in enumerate(build_skill_catalog_questions(job)):
            if stage == "Rejected":
                proficiency = 1 + ((i + idx) % 3)
            else:
                proficiency = 2 + ((i * 3 + idx * 2) % 4)
            skills.append({
                **q,
                "proficiency": proficiency,
                "years": YEARS_BANDS[(i + idx) % len(YEARS_BANDS)],
            })

        answers = [
            {"question": q["question"], "answer": SAMPLE_ANSWER}
            for q in build_screening_questions(job, "en")
        ]

        apps.append({
            "id": str(uuid.uuid4()),
            "job_key": job_key,
            "jobId": job["id"],
            "name": name,
            "email": re.sub(r"[^a-z]+", ".", name.lower()) + "@example.com",
            "mobile": mobile,
            "resumeFileName": f"{name.split(' ')[0].lower()}_resume.pdf",
            "answers": answers,
            "skills": skills,
            "skillsMatch": score_skills(skills),
            "stage": stage,
            "createdAt": created_at,
            "updatedAt": history[-1]["at"],
            "history": history,
        })
    return apps


def _seed(org, reset):
    import json

    from opus_api.db import get_db

    now = datetime.now(timezone.utc)
    jobs = build_jobs(now)
    apps = build_applications(jobs, now)

    db = get_db()
    cur = db.cursor()
    try:
        cur.execute("SELECT COUNT(*) FROM riddlex_jobs WHERE org_email = %s", (org,))
        (existing,) = cur.fetchone()
        if existing and not reset:
            print(f"Aborted: org {org} already has {existing} RiddleX job(s). "
                  "Re-run with --reset to replace them.", file=sys.stderr)
            db.rollback()
            return 1
        if reset:
            cur.execute("DELETE FROM riddlex_jobs WHERE org_email = %s", (org,))
            print(f"Deleted {cur.rowcount} existing job(s) for {org} (cascade applies).")

        for job in jobs:
            cur.execute(
                "INSERT INTO riddlex_jobs (id, org_email, title, description, requirements, location, "
                "job_type, language, status, public_token, created_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (job["id"], org, job["title"], job["description"], job["requirements"],
                 job["location"], job["jobType"], job["language"], job["status"],
                 job["publicToken"], to_db_time(job["createdAt"])),
            )

        for app in apps:
            cur.execute(
                "INSERT INTO riddlex_applications (id, job_id, applicant_name, applicant_email, "
                "mobile_number, resume_file_name, resume_blob_path, answers, skills, skills_match, "
                "stage, notes, created_at, updated_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, '', %s, %s, %s, %s, '', %s, %s)",
                (app["id"], app["jobId"], app["name"], app["email"], app["mobile"],
                 app["resumeFileName"], json.dumps(app["answers"], ensure_ascii=False),
                 json.dumps(app["skills"], ensure_ascii=False), app["skillsMatch"],
                 app["stage"], to_db_time(app["createdAt"]), to_db_time(app["updatedAt"])),
            )
            for event in app["history"]:
                cur.execute(
                    "INSERT INTO riddlex_application_history (application_id, stage, at) "
                    "VALUES (%s, %s, %s)",
                    (app["id"], event["stage"], to_db_time(event["at"])),
                )
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        cur.close()

    print(f"Seeded {len(jobs)} jobs and {len(apps)} applications for {org}.")
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Seed DEV/STAGING RiddleX data (3 jobs, 10 applications) for one org."
    )
    parser.add_argument("--org", help="Owner org email (riddlex_jobs.org_email). Required.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete this org's existing RiddleX jobs first (cascades to applications).",
    )
    args = parser.parse_args(argv)

    problem = _environment_problem()
    if problem:
        print(f"ERROR: {problem}", file=sys.stderr)
        return 1

    org = (args.org or "").strip().lower()
    if not org or "@" not in org:
        print("ERROR: --org <owner email> is required, e.g. --org owner@example.com.", file=sys.stderr)
        return 1

    # Importing app loads .env, which may set FLASK_ENV / RIDDLEX_ENV, so re-check afterwards.
    from app import app

    problem = _environment_problem()
    if problem:
        print(f"ERROR: {problem}", file=sys.stderr)
        return 1

    with app.app_context():
        return _seed(org, args.reset)


if __name__ == "__main__":
    sys.exit(main())
