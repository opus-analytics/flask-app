import pytest
from cryptography.fernet import Fernet

from connectors import crypto
from connectors.errors import ConnectorError


def test_round_trip_and_ciphertext_differs(env):
    token = crypto.encrypt("refresh-plain-123")
    assert token != "refresh-plain-123"
    assert "refresh-plain-123" not in token
    assert crypto.decrypt(token) == "refresh-plain-123"


def test_wrong_key_raises_connector_error(env, monkeypatch):
    token = crypto.encrypt("secret-value")
    monkeypatch.setenv("CONNECTOR_ENC_KEY", Fernet.generate_key().decode())
    with pytest.raises(ConnectorError) as exc:
        crypto.decrypt(token)
    assert exc.value.status == 500 and exc.value.code == "crypto"


def test_no_key_is_clear_error(no_env):
    with pytest.raises(ConnectorError) as exc:
        crypto.encrypt("x")
    assert exc.value.status == 503 and exc.value.code == "not_configured"


def test_invalid_key_is_clear_error(monkeypatch):
    monkeypatch.setenv("CONNECTOR_ENC_KEY", "not-a-fernet-key")
    with pytest.raises(ConnectorError) as exc:
        crypto.decrypt("anything")
    assert exc.value.code == "not_configured"
