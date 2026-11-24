"""Ranking tests: OpenAI client mocked, no disk, no network."""
import io
import json
import os
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from docx import Document

from versa import ranking


def docx_bytes(text):
    buf = io.BytesIO()
    d = Document()
    d.add_paragraph(text)
    d.save(buf)
    return buf.getvalue()


def fake_client(reply):
    c = MagicMock()
    c.chat.completions.create.return_value = SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=reply if isinstance(reply, str) else json.dumps(reply)))])
    return c


CVS = [(0, "a.docx", "cv a"), (1, "b.docx", "cv b"), (2, "c_cv.docx", "cv c")]


def row(token, name, score):
    return {"token": token, "fullName": name, "score": score, "summary": "s", "strengths": ["x"], "gaps": ["y"]}


def test_sorted_ranked_and_initials():
    reply = {"candidates": [row("C1", "Jane Doe", 70), row("C2", "Omar Ali Hassan", 90), row("C3", "", 80)],
             "narrative": "# Ranking [C2] first"}
    md, cands = ranking.rank_candidates(fake_client(reply), "m", CVS)
    assert md == "# Ranking [C2] first"
    assert [c["fileIndex"] for c in cands] == [1, 2, 0]
    assert [c["rank"] for c in cands] == [1, 2, 3]
    assert cands[0]["initials"] == "O.A.H."
    assert cands[2]["initials"] == "J.D."
    assert cands[1]["fullName"] == "c_cv.docx" and cands[1]["initials"] == "C.C."  # no name: file name


def test_ties_keep_upload_order():
    reply = {"candidates": [row("C1", "A A", 80), row("C2", "B B", 80), row("C3", "C C", 80)], "narrative": "n"}
    _, cands = ranking.rank_candidates(fake_client(reply), "m", CVS)
    assert [c["fileIndex"] for c in cands] == [0, 1, 2]


def test_every_file_gets_a_row_and_score_is_clamped():
    reply = {"candidates": [row("C2", "B B", 250)], "narrative": "n"}
    _, cands = ranking.rank_candidates(fake_client(reply), "m", CVS)
    assert len(cands) == 3
    assert cands[0]["fileIndex"] == 1 and cands[0]["score"] == 100
    assert {c["score"] for c in cands[1:]} == {0}


def test_bad_json_keeps_markdown_and_no_candidates():
    md, cands = ranking.rank_candidates(fake_client("## Plain markdown"), "m", CVS)
    assert md == ranking.FALLBACK_NARRATIVE and cands == []


def test_call_is_deterministic_json_mode():
    client = fake_client({"candidates": [], "narrative": "n"})
    ranking.rank_candidates(client, "m", CVS)
    kw = client.chat.completions.create.call_args.kwargs
    assert kw["temperature"] == 0 and kw["response_format"] == {"type": "json_object"}


def test_read_files_in_memory_and_skips_unreadable(monkeypatch):
    real_open = open
    def no_write(file, mode="r", *a, **k):
        if any(m in mode for m in "wax+"):
            raise AssertionError("disk write")
        return real_open(file, mode, *a, **k)
    data = docx_bytes("Hello CV")
    monkeypatch.setattr("builtins.open", no_write)
    files = [SimpleNamespace(filename="a.docx", read=lambda: data),
             SimpleNamespace(filename="b.txt", read=lambda: b"x"),
             SimpleNamespace(filename="c.pdf", read=lambda: b"not a pdf")]
    assert ranking.read_files(files) == [(0, "a.docx", "Hello CV")]


@pytest.fixture
def versa_app(monkeypatch):
    import app as appmod
    from routes.auth import auth
    monkeypatch.setattr(auth, "verify_token_callback", lambda t: "u@x.com" if t == "t" else None)
    monkeypatch.setattr(appmod, "client", fake_client({"candidates": [row("C1", "Jane Doe", 80)], "narrative": "[C1] ok"}))
    return appmod


def post(appmod, **form):
    data = {"analyze-files": (io.BytesIO(docx_bytes("cv text")), "a.docx"), **form}
    return appmod.app.test_client().post("/api/compare/resumes/translate", data=data,
                                         headers={"Authorization": "Bearer t"}, content_type="multipart/form-data")


def test_translator_failure_still_returns_english(versa_app, monkeypatch):
    def boom(*a, **k):
        raise RuntimeError("down")
    monkeypatch.setattr(versa_app, "translate_many", boom)
    r = post(versa_app, languages="fr,de")
    assert r.status_code == 200
    body = r.get_json()
    assert body["choices"][0]["message"]["content"] == "[C1] ok"
    assert [t["error"] for t in body["translations"]] == ["failed", "failed"]
    assert body["candidates"][0]["rank"] == 1


def test_languages_default_and_backcompat(versa_app, monkeypatch):
    seen = {}
    def fake(text, langs):
        seen["langs"] = langs
        return [{"lang": l, "text": l + "!", "error": None} for l in langs]
    monkeypatch.setattr(versa_app, "translate_many", fake)
    msg = post(versa_app).get_json()["choices"][0]["message"]
    assert seen["langs"] == ["fr", "ar"] and msg["contentFr"] == "fr!" and msg["contentAr"] == "ar!"


def test_requires_login(versa_app):
    r = versa_app.app.test_client().post("/api/compare/resumes/translate", headers={"Authorization": "Bearer bad"})
    assert r.status_code == 401


def test_token_is_upload_order_not_rank_even_with_unreadable_gap():
    cvs = [(0, "a.docx", "cv a"), (2, "c.docx", "cv c")]  # file 1 was unreadable
    reply = {"candidates": [row("C1", "A A", 10), row("C3", "C C", 90)], "narrative": "n"}
    client = fake_client(reply)
    _, cands = ranking.rank_candidates(client, "m", cvs)
    prompt = client.chat.completions.create.call_args.kwargs["messages"][1]["content"]
    assert "Why this candidate was ranked here" in prompt and "#### Weaknesses" in prompt
    assert "[C1]\ncv a" in prompt and "[C3]\ncv c" in prompt and "[C2]" not in prompt.split("Resumes:")[1]
    assert [(c["fileIndex"], c["rank"]) for c in cands] == [(2, 1), (0, 2)]
