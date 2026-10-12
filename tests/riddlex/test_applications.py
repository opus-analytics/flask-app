import datetime
import json
import uuid

import pytest

from riddlex.errors import ApiError
from riddlex.repo_apps import (
    application_row_to_json,
    escape_like,
    parse_list_args,
    validate_update,
)

JOB = {"title": "Backend Engineer", "description": "d", "requirements": "r",
       "location": "Cairo", "jobType": "Full-time", "language": "en"}
NOW = datetime.datetime(2026, 10, 9, 12, 0, 0)


# ---- DB-free unit tests ----
def test_list_args_defaults():
    out = parse_list_args({})
    assert out == {"job_id": "", "stage": "", "q": "", "sort": "newest", "page": 1, "page_size": 50}


def test_list_args_caps_page_size_at_100():
    assert parse_list_args({"pageSize": "500"})["page_size"] == 100


@pytest.mark.parametrize("args,needle", [
    ({"stage": "Hired2"}, "stage"),
    ({"sort": "random"}, "Sort"),
    ({"page": "0"}, "Page"),
    ({"page": "abc"}, "whole number"),
    ({"pageSize": "0"}, "Page size"),
    ({"q": "x" * 201}, "200"),
])
def test_list_args_rejects(args, needle):
    with pytest.raises(ApiError) as e:
        parse_list_args(args)
    assert e.value.status == 400 and needle in e.value.message


def test_escape_like_neutralises_wildcards():
    assert escape_like("100%_\\x") == "100\\%\\_\\\\x"


def test_validate_update_rules():
    assert validate_update({"stage": "Interview", "notes": "ok"}) == ("Interview", "ok")
    assert validate_update({"stage": "Hired"}) == ("Hired", None)  # notes absent = keep
    for bad in ({"stage": "Paused"}, {}, None, ["x"]):
        with pytest.raises(ApiError) as e:
            validate_update(bad)
        assert e.value.status == 400
    with pytest.raises(ApiError):
        validate_update({"stage": "New", "notes": "x" * 5001})
    with pytest.raises(ApiError):
        validate_update({"stage": "New", "notes": 5})


def _app_row(**over):
    row = {"id": "a1", "job_id": "j1", "applicant_name": "Sara", "applicant_email": "s@x.com",
           "mobile_number": "+20100", "resume_file_name": "cv.pdf",
           "resume_blob_path": "resumes/secret-path.pdf",
           "answers": '[{"question":"Q","answer":"A"}]', "skills": b'[{"name":"Python"}]',
           "skills_match": 72, "stage": "New", "notes": "", "created_at": NOW,
           "updated_at": NOW, "job_title": "Backend Engineer"}
    row.update(over)
    return row


def test_row_mapper_camel_case_no_blob_path():
    hist = [{"stage": "Interview", "at": "2026-10-08T10:00:00.000Z"}]
    out = application_row_to_json(_app_row(), hist)
    assert set(out) == {"id", "jobId", "applicantName", "applicantEmail", "mobileNumber",
                        "resumeFileName", "answers", "skills", "skillsMatch", "stage", "notes",
                        "createdAt", "updatedAt", "history", "jobTitle"}
    assert out["answers"] == [{"question": "Q", "answer": "A"}]
    assert out["skills"] == [{"name": "Python"}]
    assert out["createdAt"] == "2026-10-09T12:00:00.000Z" and out["history"] == hist
    assert "secret-path" not in json.dumps(out)


def test_row_mapper_without_job_title():
    out = application_row_to_json(_app_row(), [], with_job=False)
    assert "jobTitle" not in out


# ---- DB-backed (skipped unless RIDDLEX_TEST_DB_* is set) ----
def _job(client, headers, title="Backend Engineer"):
    return client.post("/api/riddlex/jobs", headers=headers, json={**JOB, "title": title}).get_json()["id"]


def _insert_app(db, job_id, name, email, stage="New", match=50, created=None, history=()):
    app_id = str(uuid.uuid4())
    created = created or NOW
    cur = db.cursor()
    cur.execute(
        "INSERT INTO riddlex_applications (id, job_id, applicant_name, applicant_email, mobile_number, "
        "resume_file_name, resume_blob_path, answers, skills, skills_match, stage, notes, created_at, "
        "updated_at) VALUES (%s, %s, %s, %s, '+20100000000', 'cv.pdf', %s, '[]', '[]', %s, %s, '', %s, %s)",
        (app_id, job_id, name, email, f"resumes/{app_id}.pdf", match, stage, created, created),
    )
    for h_stage, h_at in history:
        cur.execute("INSERT INTO riddlex_application_history (application_id, stage, at) VALUES (%s, %s, %s)",
                    (app_id, h_stage, h_at))
    db.commit()
    return app_id


def _history_count(db, app_id):
    cur = db.cursor()
    cur.execute("SELECT COUNT(*) FROM riddlex_application_history WHERE application_id = %s", (app_id,))
    return cur.fetchone()[0]


def test_list_is_scoped_to_org(client, auth_headers, db):
    ha, hb = auth_headers(org="a@x.com", user="a@x.com"), auth_headers(org="b@x.com", user="b@x.com")
    ja, jb = _job(client, ha), _job(client, hb)
    _insert_app(db, ja, "Alice", "alice@x.com")
    _insert_app(db, jb, "Bob", "bob@x.com")
    body = client.get("/api/riddlex/applications", headers=ha).get_json()
    assert body["total"] == 1 and [i["applicantName"] for i in body["items"]] == ["Alice"]
    assert body["items"][0]["jobTitle"] == "Backend Engineer"


def test_list_filters_by_stage_job_and_search(client, auth_headers, db):
    h = auth_headers()
    j1, j2 = _job(client, h, "Job one"), _job(client, h, "Job two")
    _insert_app(db, j1, "Sara Ali", "sara@x.com", stage="Interview")
    _insert_app(db, j1, "Omar", "omar@x.com", stage="New")
    _insert_app(db, j2, "Nour", "nour@y.com", stage="Interview")
    _insert_app(db, j2, "Plain", "pl100%ain@x.com", stage="New")

    def names(qs):
        return sorted(i["applicantName"] for i in client.get(f"/api/riddlex/applications?{qs}", headers=h).get_json()["items"])

    assert names("stage=Interview") == ["Nour", "Sara Ali"]
    assert names(f"jobId={j2}") == ["Nour", "Plain"]
    assert names("q=sara") == ["Sara Ali"]  # case-insensitive by collation
    assert names("q=%25") == ["Plain"]  # a literal % matches only the address containing "%"
    assert names("q=_") == []  # a literal _ is not a wildcard


def test_list_sort_by_match_and_pagination(client, auth_headers, db):
    h = auth_headers()
    j = _job(client, h)
    _insert_app(db, j, "Low", "low@x.com", match=10, created=NOW - datetime.timedelta(days=3))
    _insert_app(db, j, "High", "high@x.com", match=90, created=NOW - datetime.timedelta(days=2))
    _insert_app(db, j, "Mid", "mid@x.com", match=50, created=NOW - datetime.timedelta(days=1))

    by_match = client.get("/api/riddlex/applications?sort=match", headers=h).get_json()
    assert [i["applicantName"] for i in by_match["items"]] == ["High", "Mid", "Low"]

    p1 = client.get("/api/riddlex/applications?sort=oldest&page=1&pageSize=2", headers=h).get_json()
    p2 = client.get("/api/riddlex/applications?sort=oldest&page=2&pageSize=2", headers=h).get_json()
    assert p1["total"] == 3 and p1["page"] == 1 and p1["pageSize"] == 2
    assert [i["applicantName"] for i in p1["items"]] == ["Low", "High"]
    assert [i["applicantName"] for i in p2["items"]] == ["Mid"]


def test_list_rejects_bad_params(client, auth_headers):
    h = auth_headers()
    assert client.get("/api/riddlex/applications?stage=Nope", headers=h).status_code == 400
    assert client.get("/api/riddlex/applications?sort=nope", headers=h).status_code == 400


def test_detail_history_ascending_and_foreign_404(client, auth_headers, db):
    ha, hb = auth_headers(org="a@x.com", user="a@x.com"), auth_headers(org="b@x.com", user="b@x.com")
    ja = _job(client, ha)
    app_id = _insert_app(db, ja, "Alice", "alice@x.com", stage="Offer", history=[
        ("Offer", NOW - datetime.timedelta(days=1)),
        ("Interview", NOW - datetime.timedelta(days=3)),
    ])
    body = client.get(f"/api/riddlex/applications/{app_id}", headers=ha).get_json()
    assert [h["stage"] for h in body["history"]] == ["Interview", "Offer"]
    assert body["history"][0]["at"].endswith("Z")
    assert client.get(f"/api/riddlex/applications/{app_id}", headers=hb).status_code == 404


def test_patch_same_stage_adds_no_history_but_updates_notes(client, auth_headers, db):
    h = auth_headers()
    app_id = _insert_app(db, _job(client, h), "Alice", "alice@x.com", stage="New")
    r = client.patch(f"/api/riddlex/applications/{app_id}", headers=h, json={"stage": "New", "notes": "call back"})
    assert r.status_code == 200
    body = r.get_json()
    assert body["stage"] == "New" and body["notes"] == "call back" and "jobTitle" not in body
    assert _history_count(db, app_id) == 0


def test_patch_new_stage_adds_one_history_row(client, auth_headers, db):
    h = auth_headers()
    app_id = _insert_app(db, _job(client, h), "Alice", "alice@x.com", stage="New")
    r = client.patch(f"/api/riddlex/applications/{app_id}", headers=h, json={"stage": "Interview"})
    assert r.status_code == 200 and r.get_json()["stage"] == "Interview"
    assert [x["stage"] for x in r.get_json()["history"]] == ["Interview"]
    assert _history_count(db, app_id) == 1


def test_patch_validation_and_foreign_org(client, auth_headers, db):
    ha, hb = auth_headers(org="a@x.com", user="a@x.com"), auth_headers(org="b@x.com", user="b@x.com")
    app_id = _insert_app(db, _job(client, ha), "Alice", "alice@x.com", stage="New")
    url = f"/api/riddlex/applications/{app_id}"
    assert client.patch(url, headers=ha, json={"stage": "Bogus"}).status_code == 400
    assert client.patch(url, headers=ha, json={"stage": "New", "notes": "x" * 5001}).status_code == 400
    assert client.patch(url, headers=hb, json={"stage": "Hired"}).status_code == 404
    assert client.patch(url, headers=hb, json={"stage": "Hired"}).get_json()["message"] == "Application not found."
    # foreign PATCH changed nothing
    assert client.get(url, headers=ha).get_json()["stage"] == "New"
    assert _history_count(db, app_id) == 0


def test_resume_url_local_and_no_blob_path_leak(client, auth_headers, db, monkeypatch, tmp_path):
    monkeypatch.setenv("RIDDLEX_STORAGE", "local")
    monkeypatch.setenv("RIDDLEX_LOCAL_DIR", str(tmp_path))
    monkeypatch.delenv("RIDDLEX_RESUME_CONTAINER", raising=False)
    ha, hb = auth_headers(org="a@x.com", user="a@x.com"), auth_headers(org="b@x.com", user="b@x.com")
    app_id = _insert_app(db, _job(client, ha), "Alice", "alice@x.com")
    r = client.get(f"/api/riddlex/applications/{app_id}/resume", headers=ha)
    assert r.status_code == 200
    body = r.get_json()
    assert body["fileName"] == "cv.pdf"
    assert body["url"].startswith("/api/riddlex/_dev_files/riddlex-resumes/resumes/")
    assert "resume_blob_path" not in json.dumps(body)
    assert client.get(f"/api/riddlex/applications/{app_id}", headers=ha).get_json().get("resumeBlobPath") is None
    assert client.get(f"/api/riddlex/applications/{app_id}/resume", headers=hb).status_code == 404
