"""Signed OAuth state and PKCE helpers.

# shortcut: state is single-use only by its 10-minute expiry, there is no replay store.
"""
import base64
import hashlib
import hmac
import secrets

from flask import current_app
from itsdangerous import BadData, URLSafeTimedSerializer

from .errors import ConnectorError

SALT = "opus-connectors-state-v1"
MAX_AGE = 600


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt=SALT)


def make_state(email, provider, origin):
    """-> (token, nonce). The nonce feeds the PKCE verifier."""
    nonce = secrets.token_urlsafe(16)
    token = _serializer().dumps({"e": email, "p": provider, "n": nonce, "o": origin})
    return token, nonce


def read_state(token, expected_provider) -> dict:
    try:
        payload = _serializer().loads(token, max_age=MAX_AGE)
    except BadData:  # covers SignatureExpired, BadSignature and BadPayload
        raise ConnectorError(400, "bad_state", "Invalid or expired state")
    if not isinstance(payload, dict) or payload.get("p") != expected_provider:
        raise ConnectorError(400, "bad_state", "Invalid or expired state")
    return payload


def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def pkce_verifier(nonce: str) -> str:
    key = current_app.config["SECRET_KEY"]
    if isinstance(key, str):
        key = key.encode("utf-8")
    return _b64url(hmac.new(key, ("pkce:" + nonce).encode("utf-8"), hashlib.sha256).digest())


def pkce_challenge(verifier: str) -> str:
    return _b64url(hashlib.sha256(verifier.encode("ascii")).digest())
