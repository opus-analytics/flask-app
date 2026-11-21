"""Custom job questions: pure validators, route flag gating, public visibility and apply snapshot.

Most tests are DB-free (repo functions and the auth subscription lookup are monkeypatched). The
DB-backed tests at the bottom skip unless RIDDLEX_TEST_DB_* is set.
"""
import io
import json
import uuid
from types import SimpleNamespace

import pytest

from riddlex import auth as riddlex_auth
from riddlex import public_routes, repo_jobs, repo_public
from riddlex.errors import ApiError
from riddlex.limits import limiter
from opus_api.models.subscriptions import Subscription

FLAG_OFF = "Custom questions are not enabled for your subscription."
TOKEN = "tok-secret-123"
APPLY_URL = "/api/riddlex/public/apply"
PUBLIC = "/api/riddlex/public/jobs/job-1"
JOBS = "/api/riddlex/jobs"
JOB = {"title": "Backend Engineer", "description": "d", "requirements": "r",
       "location": "Cairo", "jobType": "Full-time", "language": "en"}

Q_TEXT = {"id": "years", "label": "Years of React?", "type": "text", "required": True}
Q_AREA = {"id": "bio", "label": "Tell us more", "type": "textarea", "required": False}
Q_SELECT = {"id": "visa", "label": "Visa?", "type": "select", "required": False, "options": ["Yes", "No"]}
STORED = [Q_TEXT, Q_AREA, Q_SELECT]  # shape as returned by validate_custom_questions


def _q(**over):
    return {**Q_TEXT, **over}


def _qs(*items):
    return [dict(i) for i in items]


# ---------------- validate_custom_questions (pure) ----------------

def test_validate_accepts_text_textarea_select():
    out = repo_jobs.validate_custom_questions(_qs(Q_TEXT, Q_AREA, Q_SELECT))
    assert out == STORED  # options kept only on select, all four keys present


def test_validate_empty_list_ok_and_strips_label():
    assert repo_jobs.validate_custom_questions([]) == []
    assert repo_jobs.validate_custom_questions([_q(label="  Hi  ")])[0]["label"] == "Hi"


def test_validate_accepts_exactly_twenty():
    qs = [_q(id=f"q{i}") for i in range(20)]
    assert len(repo_jobs.validate_custom_questions(qs)) == 20


@pytest.mark.parametrize("raw,needle", [
    ("nope", "must be a list"),
    ([1], "Invalid custom question"),
    ([_q(id="a"), _q(id="a")], "unique id"),
    ([_q(id="Bad Id")], "unique id"),
    ([_q(id="x" * 41)], "unique id"),
    ([_q(id=None)], "unique id"),
    ([_q(label="")], "label"),
    ([_q(label="   ")], "label"),
    ([_q(label="x" * 201)], "label"),
    ([_q(type="email")], "text, textarea or select"),
    ([_q(required="yes")], "required must be"),
    ([{**Q_SELECT, "options": ["Yes"]}], "2-20 unique options"),
    ([{**Q_SELECT, "options": ["Yes", "Yes"]}], "2-20 unique options"),
    ([{**Q_SELECT, "options": ["Yes", ""]}], "2-20 unique options"),
    ([{**Q_SELECT, "options": ["Yes", "o" * 101]}], "2-20 unique options"),
    ([{**Q_SELECT, "options": [f"o{i}" for i in range(21)]}], "2-20 unique options"),
    ([{**Q_SELECT, "options": None}], "2-20 unique options"),
    ([{**Q_TEXT, "options": ["a", "b"]}], "Only select"),
])
def test_validate_rejects(raw, needle):
    with pytest.raises(ApiError) as e:
        repo_jobs.validate_custom_questions(raw)
    assert e.value.status == 400 and needle in e.value.message


def test_validate_rejects_more_than_twenty():
    with pytest.raises(ApiError) as e:
        repo_jobs.validate_custom_questions([_q(id=f"q{i}") for i in range(21)])
    assert "at most 20" in e.value.message


def test_validate_rejects_id_with_trailing_newline():
    with pytest.raises(ApiError):
        repo_jobs.validate_custom_questions([_q(id="years\n")])


# ---------------- build_custom_answers (pure) ----------------

def _answers(*items):
    return {"customAnswers": [dict(i) for i in items]}


VALID = [{"id": "years", "answer": "3"}, {"id": "bio", "answer": "hi"}, {"id": "visa", "answer": "Yes"}]


def test_build_happy_path_snapshot_shape():
    out = public_routes.build_custom_answers(_answers(*VALID), STORED)
    assert out == [
        {"id": "years", "question": "Years of React?", "type": "text", "answer": "3"},
        {"id": "bio", "question": "Tell us more", "type": "textarea", "answer": "hi"},
        {"id": "visa", "question": "Visa?", "type": "select", "answer": "Yes"},
    ]


def test_build_required_missing_or_blank_rejected():
    for given in ([], [{"id": "years", "answer": "   "}], [{"id": "years", "answer": None}]):
        with pytest.raises(ApiError) as e:
            public_routes.build_custom_answers({"customAnswers": given}, STORED)
        assert e.value.message == public_routes.MSG_CUSTOM


def test_build_optional_missing_becomes_empty_string():
    out = public_routes.build_custom_answers(_answers({"id": "years", "answer": "1"}), STORED)
    assert [a["answer"] for a in out] == ["1", "", ""]


def test_build_unknown_id_rejected():
    with pytest.raises(ApiError):
        public_routes.build_custom_answers(_answers(*VALID, {"id": "ghost", "answer": "x"}), STORED)


def test_build_duplicate_id_rejected():
    with pytest.raises(ApiError):
        public_routes.build_custom_answers(_answers(*VALID, {"id": "bio", "answer": "again"}), STORED)


def test_build_text_length_limits():
    ok = public_routes.build_custom_answers(_answers({"id": "years", "answer": "a" * 500}), STORED)
    assert len(ok[0]["answer"]) == 500
    with pytest.raises(ApiError):
        public_routes.build_custom_answers(_answers({"id": "years", "answer": "a" * 501}), STORED)


def test_build_textarea_length_limits():
    ok = public_routes.build_custom_answers(_answers({"id": "years", "answer": "1"},
                                                     {"id": "bio", "answer": "b" * 5000}), STORED)
    assert len(ok[1]["answer"]) == 5000
    with pytest.raises(ApiError):
        public_routes.build_custom_answers(_answers({"id": "years", "answer": "1"},
                                                     {"id": "bio", "answer": "b" * 5001}), STORED)


def test_build_select_must_be_an_option():
    with pytest.raises(ApiError):
        public_routes.build_custom_answers(_answers(*VALID[:2], {"id": "visa", "answer": "Maybe"}), STORED)


def test_build_optional_select_blank_ok():
    out = public_routes.build_custom_answers(_answers({"id": "years", "answer": "1"}), STORED)
    assert out[2] == {"id": "visa", "question": "Visa?", "type": "select", "answer": ""}


def test_build_snapshot_uses_stored_label_not_client_label():
    given = {"customAnswers": [{"id": "years", "answer": "3", "question": "EVIL", "label": "EVIL"}]}
    out = public_routes.build_custom_answers(given, [Q_TEXT])
    assert out[0]["question"] == "Years of React?"


@pytest.mark.parametrize("given", ["notalist", [{"answer": "x"}], [{"id": "years", "answer": 5}],
                                   [{"id": 7, "answer": "x"}], ["years"]])
def test_build_malformed_input_rejected(given):
    with pytest.raises(ApiError):
        public_routes.build_custom_answers({"customAnswers": given}, [Q_TEXT])


# ---------------- Subscription constructor (9 and 10 positional args) ----------------

def test_subscription_accepts_nine_and_ten_positional_args():
    base = (1, "e@x.com", "RiddleX", "active", None, None, "res", "o@x.com")
    nine = Subscription(*base, "user")
    assert nine.custom_questions_enabled is False
    ten = Subscription(*base, "user", 1)
    assert ten.custom_questions_enabled is True and ten.owner == "o@x.com"


# ---------------- route fixtures (DB-free) ----------------

@pytest.fixture
def owner(monkeypatch):
    """org_required without a DB: any Bearer token maps to o@x.com; subscription flag from state['flag']."""
    state = {"flag": False}
    monkeypatch.setattr(riddlex_auth.auth, "verify_token_callback", lambda token: "o@x.com")
    monkeypatch.setattr(riddlex_auth, "_resolve_sub", lambda email: SimpleNamespace(owner="o@x.com"))
    monkeypatch.setattr(repo_public, "custom_questions_enabled", lambda org: state["flag"])
    state["h"] = {"Authorization": "Bearer any"}
    return state


@pytest.fixture
def jobs_api(anon_client, owner, monkeypatch):
    state = {"created": [], "set": []}
    monkeypatch.setattr(repo_jobs, "site_languages", lambda org: ["en"])

    def create(org, fields):
        state["created"].append(fields)
        return {"id": "job-1", "customQuestions": fields["custom_questions"]}

    def set_q(org, job_id, qs):
        state["set"].append((job_id, qs))
        return {"id": job_id, "customQuestions": qs}

    monkeypatch.setattr(repo_jobs, "job_create", create)
    monkeypatch.setattr(repo_jobs, "job_set_questions", set_q)
    state["client"] = anon_client
    return state


def test_post_jobs_flag_off_with_questions_403(jobs_api, owner):
    r = jobs_api["client"].post(JOBS, headers=owner["h"], json={**JOB, "customQuestions": [Q_TEXT]})
    assert (r.status_code, r.get_json()) == (403, {"message": FLAG_OFF})
    assert jobs_api["created"] == []


def test_post_jobs_flag_off_without_questions_201(jobs_api, owner):
    r = jobs_api["client"].post(JOBS, headers=owner["h"], json={**JOB, "customQuestions": []})
    assert r.status_code == 201 and jobs_api["created"][0]["custom_questions"] == []


def test_post_jobs_flag_on_returns_questions(jobs_api, owner):
    owner["flag"] = True
    r = jobs_api["client"].post(JOBS, headers=owner["h"], json={**JOB, "customQuestions": [Q_SELECT]})
    assert r.status_code == 201
    assert r.get_json()["customQuestions"] == [Q_SELECT]


def test_post_jobs_flag_on_invalid_questions_400(jobs_api, owner):
    owner["flag"] = True
    r = jobs_api["client"].post(JOBS, headers=owner["h"], json={**JOB, "customQuestions": [_q(type="email")]})
    assert r.status_code == 400 and jobs_api["created"] == []


def test_put_custom_questions_flag_off_403(jobs_api, owner):
    r = jobs_api["client"].put(f"{JOBS}/job-1/custom-questions", headers=owner["h"],
                               json={"customQuestions": [Q_TEXT]})
    assert (r.status_code, r.get_json()) == (403, {"message": FLAG_OFF})
    assert jobs_api["set"] == []


def test_put_custom_questions_flag_on_saves(jobs_api, owner):
    owner["flag"] = True
    r = jobs_api["client"].put(f"{JOBS}/job-1/custom-questions", headers=owner["h"],
                               json={"customQuestions": [Q_TEXT]})
    assert r.status_code == 200 and r.get_json()["customQuestions"] == [Q_TEXT]
    assert jobs_api["set"] == [("job-1", [Q_TEXT])]


def test_entitlements_reports_flag(jobs_api, owner):
    assert jobs_api["client"].get("/api/riddlex/entitlements", headers=owner["h"]).get_json() == \
        {"customQuestionsEnabled": False}
    owner["flag"] = True
    assert jobs_api["client"].get("/api/riddlex/entitlements", headers=owner["h"]).get_json() == \
        {"customQuestionsEnabled": True}


# ---------------- public job visibility (DB-free) ----------------

@pytest.fixture
def public_api(anon_client, monkeypatch):
    state = {"flag": False, "job": {
        "id": "job-1", "orgEmail": "o@x.com", "title": "Engineer", "description": "d", "requirements": "r",
        "location": "Remote", "jobType": "Full-time", "language": "en", "status": "Open",
        "publicToken": TOKEN, "createdAt": "2026-01-01T00:00:00.000Z", "customQuestions": [Q_TEXT]}}
    monkeypatch.setattr(repo_public, "get_job", lambda jid: state["job"] if jid == "job-1" else None)
    monkeypatch.setattr(repo_public, "get_site_for_org", lambda org: None)
    monkeypatch.setattr(repo_public, "custom_questions_enabled", lambda org: state["flag"])
    state["client"] = anon_client
    return state


def test_public_job_hides_questions_when_flag_off(public_api):
    r = public_api["client"].get(f"{PUBLIC}?token={TOKEN}")
    assert r.status_code == 200 and r.get_json()["job"]["customQuestions"] == []
    assert "Years of React" not in r.get_data(as_text=True)


def test_public_job_shows_questions_when_flag_on(public_api):
    public_api["flag"] = True
    body = public_api["client"].get(f"{PUBLIC}?token={TOKEN}").get_json()
    assert body["job"]["customQuestions"] == [Q_TEXT]
    assert "publicToken" not in body["job"] and "orgEmail" not in body["job"]


# ---------------- POST /public/apply (DB-free) ----------------

PDF = b"%PDF-1.4\n" + b"x" * 50
SKILLS_Q = [{"id": "skill_react", "skill": "React", "category": "Technical", "required": True}]


@pytest.fixture
def apply_api(anon_client, monkeypatch, tmp_path):
    import app  # noqa: F401  (initialises limiter storage)
    limiter.reset()
    monkeypatch.setenv("RIDDLEX_STORAGE", "local")
    monkeypatch.setenv("RIDDLEX_LOCAL_DIR", str(tmp_path))
    state = {"flag": False, "inserted": [], "client": anon_client}
    job = {"id": "job-1", "orgEmail": "o@x.com", "publicToken": TOKEN, "status": "Open",
           "customQuestions": [Q_TEXT, Q_SELECT]}
    monkeypatch.setattr(repo_public, "get_job", lambda jid: job if jid == "job-1" else None)
    monkeypatch.setattr(repo_public, "custom_questions_enabled", lambda org: state["flag"])
    monkeypatch.setattr(repo_public, "get_or_create_questionnaire", lambda j, k, lang: SKILLS_Q)
    monkeypatch.setattr(repo_public, "insert_application",
                        lambda app_id, job_id, a: state["inserted"].append(a))
    yield state
    limiter.reset()


def _apply_payload(**over):
    p = {"jobId": "job-1", "token": TOKEN,
         "applicant": {"fullName": "Ada", "email": "ada@example.com", "mobileNumber": "0100"},
         "answers": [{"question": f"q{i}", "answer": "a"} for i in range(3)],
         "skills": [{"id": "skill_react", "proficiency": 4, "years": "3-5"}]}
    p.update(over)
    return p


def _apply(client, payload):
    return client.post(APPLY_URL, data={
        "payload": json.dumps(payload),
        "resume": (io.BytesIO(PDF), "cv.pdf"),
    }, content_type="multipart/form-data")


def test_apply_ignores_custom_answers_when_flag_off(apply_api):
    # Garbage customAnswers would be rejected if validated; with the flag off they must be ignored.
    r = _apply(apply_api["client"], _apply_payload(customAnswers=[{"id": "ghost", "answer": "x"}]))
    assert r.status_code == 201
    assert apply_api["inserted"][0]["custom_answers"] is None


def test_apply_flag_on_stores_snapshot(apply_api):
    apply_api["flag"] = True
    payload = _apply_payload(customAnswers=[
        {"id": "years", "answer": " 4 ", "question": "EVIL"},
        {"id": "visa", "answer": "No"},
    ])
    r = _apply(apply_api["client"], payload)
    assert r.status_code == 201
    # The apply fixture's job stores only Q_TEXT and Q_SELECT; the snapshot uses the stored labels.
    assert apply_api["inserted"][0]["custom_answers"] == [
        {"id": "years", "question": "Years of React?", "type": "text", "answer": "4"},
        {"id": "visa", "question": "Visa?", "type": "select", "answer": "No"},
    ]


def test_apply_flag_on_required_missing_400(apply_api):
    apply_api["flag"] = True
    r = _apply(apply_api["client"], _apply_payload(customAnswers=[{"id": "visa", "answer": "No"}]))
    assert (r.status_code, r.get_json()["message"]) == (400, public_routes.MSG_CUSTOM)
    assert apply_api["inserted"] == []


# ---------------- DB-backed (skipped unless RIDDLEX_TEST_DB_* is set) ----------------

def test_db_flag_read_from_subscription(client, db, auth_headers):
    from app import app
    auth_headers(org="flag@x.com", user="flag@x.com")
    with app.app_context():
        assert repo_public.custom_questions_enabled("flag@x.com") is False
    cur = db.cursor()
    cur.execute("UPDATE subscription SET custom_questions_enabled=1 WHERE owner=%s", ("flag@x.com",))
    db.commit()
    with app.app_context():
        assert repo_public.custom_questions_enabled("flag@x.com") is True


def test_db_create_with_questions_and_list(client, db, auth_headers):
    h = auth_headers(org="q@x.com", user="q@x.com")
    cur = db.cursor()
    cur.execute("UPDATE subscription SET custom_questions_enabled=1 WHERE owner=%s", ("q@x.com",))
    db.commit()
    r = client.post(JOBS, headers=h, json={**JOB, "customQuestions": [Q_SELECT]})
    assert r.status_code == 201 and r.get_json()["customQuestions"] == [Q_SELECT]
    listed = client.get(JOBS, headers=h).get_json()
    assert listed[0]["customQuestions"] == [Q_SELECT]


def test_db_create_with_questions_flag_off_403(client, db, auth_headers):
    h = auth_headers(org="n@x.com", user="n@x.com")
    r = client.post(JOBS, headers=h, json={**JOB, "customQuestions": [Q_TEXT]})
    assert (r.status_code, r.get_json()["message"]) == (403, FLAG_OFF)
