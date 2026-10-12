"""Questionnaire logic tests: golden parity with the TS mock + AI fallback behaviour.

No database or network. Golden values live in fixtures/ts_golden.json, produced by
running riddlexMockServer.ts (generateSkillsQuestionnaire / generateQuestions) on the
3 seed jobs plus extra edge-case jobs created through the mock's createJob.
"""

import json
import logging
from pathlib import Path

import pytest

from riddlex import questionnaire as q

GOLDEN = json.loads(
    (Path(__file__).parent / "fixtures" / "ts_golden.json").read_text(encoding="utf-8")
)
CASES = GOLDEN["cases"]
SEED_IDS = {"job_frontend_engineer", "job_data_analyst", "job_hr_intern"}

FRONTEND_JOB = {
    "title": "Front-End Engineer (React)",
    "description": "Build fast, accessible interfaces for our HR analytics platform.",
    "requirements": (
        "3+ years with React and TypeScript, Tailwind CSS, REST API integration, "
        "accessibility (WCAG) and performance profiling."
    ),
    "location": "Hybrid — Cairo, Egypt",
    "jobType": "Full-time",
}


# --- golden parity ---------------------------------------------------------

def test_golden_covers_seed_jobs_and_extras():
    names = {c["name"] for c in CASES}
    assert SEED_IDS <= names
    assert len(CASES) >= 10


@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_skill_catalog_matches_ts(case):
    assert q.build_skill_catalog_questions(case["job"]) == case["skills"]


@pytest.mark.parametrize("lang", ["en", "ar", "fr"])
@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_screening_questions_match_ts(case, lang):
    assert q.build_screening_questions(case["job"], lang) == case["screening"][lang]


def test_skill_questions_match_mock_for_frontend_job():
    ids = [x["id"] for x in q.build_skill_catalog_questions(FRONTEND_JOB)]
    assert ids[:4] == ["skill_react", "skill_typescript", "skill_tailwind_css", "skill_rest_api_integration"]


def test_screening_min_chars_and_count():
    out = q.build_screening_questions(FRONTEND_JOB, "en")
    assert [x["minChars"] for x in out] == [20, 20, 2]
    assert len(out) == 3


def test_unknown_language_uses_english():
    assert q.build_screening_questions(FRONTEND_JOB, "de") == q.build_screening_questions(FRONTEND_JOB, "en")


def test_empty_location_becomes_on_site():
    job = dict(FRONTEND_JOB, location="")
    assert "(on-site)" in q.build_screening_questions(job, "en")[2]["question"]


def test_skill_id_slug_rule():
    assert q.skill_id("Next.js") == "skill_next_js"
    assert q.skill_id("Written & verbal communication") == "skill_written_verbal_communication"
    assert q.skill_id("  --Hello World!!  ") == "skill_hello_world"


def test_word_start_matching():
    # "git" must not match "digital"; "react" must not match "Preact" (word start only).
    job = {"title": "Digital Preact", "description": "", "requirements": ""}
    ids = [x["id"] for x in q.build_skill_catalog_questions(job)]
    assert "skill_git" not in ids and "skill_react" not in ids


def test_skills_bounds_and_order():
    for c in CASES:
        out = q.build_skill_catalog_questions(c["job"])
        assert 4 <= len(out) <= 8
        cats = [x["category"] for x in out if x["required"]]
        assert cats == sorted(cats, key=q.CATEGORY_ORDER.index)


# --- AI layer ----------------------------------------------------------------

VALID_SKILLS = {
    "skills": [
        {"skill": "Kubernetes", "category": "Tools", "required": True},
        {"skill": "Go", "category": "Technical", "required": True},
        {"skill": "Mentoring", "category": "Professional", "required": False},
        {"skill": "Terraform", "category": "Tools", "required": False},
    ]
}
VALID_QUESTIONS = {"questions": ["Q one?", "Q two?", "Q three?"]}


def _raise(exc):
    def boom(*a, **k):
        raise exc

    return boom


def test_unconfigured_env_skips_to_catalog(monkeypatch):
    for name in ("AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_KEY", "AZURE_OPENAI_DEPLOYMENT"):
        monkeypatch.delenv(name, raising=False)
    payload, source = q.generate_with_fallback(FRONTEND_JOB, "skills", "en")
    assert source == "catalog"
    assert payload == q.build_skill_catalog_questions(FRONTEND_JOB)


def test_partially_configured_env_skips_to_catalog(monkeypatch):
    monkeypatch.setenv("AZURE_OPENAI_ENDPOINT", "https://example.invalid")
    monkeypatch.setenv("AZURE_OPENAI_KEY", "k")
    monkeypatch.delenv("AZURE_OPENAI_DEPLOYMENT", raising=False)
    with pytest.raises(q.AIUnavailable):
        q._call_openai("p")


@pytest.mark.parametrize("kind", ["skills", "screening"])
def test_ai_failure_falls_back_to_catalog(monkeypatch, kind):
    monkeypatch.setattr(q, "_call_openai", _raise(TimeoutError()))
    payload, source = q.generate_with_fallback(FRONTEND_JOB, kind, "en")
    assert source == "catalog" and payload
    expected = (
        q.build_skill_catalog_questions(FRONTEND_JOB)
        if kind == "skills"
        else q.build_screening_questions(FRONTEND_JOB, "en")
    )
    assert payload == expected


BAD_SKILLS = [
    {},
    {"skills": "nope"},
    {"skills": VALID_SKILLS["skills"][:3]},  # too few
    {"skills": VALID_SKILLS["skills"] * 3},  # too many (and duplicate)
    {"skills": [dict(s, category="Soft") for s in VALID_SKILLS["skills"]]},
    {"skills": [dict(s, required="yes") for s in VALID_SKILLS["skills"]]},
    {"skills": [dict(s, skill="  ") for s in VALID_SKILLS["skills"]]},
    {"skills": [dict(s, skill=5) for s in VALID_SKILLS["skills"]]},
    {"skills": ["Kubernetes"] * 4},
    {"skills": [dict(s, skill="Same") for s in VALID_SKILLS["skills"]]},  # duplicate ids
    {"skills": [dict(s, skill="!!!") for s in VALID_SKILLS["skills"]]},  # empty slug
    {"skills": [dict(s, skill=s["skill"] + "x" * 80) for s in VALID_SKILLS["skills"]]},  # too long
    None,
    "not json {",
]


@pytest.mark.parametrize("bad", BAD_SKILLS)
def test_invalid_ai_skills_shape_falls_back(monkeypatch, bad):
    monkeypatch.setattr(q, "_call_openai", lambda *a, **k: bad)
    payload, source = q.generate_with_fallback(FRONTEND_JOB, "skills", "en")
    assert source == "catalog"
    assert payload == q.build_skill_catalog_questions(FRONTEND_JOB)


BAD_QUESTIONS = [
    {},
    {"questions": ["a", "b"]},
    {"questions": ["a", "b", "c", "d"]},
    {"questions": ["a", "", "c"]},
    {"questions": ["a", "  ", "c"]},
    {"questions": ["a", 2, "c"]},
    {"questions": "abc"},
    {"questions": [["a"], "b", "c"]},
    {"questions": ["a", "b" * 501, "c"]},  # too long
]


@pytest.mark.parametrize("bad", BAD_QUESTIONS)
def test_invalid_ai_screening_shape_falls_back(monkeypatch, bad):
    monkeypatch.setattr(q, "_call_openai", lambda *a, **k: bad)
    payload, source = q.generate_with_fallback(FRONTEND_JOB, "screening", "fr")
    assert source == "catalog"
    assert payload == q.build_screening_questions(FRONTEND_JOB, "fr")


def test_valid_ai_skills_accepted(monkeypatch):
    monkeypatch.setattr(q, "_call_openai", lambda *a, **k: VALID_SKILLS)
    payload, source = q.generate_with_fallback(FRONTEND_JOB, "skills", "en")
    assert source == "ai"
    assert payload == [
        # normalised to catalog order: required first, then Technical -> Tools -> Professional
        {"id": "skill_go", "skill": "Go", "category": "Technical", "required": True},
        {"id": "skill_kubernetes", "skill": "Kubernetes", "category": "Tools", "required": True},
        {"id": "skill_terraform", "skill": "Terraform", "category": "Tools", "required": False},
        {"id": "skill_mentoring", "skill": "Mentoring", "category": "Professional", "required": False},
    ]


def test_valid_ai_screening_accepted(monkeypatch):
    monkeypatch.setattr(q, "_call_openai", lambda *a, **k: VALID_QUESTIONS)
    payload, source = q.generate_with_fallback(FRONTEND_JOB, "screening", "en")
    assert source == "ai"
    assert payload == [
        {"question": "Q one?", "minChars": 20},
        {"question": "Q two?", "minChars": 20},
        {"question": "Q three?", "minChars": 2},
    ]


def test_ai_receives_prompt_with_language_and_timeout_default(monkeypatch):
    seen = {}

    def fake(prompt, **kw):
        seen["prompt"], seen["kw"] = prompt, kw
        return VALID_QUESTIONS

    monkeypatch.setattr(q, "_call_openai", fake)
    q.generate_with_fallback(FRONTEND_JOB, "screening", "ar")
    assert "'ar'" in seen["prompt"] and "Front-End Engineer" in seen["prompt"]
    assert seen["kw"] == {}


def test_unknown_kind_rejected():
    with pytest.raises(ValueError):
        q.generate_with_fallback(FRONTEND_JOB, "bogus", "en")


class _FakeClient:
    def __init__(self, content):
        self.calls = []
        outer = self

        class _Completions:
            def create(self, **kw):
                outer.calls.append(kw)
                msg = type("M", (), {"content": content})()
                return type("R", (), {"choices": [type("C", (), {"message": msg})()]})()

        self.chat = type("Chat", (), {"completions": _Completions()})()


def test_call_openai_uses_json_mode_with_injected_client(monkeypatch):
    monkeypatch.setenv("AZURE_OPENAI_ENDPOINT", "https://example.invalid")
    monkeypatch.setenv("AZURE_OPENAI_KEY", "test-key")
    monkeypatch.setenv("AZURE_OPENAI_DEPLOYMENT", "dep")
    client = _FakeClient(json.dumps(VALID_QUESTIONS))
    payload, source = q.generate_with_fallback(FRONTEND_JOB, "screening", "en", client=client)
    assert source == "ai" and len(payload) == 3
    call = client.calls[0]
    assert call["response_format"] == {"type": "json_object"}
    assert call["model"] == "dep" and call["timeout"] == 8


def test_malformed_json_from_client_falls_back(monkeypatch):
    monkeypatch.setenv("AZURE_OPENAI_ENDPOINT", "https://example.invalid")
    monkeypatch.setenv("AZURE_OPENAI_KEY", "test-key")
    monkeypatch.setenv("AZURE_OPENAI_DEPLOYMENT", "dep")
    _, source = q.generate_with_fallback(FRONTEND_JOB, "skills", "en", client=_FakeClient("{oops"))
    assert source == "catalog"


def test_logs_never_contain_job_text_or_keys(monkeypatch, caplog):
    monkeypatch.setenv("AZURE_OPENAI_KEY", "super-secret-key")
    secret_job = dict(FRONTEND_JOB, title="TopSecretTitleXYZ")
    monkeypatch.setattr(q, "_call_openai", _raise(RuntimeError("boom super-secret-key")))
    with caplog.at_level(logging.DEBUG, logger=q.logger.name):
        q.generate_with_fallback(secret_job, "skills", "en")
        monkeypatch.setattr(q, "_call_openai", lambda *a, **k: {"skills": []})
        q.generate_with_fallback(secret_job, "skills", "en")
    text = caplog.text
    assert "TopSecretTitleXYZ" not in text and "super-secret-key" not in text
