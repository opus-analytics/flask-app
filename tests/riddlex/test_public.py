"""Public endpoints. The first half is DB-free (faked repo); the DB-backed half skips without RIDDLEX_TEST_DB_*."""
import json
import uuid

import pytest
from flask import Flask

from riddlex import repo_public
from riddlex.limits import limit_post, limiter, register_rate_limit_handler

BASE = "/api/riddlex/public"
TOKEN = "tok-secret-123"
MSG_404 = "This job could not be found."
MSG_403 = "This apply link is invalid or has expired."
MSG_410 = "This job is no longer accepting applications."


@pytest.fixture(autouse=True)
def _reset_limiter():
    limiter.reset()
    yield
    limiter.reset()


def _job(status="Open", jid="job-1"):
    return {"id": jid, "orgEmail": "o@x.com", "title": "Front-End Engineer", "description": "d",
            "requirements": "React and TypeScript", "location": "Remote", "jobType": "Full-time",
            "language": "en", "status": status, "publicToken": TOKEN, "createdAt": "2026-01-01T00:00:00.000Z"}


@pytest.fixture
def fake(monkeypatch):
    state = {"job": _job(), "site": None, "calls": []}
    monkeypatch.setattr(repo_public, "get_job", lambda jid: state["job"] if state["job"] and jid == state["job"]["id"] else None)
    monkeypatch.setattr(repo_public, "get_site_for_org", lambda org: state["site"])

    def goq(job, kind, lang):
        state["calls"].append((kind, lang))
        return [{"question": f"q{i}", "minChars": 20} for i in range(3)] if kind == "screening" else \
            [{"id": "skill_react", "skill": "React", "category": "Technical", "required": True}]

    monkeypatch.setattr(repo_public, "get_or_create_questionnaire", goq)
    return state


# ---------------- DB-free ----------------

def test_unknown_job_404(anon_client, fake):
    r = anon_client.get(f"{BASE}/jobs/nope?token={TOKEN}")
    assert (r.status_code, r.get_json()) == (404, {"message": MSG_404})


def test_404_precedes_403(anon_client, fake):
    assert anon_client.get(f"{BASE}/jobs/nope").status_code == 404


@pytest.mark.parametrize("qs", ["", "?token=", "?token=wrong", "?token=tok-secret-12"])
def test_bad_or_missing_token_403(anon_client, fake, qs):
    r = anon_client.get(f"{BASE}/jobs/job-1{qs}")
    assert (r.status_code, r.get_json()) == (403, {"message": MSG_403})


def test_non_ascii_token_is_403_not_500(anon_client, fake):
    assert anon_client.get(f"{BASE}/jobs/job-1?token=t%C3%A9k").status_code == 403


def test_closed_job_410_after_token_check(anon_client, fake):
    fake["job"] = _job("Closed")
    assert anon_client.get(f"{BASE}/jobs/job-1?token=bad").status_code == 403
    r = anon_client.get(f"{BASE}/jobs/job-1?token={TOKEN}")
    assert (r.status_code, r.get_json()) == (410, {"message": MSG_410})


def test_job_response_has_no_token_and_default_site(anon_client, fake):
    r = anon_client.get(f"{BASE}/jobs/job-1?token={TOKEN}")
    body = r.get_json()
    assert r.status_code == 200
    assert TOKEN not in r.get_data(as_text=True)
    assert "publicToken" not in body["job"] and "orgEmail" not in body["job"]
    assert body["site"] == repo_public.DEFAULT_SITE
    assert body["site"]["logoUrl"] == "" and "updatedAt" not in body["site"]


def test_default_site_is_a_copy():
    s = repo_public.default_site()
    s["colors"]["primary"] = "#000000"
    assert repo_public.DEFAULT_SITE["colors"]["primary"] == "#b94f9c"


def test_site_row_mapper_camel_case():
    row = {"company_name": "Acme", "slug": "acme", "tagline": None, "logo_url": "https://x/l.png",
           "colors": json.dumps({"primary": "#111111"}).encode(), "font": "inter",
           "hiring_locations": '["Cairo"]', "languages": ["en", "ar"], "default_language": "en",
           "published": 1, "updated_at": "ignored", "org_email": "secret@x.com"}
    s = repo_public.site_row_to_public(row)
    assert s == {"companyName": "Acme", "slug": "acme", "tagline": "", "logoUrl": "https://x/l.png",
                 "colors": {"primary": "#111111"}, "font": "inter", "hiringLocations": ["Cairo"],
                 "languages": ["en", "ar"], "defaultLanguage": "en", "published": True}


@pytest.mark.parametrize("lang", [None, "", "de", "EN", "en'; DROP", 5, ["en"], "e" * 5000])
def test_questions_bad_lang_400_before_questionnaire(anon_client, fake, lang):
    r = anon_client.post(f"{BASE}/questions", json={"jobId": "job-1", "token": TOKEN, "lang": lang})
    assert r.status_code == 400
    assert fake["calls"] == []


def test_questions_ok_and_skills_forces_en(anon_client, fake):
    r = anon_client.post(f"{BASE}/questions", json={"jobId": "job-1", "token": TOKEN, "lang": "ar"})
    assert r.status_code == 200 and len(r.get_json()) == 3 and all("minChars" in q for q in r.get_json())
    r = anon_client.post(f"{BASE}/skills-questionnaire", json={"jobId": "job-1", "token": TOKEN, "lang": "ar"})
    assert r.status_code == 200 and set(r.get_json()[0]) == {"id", "skill", "category", "required"}
    assert fake["calls"] == [("screening", "ar"), ("skills", "en")]


def test_post_token_order_and_body(anon_client, fake):
    assert anon_client.post(f"{BASE}/skills-questionnaire", data="x").status_code == 400
    assert anon_client.post(f"{BASE}/skills-questionnaire", json={"jobId": "zz", "token": TOKEN}).status_code == 404
    assert anon_client.post(f"{BASE}/skills-questionnaire", json={"jobId": "job-1", "token": 7}).status_code == 403
    fake["job"] = _job("Closed")
    assert anon_client.post(f"{BASE}/skills-questionnaire", json={"jobId": "job-1", "token": TOKEN}).status_code == 410


def test_careers_unpublished_or_bad_slug_404(anon_client, monkeypatch):
    monkeypatch.setattr(repo_public, "get_published_site_by_slug", lambda s: None)
    for slug in ("nope", "Bad_Slug"):
        r = anon_client.get(f"{BASE}/careers/{slug}")
        assert (r.status_code, r.get_json()) == (404, {"message": "This careers page could not be found."})


def test_careers_apply_path_encoded(anon_client, monkeypatch):
    site = repo_public.default_site()
    job = _job(jid="a b")
    job["publicToken"] = "t/k+1"
    monkeypatch.setattr(repo_public, "get_published_site_by_slug", lambda s: ("o@x.com", site))
    monkeypatch.setattr(repo_public, "list_open_jobs", lambda org: [job])
    body = anon_client.get(f"{BASE}/careers/acme").get_json()
    assert body["jobs"][0]["applyPath"] == "/riddlex/apply/a%20b?token=t%2Fk%2B1"
    assert "publicToken" not in body["jobs"][0] and "t/k+1" not in json.dumps({"site": body["site"]})


def test_post_rate_limit_429_json_on_real_app(anon_client, fake):
    codes = [anon_client.post(f"{BASE}/skills-questionnaire", json={"jobId": "job-1", "token": TOKEN}).status_code
             for _ in range(21)]
    assert codes[:20] == [200] * 20 and codes[20] == 429
    r = anon_client.post(f"{BASE}/skills-questionnaire", json={"jobId": "job-1", "token": TOKEN})
    assert r.get_json() == {"message": "Too many requests. Please try again shortly."}


def test_429_json_shape_on_tiny_app():
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address

    lim = Limiter(key_func=get_remote_address, default_limits=[], storage_uri="memory://")
    tiny = Flask(__name__)
    register_rate_limit_handler(tiny)

    @tiny.route("/x", methods=["POST"])
    @lim.limit("2/minute")
    def x():
        return "ok"

    lim.init_app(tiny)
    c = tiny.test_client()
    assert [c.post("/x").status_code for _ in range(3)] == [200, 200, 429]
    r = c.post("/x")
    assert r.is_json and r.get_json() == {"message": "Too many requests. Please try again shortly."}


def test_undecorated_route_never_limited(anon_client):
    # default_limits=[]: 70 hits on an undecorated route never 429 (401 from auth is fine)
    assert 429 not in {anon_client.get("/api/riddlex/jobs").status_code for _ in range(70)}


def test_limit_post_exported_for_reuse():
    assert callable(limit_post)


# ---------------- DB-backed ----------------

def _insert_job(db, org="owner@x.com", status="Open", token=None, title="Front-End Engineer (React)",
                language="en", created="2026-01-01 00:00:00"):
    jid, token = str(uuid.uuid4()), token or f"tok-{uuid.uuid4().hex}"
    cur = db.cursor()
    cur.execute(
        "INSERT INTO riddlex_jobs (id, org_email, title, description, requirements, location, job_type, "
        "language, status, public_token, created_at) VALUES (%s,%s,%s,'desc','3+ years React and TypeScript',"
        "'Cairo','Full-time',%s,%s,%s,%s)", (jid, org, title, language, status, token, created))
    db.commit()
    return jid, token


def _insert_site(db, org="owner@x.com", slug="acme", published=1):
    cur = db.cursor()
    cur.execute(
        "INSERT INTO riddlex_career_sites (org_email, company_name, slug, tagline, logo_url, colors, font, "
        "hiring_locations, languages, default_language, published, updated_at) "
        "VALUES (%s,'Acme',%s,'Hi','',%s,'inter','[\"Cairo\"]','[\"en\",\"ar\"]','en',%s,UTC_TIMESTAMP())",
        (org, slug, json.dumps({"primary": "#111111", "accent": "#222222", "background": "#ffffff",
                                "text": "#000000"}), published))
    db.commit()


def test_db_job_and_default_site_no_token_leak(client, db):
    jid, token = _insert_job(db)
    r = client.get(f"{BASE}/jobs/{jid}?token={token}")
    assert r.status_code == 200
    raw = r.get_data(as_text=True)
    assert token not in raw and "publicToken" not in raw and "owner@x.com" not in raw
    assert r.get_json()["site"]["companyName"] == "Opus Analytics"


def test_db_statuses(client, db):
    jid, token = _insert_job(db)
    cid, ctoken = _insert_job(db, status="Closed")
    assert client.get(f"{BASE}/jobs/{uuid.uuid4()}?token=x").status_code == 404
    assert client.get(f"{BASE}/jobs/{jid}?token=wrong").status_code == 403
    assert client.get(f"{BASE}/jobs/{cid}?token={ctoken}").status_code == 410


def test_db_site_mapped_when_present(client, db):
    jid, token = _insert_job(db)
    _insert_site(db)
    site = client.get(f"{BASE}/jobs/{jid}?token={token}").get_json()["site"]
    assert site["companyName"] == "Acme" and site["logoUrl"] == "" and "updatedAt" not in site
    assert site["languages"] == ["en", "ar"] and site["published"] is True


def test_db_questions_three_with_min_chars_and_identical(client, db):
    jid, token = _insert_job(db)
    body = {"jobId": jid, "token": token, "lang": "en"}
    a = client.post(f"{BASE}/questions", json=body)
    b = client.post(f"{BASE}/questions", json=body)
    assert a.status_code == 200
    qs = a.get_json()
    assert len(qs) == 3 and all(q["question"] and isinstance(q["minChars"], int) for q in qs)
    assert qs == b.get_json()
    cur = db.cursor()
    cur.execute("SELECT COUNT(*) FROM riddlex_job_questionnaires WHERE job_id=%s", (jid,))
    assert cur.fetchone()[0] == 1


def test_db_skills_identical_and_shape(client, db):
    jid, token = _insert_job(db)
    body = {"jobId": jid, "token": token}
    a = client.post(f"{BASE}/skills-questionnaire", json=body).get_json()
    assert a == client.post(f"{BASE}/skills-questionnaire", json=body).get_json()
    assert 4 <= len(a) <= 8 and all(set(q) == {"id", "skill", "category", "required"} for q in a)


def test_db_get_or_create_converges_and_unicode(client, db):
    from app import app
    jid, _ = _insert_job(db, title="مطور واجهات React")
    job = {"id": jid, "title": "مطور واجهات React", "description": "", "requirements": "React",
           "location": "Cairo", "jobType": "Full-time"}
    with app.app_context():
        first = repo_public.get_or_create_questionnaire(job, "screening", "ar")
        assert repo_public.get_or_create_questionnaire(job, "screening", "ar") == first
        with pytest.raises(ValueError):
            repo_public.get_or_create_questionnaire(job, "screening", "de")


def test_db_questions_bad_lang_400(client, db):
    jid, token = _insert_job(db)
    r = client.post(f"{BASE}/questions", json={"jobId": jid, "token": token, "lang": "xx"})
    assert r.status_code == 400


def test_db_careers_published_open_only_newest_first(client, db):
    j_old, t_old = _insert_job(db, created="2026-01-01 00:00:00")
    j_new, t_new = _insert_job(db, created="2026-02-01 00:00:00")
    _insert_job(db, status="Closed")
    _insert_job(db, org="other@x.com")
    _insert_site(db)
    r = client.get(f"{BASE}/careers/acme")
    assert r.status_code == 200
    body = r.get_json()
    assert [j["id"] for j in body["jobs"]] == [j_new, j_old]
    assert body["jobs"][0]["applyPath"] == f"/riddlex/apply/{j_new}?token={t_new}"
    assert all("publicToken" not in j for j in body["jobs"])
    assert "owner@x.com" not in r.get_data(as_text=True)


def test_db_careers_unpublished_404(client, db):
    _insert_site(db, published=0)
    assert client.get(f"{BASE}/careers/acme").status_code == 404
    assert client.get(f"{BASE}/careers/missing").status_code == 404
