"""Environment readers for the connectors. Every function reads os.environ at call time, never at import."""
import os

from cryptography.fernet import Fernet


def _env(name: str) -> str:
    return (os.environ.get(name) or "").strip()


def google_cfg() -> dict:
    return {"client_id": _env("GOOGLE_CLIENT_ID"), "client_secret": _env("GOOGLE_CLIENT_SECRET"),
            "api_key": _env("GOOGLE_API_KEY"), "app_id": _env("GOOGLE_APP_ID")}


def ms_cfg() -> dict:
    return {"client_id": _env("MS_CLIENT_ID"), "client_secret": _env("MS_CLIENT_SECRET")}


def enc_key() -> str:
    return _env("CONNECTOR_ENC_KEY")


def public_api_base() -> str:
    return _env("PUBLIC_API_BASE").rstrip("/")


def frontend_origins() -> list:
    out = []
    for item in _env("FRONTEND_ORIGIN").split(","):
        origin = item.strip().rstrip("/")
        if origin:
            out.append(origin)
    return out


def redirect_uri(provider_id: str) -> str:
    return public_api_base() + "/api/connectors/" + provider_id + "/callback"


def common_configured() -> bool:
    """Settings every provider needs: a valid Fernet key, the public API base and one frontend origin."""
    if not public_api_base() or not frontend_origins():
        return False
    try:
        Fernet(enc_key().encode())
    except (ValueError, TypeError):
        return False
    return True


def provider_ready(provider_id: str) -> bool:
    """True when common settings and the provider's own settings are present."""
    from .providers.base import PROVIDERS  # lazy: avoids a package import cycle
    provider = PROVIDERS.get(provider_id)
    return common_configured() and provider is not None and provider.is_configured()
