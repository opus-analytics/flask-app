import pytest

from connectors import state
from connectors.errors import ConnectorError


@pytest.fixture
def ctx(app):
    with app.app_context():
        yield


def _bad(fn, *args):
    with pytest.raises(ConnectorError) as exc:
        fn(*args)
    assert exc.value.code == "bad_state" and exc.value.status == 400


def test_round_trip(ctx):
    token, nonce = state.make_state("a@x.com", "google", "https://app.test")
    payload = state.read_state(token, "google")
    assert payload["e"] == "a@x.com" and payload["p"] == "google"
    assert payload["o"] == "https://app.test" and payload["n"] == nonce


def test_tampered_is_bad_state(ctx):
    token, _ = state.make_state("a@x.com", "google", "https://app.test")
    i = 5
    tampered = token[:i] + ("A" if token[i] != "A" else "B") + token[i + 1:]
    _bad(state.read_state, tampered, "google")


def test_expired_is_bad_state(ctx, monkeypatch):
    token, _ = state.make_state("a@x.com", "google", "https://app.test")
    monkeypatch.setattr(state, "MAX_AGE", -1)  # any age is now older than allowed
    _bad(state.read_state, token, "google")


def test_provider_mismatch_is_bad_state(ctx):
    token, _ = state.make_state("a@x.com", "google", "https://app.test")
    _bad(state.read_state, token, "onedrive")


def test_empty_state_is_bad_state(ctx):
    _bad(state.read_state, "", "google")


def test_pkce_verifier_deterministic_and_per_nonce(ctx):
    v1 = state.pkce_verifier("nonce-1")
    assert v1 == state.pkce_verifier("nonce-1")
    assert v1 != state.pkce_verifier("nonce-2")
    assert len(v1) == 43 and "=" not in v1


def test_pkce_challenge_matches_rfc7636_vector():
    verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    assert state.pkce_challenge(verifier) == "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
