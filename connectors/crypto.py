"""Fernet encryption for stored refresh tokens.

Key hint: python -c "from cryptography.fernet import Fernet;print(Fernet.generate_key().decode())"
# shortcut: single key from CONNECTOR_ENC_KEY, no rotation; rotate by reconnecting every account.
"""
from cryptography.fernet import Fernet, InvalidToken

from . import config
from .errors import ConnectorError


def _fernet() -> Fernet:
    key = config.enc_key()
    if not key:
        raise ConnectorError(503, "not_configured", "Connectors are not configured")
    try:
        return Fernet(key.encode())
    except (ValueError, TypeError):
        raise ConnectorError(503, "not_configured", "Connector encryption key is invalid")


def encrypt(plain: str) -> str:
    return _fernet().encrypt(plain.encode("utf-8")).decode("ascii")


def decrypt(token: str) -> str:
    try:
        return _fernet().decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        raise ConnectorError(500, "crypto", "Stored credential unreadable")
