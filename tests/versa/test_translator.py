import pytest
import requests

from versa import translator


class FakeResp:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self.payload


def translations(*pairs):
    return FakeResp([{"translations": [{"to": to, "text": f"{to}:{txt}"} for to, txt in pairs]}])


@pytest.fixture(autouse=True)
def reset(monkeypatch):
    translator.SUPPORTED_CACHE.update(at=0.0, data=None)
    monkeypatch.delenv("AZURE_TRANSLATOR_KEY", raising=False)
    monkeypatch.setattr(translator.requests, "get", lambda *a, **k: FakeResp(
        {"translation": {"fr": {}, "ar": {}, "de": {}, "zh-Hans": {}}}))


@pytest.fixture
def key(monkeypatch):
    monkeypatch.setenv("AZURE_TRANSLATOR_KEY", "test-key")


def test_no_key_is_not_configured(monkeypatch):
    calls = []
    monkeypatch.setattr(translator.requests, "post", lambda *a, **k: calls.append(1))
    out = translator.translate_many("hello", ["fr", "ar"])
    assert out == [{"lang": "fr", "text": None, "error": "not_configured"},
                   {"lang": "ar", "text": None, "error": "not_configured"}]
    assert calls == []


def test_multi_language_success_keeps_requested_order(monkeypatch, key):
    monkeypatch.setattr(translator.requests, "post",
                        lambda *a, **k: translations(("ar", "A"), ("de", "D"), ("fr", "F")))
    out = translator.translate_many("hello", ["de", "fr", "ar"])
    assert [i["lang"] for i in out] == ["de", "fr", "ar"]
    assert [i["text"] for i in out] == ["de:D", "fr:F", "ar:A"]
    assert all(i["error"] is None for i in out)


def test_missing_language_fails_only_that_one(monkeypatch, key):
    monkeypatch.setattr(translator.requests, "post",
                        lambda *a, **k: translations(("fr", "F"), ("de", "D")))
    out = translator.translate_many("hello", ["fr", "ar", "de"])
    assert out[0] == {"lang": "fr", "text": "fr:F", "error": None}
    assert out[1] == {"lang": "ar", "text": None, "error": "failed"}
    assert out[2] == {"lang": "de", "text": "de:D", "error": None}


def test_whole_call_raises_all_failed(monkeypatch, key):
    def boom(*a, **k):
        raise requests.ConnectionError("down")
    monkeypatch.setattr(translator.requests, "post", boom)
    out = translator.translate_many("hello", ["fr", "de"])
    assert [i["error"] for i in out] == ["failed", "failed"]


def test_invalid_codes_are_unsupported(monkeypatch, key):
    sent = {}

    def fake_post(*a, **k):
        sent["params"] = k["params"]
        return translations(("fr", "F"))
    monkeypatch.setattr(translator.requests, "post", fake_post)
    out = translator.translate_many("hello", ["fr", "x", "fr!", "zz"])
    assert out[0] == {"lang": "fr", "text": "fr:F", "error": None}
    assert [i["error"] for i in out[1:]] == ["unsupported", "unsupported", "unsupported"]
    assert sent["params"] == [("api-version", "3.0"), ("to", "fr")]


def test_en_and_duplicates_are_dropped(monkeypatch, key):
    sent = {}

    def fake_post(*a, **k):
        sent["params"] = k["params"]
        return translations(("fr", "F"))
    monkeypatch.setattr(translator.requests, "post", fake_post)
    out = translator.translate_many("hello", ["en", "fr", "FR", "fr"])
    assert out == [{"lang": "fr", "text": "fr:F", "error": None}]
    assert sent["params"] == [("api-version", "3.0"), ("to", "fr")]


def test_custom_tokens_are_wrapped_in_request(monkeypatch, key):
    sent = {}

    def fake_post(*a, **k):
        sent["json"] = k["json"]
        return translations(("fr", "F"))
    monkeypatch.setattr(translator.requests, "post", fake_post)
    translator.translate_many("Candidate [C1] beats [C12].", ["fr"])
    text = sent["json"][0]["Text"]
    assert '<mstrans:dictionary translation="[C1]">[C1]</mstrans:dictionary>' in text
    assert '<mstrans:dictionary translation="[C12]">[C12]</mstrans:dictionary>' in text
