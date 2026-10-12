"""POST /public/apply. DB-free half uses a faked repo; the DB-backed half skips without RIDDLEX_TEST_DB_*."""
import io
import json
import uuid

import pytest

from riddlex import blob_storage, public_routes, questionnaire, repo_public
from riddlex.errors import ApiError
from riddlex.limits import limiter

URL = "/api/riddlex/public/apply"
TOKEN = "tok-secret-123"
PDF = b"%PDF-1.4\n" + b"x" * 100
SKILLS_Q = [
    {"id": "skill_react", "skill": "React", "category": "Technical", "required": True},
    {"id": "skill_git", "skill": "Git", "category": "Tools", "required": False},
]


@pytest.fixture(autouse=True)
def _reset_limiter():
    import app  # noqa: F401  (initialises limiter storage)
    limiter.reset()
    yield
    limiter.reset()


def _payload(**over):
    p = {
        "jobId": "job-1", "token": TOKEN,
        "applicant": {"fullName": " Ada Lovelace ", "email": " Ada@Example.com ", "mobileNumber": " 0100 "},
        "answers": [{"question": f"q{i}", "answer": f" a{i} "} for i in range(3)],
        "skills": [{"id": "skill_react", "proficiency": 5, "years": "5+"},
                   {"id": "skill_git", "proficiency": 3, "years": "1-2"},
                   {"id": "skill_invented", "proficiency": 5, "years": "5+"}],
        "skillsMatch": 100,
    }
    p.update(over)
    return p


def _post(client, payload, resume=(b"%PDF-1.4 hi", "cv.pdf"), raw=None):
    data = {"payload": raw if raw is not None else json.dumps(payload)}
    if resume is not None:
        data["resume"] = (io.BytesIO(resume[0]), resume[1])
    return client.post(URL, data=data, content_type="multipart/form-data")


# ---------------- pure helpers ----------------

@pytest.mark.parametrize("data,ext", [(PDF, "pdf"), (b"PK\x03\x04zip", "docx"), (b"\xd0\xcf\x11\xe0ole", "doc")])
def test_sniff_accepts(data, ext):
    assert public_routes.sniff_resume(data)[0] == ext


@pytest.mark.parametrize("data", [b"", b"just text", b"MZ\x90\x00", b" %PDF"])
def test_sniff_rejects(data):
    assert public_routes.sniff_resume(data) is None


def test_safe_file_name():
    assert public_routes.safe_file_name("..\\evil/dir/cv\x00.pdf", "pdf") == "cv.pdf"
    assert public_routes.safe_file_name("", "doc") == "resume.doc"
    assert len(public_routes.safe_file_name("a" * 999, "pdf")) == 255


@pytest.mark.parametrize("raw", [None, "", "not json", "[1]", "x" * (public_routes.MAX_PAYLOAD_CHARS + 1)],
                         ids=["none", "empty", "notjson", "list", "toolong"])
def test_parse_payload_rejects(raw):
    with pytest.raises(ApiError) as e:
        public_routes.parse_payload(raw)
    assert e.value.status == 400


def test_validate_basics_normalises_and_fails():
    assert public_routes.validate_basics(_payload(), True) == {
        "name": "Ada Lovelace", "email": "ada@example.com", "mobile": "0100"}
    for bad in ({"fullName": " ", "email": "a@b.co"}, {"fullName": "A", "email": "nope"}, None):
        with pytest.raises(ApiError) as e:
            public_routes.validate_basics(_payload(applicant=bad), True)
        assert e.value.message == public_routes.MSG_BASICS
    with pytest.raises(ApiError):
        public_routes.validate_basics(_payload(), False)


def test_validate_answers():
    assert [a["answer"] for a in public_routes.validate_answers(_payload())] == ["a0", "a1", "a2"]
    for bad in ([], [{"answer": "x"}] * 2, [{"answer": "x"}, {"answer": "y"}, {"answer": "  "}], "x"):
        with pytest.raises(ApiError) as e:
            public_routes.validate_answers(_payload(answers=bad))
        assert e.value.message == public_routes.MSG_ANSWERS


def test_build_skill_ratings_ignores_extras_and_rejects_bad():
    out = public_routes.build_skill_ratings(_payload(), SKILLS_Q)
    assert [r["id"] for r in out] == ["skill_react", "skill_git"]
    assert out[0]["required"] is True and out[0]["proficiency"] == 5
    bad_cases = [
        [{"id": "skill_react", "proficiency": 5, "years": "5+"}],  # missing one
        [{"id": "skill_react", "proficiency": 0, "years": "5+"}, {"id": "skill_git", "proficiency": 3, "years": "1-2"}],
        [{"id": "skill_react", "proficiency": 5.5, "years": "5+"}, {"id": "skill_git", "proficiency": 3, "years": "1-2"}],
        [{"id": "skill_react", "proficiency": True, "years": "5+"}, {"id": "skill_git", "proficiency": 3, "years": "1-2"}],
        [{"id": "skill_react", "proficiency": 5, "years": "9"}, {"id": "skill_git", "proficiency": 3, "years": "1-2"}],
    ]
    for skills in bad_cases:
        with pytest.raises(ApiError) as e:
            public_routes.build_skill_ratings(_payload(skills=skills), SKILLS_Q)
        assert e.value.message == public_routes.MSG_SKILLS


# ---------------- DB-free route tests ----------------

@pytest.fixture
def fake(monkeypatch, tmp_path):
    monkeypatch.setenv("RIDDLEX_STORAGE", "local")
    monkeypatch.setenv("RIDDLEX_LOCAL_DIR", str(tmp_path))
    state = {"status": "Open", "inserted": [], "insert_exc": None}
    job = lambda: {"id": "job-1", "orgEmail": "o@x.com", "title": "t", "publicToken": TOKEN,  # noqa: E731
                   "status": state["status"]}
    monkeypatch.setattr(repo_public, "get_job", lambda jid: job() if jid == "job-1" else None)
    monkeypatch.setattr(repo_public, "get_or_create_questionnaire", lambda j, k, lang: SKILLS_Q)

    def ins(app_id, job_id, a):
        if state["insert_exc"]:
            raise state["insert_exc"]
        state["inserted"].append((app_id, job_id, a))

    monkeypatch.setattr(repo_public, "insert_application", ins)
    state["dir"] = tmp_path
    return state


def test_happy_path_fake(anon_client, fake):
    r = _post(anon_client, _payload())
    assert r.status_code == 201
    app_id, job_id, a = fake["inserted"][0]
    assert r.get_json() == {"id": app_id} and job_id == "job-1"
    assert a["email"] == "ada@example.com" and a["resume_file_name"] == "cv.pdf"
    assert a["skills_match"] == questionnaire.score_skills(a["skills"]) == 87  # client's 100 ignored
    path = a["resume_blob_path"]
    assert path.startswith("resumes/") and path.endswith(".pdf") and "ada" not in path and "job-1" not in path
    assert (fake["dir"] / blob_storage.resume_container() / path).is_file()


def test_status_order_404_403_410(anon_client, fake):
    assert _post(anon_client, _payload(jobId="nope")).status_code == 404
    assert _post(anon_client, _payload(token="bad")).status_code == 403
    fake["status"] = "Closed"
    assert _post(anon_client, _payload()).status_code == 410


def test_missing_resume_and_bad_json(anon_client, fake):
    r = _post(anon_client, _payload(), resume=None)
    assert (r.status_code, r.get_json()["message"]) == (400, public_routes.MSG_BASICS)
    assert _post(anon_client, None, raw="{oops").status_code == 400


def test_text_file_named_pdf_rejected(anon_client, fake):
    r = _post(anon_client, _payload(), resume=(b"hello world", "cv.pdf"))
    assert (r.status_code, r.get_json()["message"]) == (400, public_routes.MSG_RESUME_TYPE)
    assert not fake["inserted"]


def test_size_cap(anon_client, fake):
    big = b"%PDF" + b"0" * public_routes.MAX_RESUME_BYTES  # 5 MB + 4 bytes
    r = _post(anon_client, _payload(), resume=(big, "cv.pdf"))
    assert (r.status_code, r.get_json()["message"]) == (400, public_routes.MSG_RESUME_SIZE)
    ok = b"%PDF" + b"0" * (public_routes.MAX_RESUME_BYTES - 4)  # exactly 5 MB
    assert _post(anon_client, _payload(), resume=(ok, "cv.pdf")).status_code == 201


def test_validation_messages(anon_client, fake):
    r = _post(anon_client, _payload(answers=[{"question": "q", "answer": "a"}]))
    assert r.get_json()["message"] == public_routes.MSG_ANSWERS
    r = _post(anon_client, _payload(skills=[]))
    assert (r.status_code, r.get_json()["message"]) == (400, public_routes.MSG_SKILLS)


def test_insert_failure_deletes_blob(anon_client, fake):
    fake["insert_exc"] = RuntimeError("boom")
    with pytest.raises(RuntimeError):
        anon_client.application.config["PROPAGATE_EXCEPTIONS"] = True
        _post(anon_client, _payload())
    files = [p for p in (fake["dir"] / blob_storage.resume_container()).rglob("*") if p.is_file()]
    assert files == []


def test_duplicate_maps_to_409_and_cleans_blob(anon_client, fake):
    import mysql.connector

    fake["insert_exc"] = mysql.connector.IntegrityError(msg="dup", errno=1062)
    r = _post(anon_client, _payload())
    assert (r.status_code, r.get_json()["message"]) == (409, public_routes.MSG_DUPLICATE)
    assert [p for p in (fake["dir"] / blob_storage.resume_container()).rglob("*") if p.is_file()] == []


def test_rate_limit_on_sixth_call(anon_client, fake):
    codes = [_post(anon_client, _payload()).status_code for _ in range(6)]
    assert codes[:5] == [201] * 5 and codes[5] == 429
    assert anon_client.application and "message" in _post(anon_client, _payload()).get_json()


# ---------------- DB-backed ----------------

def _insert_job(db, status="Open"):
    jid, token = str(uuid.uuid4()), uuid.uuid4().hex
    cur = db.cursor()
    cur.execute(
        "INSERT INTO riddlex_jobs (id, org_email, title, description, requirements, location, job_type, "
        "language, status, public_token, created_at) VALUES (%s,'owner@x.com','Front-End Engineer (React)',"
        "'desc','3+ years React and TypeScript','Cairo','Full-time','en',%s,%s,'2026-01-01 00:00:00')",
        (jid, status, token))
    db.commit()
    return jid, token


def _skills_for(client, jid, token, **kw):
    r = client.post("/api/riddlex/public/skills-questionnaire", json={"jobId": jid, "token": token})
    assert r.status_code == 200
    return r.get_json(), [{"id": q["id"], "proficiency": 4, "years": "3-5", **kw} for q in r.get_json()]


@pytest.fixture
def local_storage(monkeypatch, tmp_path):
    monkeypatch.setenv("RIDDLEX_STORAGE", "local")
    monkeypatch.setenv("RIDDLEX_LOCAL_DIR", str(tmp_path))


def _db_payload(client, jid, token, email="Cand@Example.com", **over):
    _, ratings = _skills_for(client, jid, token)
    return _payload(jobId=jid, token=token, skills=ratings,
                    applicant={"fullName": "Cand", "email": email, "mobileNumber": "1"}, **over)


def test_db_happy_path(client, db, local_storage):
    jid, token = _insert_job(db)
    qs, _ = _skills_for(client, jid, token)
    p = _db_payload(client, jid, token, skillsMatch=1)
    r = _post(client, p)
    assert r.status_code == 201
    app_id = r.get_json()["id"]
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT * FROM riddlex_applications WHERE id=%s", (app_id,))
    row = cur.fetchone()
    assert row["applicant_email"] == "cand@example.com" and row["stage"] == "New" and row["notes"] == ""
    assert row["resume_file_name"] == "cv.pdf" and row["resume_blob_path"].startswith("resumes/")
    expected = questionnaire.score_skills([{**q, "proficiency": 4} for q in qs])
    assert row["skills_match"] == expected != 1
    cur.execute("SELECT stage FROM riddlex_application_history WHERE application_id=%s", (app_id,))
    assert [h["stage"] for h in cur.fetchall()] == ["New"]


def test_db_duplicate_email_different_case_409(client, db, local_storage):
    jid, token = _insert_job(db)
    assert _post(client, _db_payload(client, jid, token, email="a@b.com")).status_code == 201
    r = _post(client, _db_payload(client, jid, token, email="A@B.COM"))
    assert (r.status_code, r.get_json()["message"]) == (409, public_routes.MSG_DUPLICATE)
    cur = db.cursor()
    cur.execute("SELECT COUNT(*) FROM riddlex_applications")
    assert cur.fetchone()[0] == 1
    cur.execute("SELECT COUNT(*) FROM riddlex_application_history")
    assert cur.fetchone()[0] == 1


def test_db_closed_job_410(client, db, local_storage):
    jid, token = _insert_job(db, status="Closed")
    r = _post(client, _payload(jobId=jid, token=token))
    assert (r.status_code, r.get_json()["message"]) == (410, "This job is no longer accepting applications.")


def test_db_missing_rating_400(client, db, local_storage):
    jid, token = _insert_job(db)
    p = _db_payload(client, jid, token)
    p["skills"] = p["skills"][1:]
    r = _post(client, p)
    assert (r.status_code, r.get_json()["message"]) == (400, public_routes.MSG_SKILLS)
