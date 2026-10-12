import datetime
import uuid

from riddlex.repo_apps import (
    avg_match,
    build_trend,
    job_stats,
    pct,
    round_half_up,
    trend_dates,
)
from riddlex.schemas import STAGES

STAGES_ORDER_FOR_TESTS = list(STAGES)

JOB = {"title": "Engineer", "description": "d", "requirements": "r",
       "location": "Cairo", "jobType": "Full-time", "language": "en"}


# ---- DB-free unit tests ----
def test_round_half_up_matches_js_math_round():
    assert round_half_up(2.4) == 2
    assert round_half_up(2.5) == 3
    assert round_half_up(49.5) == 50
    assert round_half_up(0) == 0


def test_pct_and_avg_match():
    assert pct(1, 3) == 33 and pct(2, 3) == 67 and pct(2, 5) == 40
    assert pct(0, 0) == 0
    assert avg_match(50 + 70 + 90, 3) == 70
    assert avg_match(33 + 66, 2) == 50
    assert avg_match(0, 0) is None


def test_job_stats_counts_active_stages_only():
    stats = job_stats({"New": 1, "Interview": 1, "Hired": 1, "Rejected": 1}, 200)
    assert stats == {"newCount": 1, "active": 2, "hired": 1, "avgMatch": 50}


def test_job_stats_empty_job():
    assert job_stats({}, 0) == {"newCount": 0, "active": 0, "hired": 0, "avgMatch": None}


def test_trend_window_is_30_days_oldest_first_ending_today():
    today = datetime.date(2026, 10, 9)
    dates = trend_dates(today)
    assert len(dates) == 30
    assert dates[0] == "2026-09-10" and dates[-1] == "2026-10-09"
    out = build_trend({"2026-10-09": 2, "2026-10-07": 1, "2026-01-01": 9}, today)
    assert sum(p["count"] for p in out) == 3  # out-of-window days are ignored
    assert out[-1] == {"date": "2026-10-09", "count": 2}


def test_dashboard_requires_auth(anon_client):
    assert anon_client.get("/api/riddlex/dashboard").status_code == 401


# ---- DB-backed (skipped unless RIDDLEX_TEST_DB_* is set) ----
def _insert_app(db, job_id, name, stage, match, created, history=()):
    app_id = str(uuid.uuid4())
    cur = db.cursor()
    cur.execute(
        "INSERT INTO riddlex_applications (id, job_id, applicant_name, applicant_email, mobile_number, "
        "resume_file_name, resume_blob_path, answers, skills, skills_match, stage, notes, created_at, "
        "updated_at) VALUES (%s, %s, %s, %s, '+20100000000', 'cv.pdf', %s, '[]', '[]', %s, %s, '', %s, %s)",
        (app_id, job_id, name, f"{app_id}@x.com", f"resumes/{app_id}.pdf", match, stage, created, created),
    )
    for h_stage, h_at in history:
        cur.execute("INSERT INTO riddlex_application_history (application_id, stage, at) VALUES (%s, %s, %s)",
                    (app_id, h_stage, h_at))
    db.commit()
    return app_id


def _days(now, n):
    return now - datetime.timedelta(days=n)


def _seed(client, db, headers, other_headers):
    """Org fixture with known counts (see expectations in test_dashboard_numbers)."""
    now = datetime.datetime.utcnow().replace(microsecond=0)
    j1 = client.post("/api/riddlex/jobs", headers=headers, json={**JOB, "title": "Open job"}).get_json()["id"]
    j2 = client.post("/api/riddlex/jobs", headers=headers, json={**JOB, "title": "Closed job"}).get_json()["id"]
    client.patch(f"/api/riddlex/jobs/{j2}/status", headers=headers, json={"status": "Closed"})
    created = {
        "A1": now,
        "A2": _days(now, 2),
        "A3": _days(now, 40),
        "A4": now - datetime.timedelta(hours=1),
        "A5": _days(now, 3),
    }
    ids = {
        "A1": _insert_app(db, j1, "A1", "New", 50, created["A1"]),
        "A2": _insert_app(db, j1, "A2", "Interview", 70, created["A2"],
                          history=[("Interview", _days(now, 1))]),
        "A3": _insert_app(db, j1, "A3", "Hired", 90, created["A3"], history=[
            ("Interview", _days(now, 41)), ("Offer", _days(now, 40)), ("Hired", _days(now, 39))]),
        "A4": _insert_app(db, j2, "A4", "Rejected", 33, created["A4"]),
        "A5": _insert_app(db, j2, "A5", "New", 66, created["A5"]),
    }
    # Another org's application must not move any number.
    other = client.post("/api/riddlex/jobs", headers=other_headers, json=JOB).get_json()["id"]
    _insert_app(db, other, "Other", "New", 100, now)
    return {"now": now, "j1": j1, "j2": j2, "ids": ids, "created": created}


def test_dashboard_numbers(client, auth_headers, db):
    ha = auth_headers(org="a@x.com", user="a@x.com")
    hb = auth_headers(org="b@x.com", user="b@x.com")
    seed = _seed(client, db, ha, hb)
    body = client.get("/api/riddlex/dashboard", headers=ha).get_json()

    assert body["openJobs"] == 1
    assert body["newThisWeek"] == 4  # A1, A2, A4, A5 (A3 is 40 days old)
    assert body["byStage"] == {"New": 2, "In Review": 0, "Interview": 1, "Offer": 0, "Hired": 1, "Rejected": 1}
    assert list(body["byStage"]) == STAGES_ORDER_FOR_TESTS
    assert body["active"] == 3  # New x2 + Interview
    assert body["reachedInterviewRate"] == 40  # A2 and A3 reached Interview/Offer/Hired out of 5

    rows = {r["jobId"]: r for r in body["jobRows"]}
    assert set(rows) == {seed["j1"], seed["j2"]}
    assert rows[seed["j1"]] == {"jobId": seed["j1"], "title": "Open job", "status": "Open",
                                "newCount": 1, "active": 2, "hired": 1, "avgMatch": 70}
    assert rows[seed["j2"]] == {"jobId": seed["j2"], "title": "Closed job", "status": "Closed",
                                "newCount": 1, "active": 1, "hired": 0, "avgMatch": 50}

    assert [a["applicantName"] for a in body["awaitingReview"]] == ["A1", "A5"]  # New only, newest first
    assert all(a["jobTitle"] for a in body["awaitingReview"])

    trend = {p["date"]: p["count"] for p in body["trend"]}
    assert len(body["trend"]) == 30
    today = seed["now"].date().isoformat()
    assert body["trend"][-1]["date"] == today
    expected = {}
    for key in ("A1", "A2", "A4", "A5"):  # A3 is outside the 30-day window
        d = seed["created"][key].date().isoformat()
        expected[d] = expected.get(d, 0) + 1
    for d, n in expected.items():
        assert trend[d] == n
    assert sum(trend.values()) == 4


def test_dashboard_empty_org(client, auth_headers):
    body = client.get("/api/riddlex/dashboard", headers=auth_headers(org="e@x.com", user="e@x.com")).get_json()
    assert body["openJobs"] == 0 and body["newThisWeek"] == 0 and body["active"] == 0
    assert body["reachedInterviewRate"] == 0
    assert body["byStage"] == {s: 0 for s in STAGES_ORDER_FOR_TESTS}
    assert body["jobRows"] == [] and body["awaitingReview"] == []
    assert len(body["trend"]) == 30 and all(p["count"] == 0 for p in body["trend"])


def test_dashboard_job_without_applications_has_null_avg(client, auth_headers):
    h = auth_headers(org="n@x.com", user="n@x.com")
    jid = client.post("/api/riddlex/jobs", headers=h, json=JOB).get_json()["id"]
    body = client.get("/api/riddlex/dashboard", headers=h).get_json()
    assert body["jobRows"] == [{"jobId": jid, "title": "Engineer", "status": "Open", "newCount": 0,
                                "active": 0, "hired": 0, "avgMatch": None, "total": 0,
                                "job": body["jobRows"][0]["job"]}]
