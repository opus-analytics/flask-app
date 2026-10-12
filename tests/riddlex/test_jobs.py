import datetime
import json

import pytest

from riddlex.errors import ApiError
from riddlex.repo_jobs import job_row_to_json, validate_job_draft, validate_status

JOB = {"title": "Front-End Engineer", "description": "d", "requirements": "r",
       "location": "", "jobType": "Full-time", "language": "en"}


# ---- DB-free unit tests ----
def test_validate_trims_and_defaults_location():
    out = validate_job_draft({**JOB, "title": "  Engineer  "}, ["en"])
    assert out["title"] == "Engineer" and out["location"] == "Remote" and out["job_type"] == "Full-time"


@pytest.mark.parametrize("patch,needle", [
    ({"title": "ab"}, "at least 3"),
    ({"title": "  a  "}, "at least 3"),
    ({"title": "x" * 201}, "200"),
    ({"location": "x" * 201}, "200"),
    ({"description": "x" * 10001}, "10000"),
    ({"requirements": "x" * 10001}, "10000"),
    ({"jobType": "Weekend"}, "job type"),
    ({"language": "ar"}, "supported languages"),
    ({"language": None}, "supported languages"),
])
def test_validate_rejects(patch, needle):
    with pytest.raises(ApiError) as e:
        validate_job_draft({**JOB, **patch}, ["en"])
    assert e.value.status == 400 and needle in e.value.message


def test_validate_rejects_non_object_body():
    with pytest.raises(ApiError) as e:
        validate_job_draft(None, ["en"])
    assert e.value.status == 400


def test_validate_status():
    assert validate_status({"status": "Closed"}) == "Closed"
    for bad in ({"status": "Paused"}, {}, None):
        with pytest.raises(ApiError):
            validate_status(bad)


def test_row_mapper_camel_case_and_timestamp():
    row = {"id": "i", "title": "t", "description": "d", "requirements": "r", "location": "Remote",
           "job_type": "Contract", "language": "fr", "status": "Open", "public_token": "tok",
           "created_at": datetime.datetime(2026, 1, 2, 3, 4, 5, 6000)}
    out = job_row_to_json(row)
    assert set(out) == {"id", "title", "description", "requirements", "location", "jobType",
                        "language", "status", "publicToken", "createdAt"}
    assert out["createdAt"] == "2026-01-02T03:04:05.006Z" and out["jobType"] == "Contract"


def test_jobs_require_auth(anon_client):
    assert anon_client.post("/api/riddlex/jobs", json=JOB).status_code == 401
    assert anon_client.patch("/api/riddlex/jobs/x/status", json={"status": "Closed"}).status_code == 401


# ---- DB-backed (skipped unless RIDDLEX_TEST_DB_* is set) ----
def _save_site(db, org, languages):
    cur = db.cursor()
    cur.execute(
        "INSERT INTO riddlex_career_sites (org_email, company_name, slug, colors, font, hiring_locations, "
        "languages, default_language, updated_at) VALUES (%s,'Acme','acme','{}','inter','[]',%s,%s,UTC_TIMESTAMP(3))",
        (org, json.dumps(languages), languages[0]))
    db.commit()


def test_create_job_validates_title(client, auth_headers):
    r = client.post("/api/riddlex/jobs", headers=auth_headers(), json={**JOB, "title": "ab"})
    assert r.status_code == 400 and "at least 3" in r.get_json()["message"]


def test_create_job_defaults_and_token(client, auth_headers):
    r = client.post("/api/riddlex/jobs", headers=auth_headers(), json=JOB)
    body = r.get_json()
    assert r.status_code == 201 and body["status"] == "Open" and len(body["publicToken"]) >= 16
    assert body["location"] == "Remote"
    assert body["createdAt"].endswith("Z")


def test_job_language_must_be_in_career_site_languages(client, auth_headers, db):
    h = auth_headers()
    _save_site(db, "owner@x.com", ["en"])
    r = client.post("/api/riddlex/jobs", headers=h, json={**JOB, "language": "ar"})
    assert r.status_code == 400


def test_list_newest_first_and_status_patch(client, auth_headers):
    h = auth_headers()
    a = client.post("/api/riddlex/jobs", headers=h, json={**JOB, "title": "First job"}).get_json()
    b = client.post("/api/riddlex/jobs", headers=h, json={**JOB, "title": "Second job"}).get_json()
    assert [j["id"] for j in client.get("/api/riddlex/jobs", headers=h).get_json()] == [b["id"], a["id"]]
    r = client.patch(f"/api/riddlex/jobs/{a['id']}/status", headers=h, json={"status": "Closed"})
    assert r.status_code == 200 and r.get_json()["status"] == "Closed"
    assert client.patch(f"/api/riddlex/jobs/{a['id']}/status", headers=h, json={"status": "x"}).status_code == 400


def test_other_orgs_job_is_404(client, auth_headers):
    jid = client.post("/api/riddlex/jobs", headers=auth_headers(org="a@x.com", user="a@x.com"), json=JOB).get_json()["id"]
    hb = auth_headers(org="b@x.com", user="b@x.com")
    assert client.patch(f"/api/riddlex/jobs/{jid}/status", headers=hb, json={"status": "Closed"}).status_code == 404
    assert client.get("/api/riddlex/jobs", headers=hb).get_json() == []
