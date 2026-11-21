"""Turns a stored refresh token into a short-lived access token. Enforces plan flag and account status."""
import logging

from . import config, crypto, repo
from .errors import ConnectorError
from .providers.base import PROVIDERS, ProviderError

log = logging.getLogger("connectors")


def require_enabled(email):
    if not repo.connectors_enabled(email):
        raise ConnectorError(403, "disabled", "Connectors are not enabled for your plan")


def get_access_result(email, provider_id):
    """-> (provider, AccessResult). Persists a rotated refresh token and marks the account 'error' on reconnect."""
    require_enabled(email)
    if not config.provider_ready(provider_id):
        raise ConnectorError(503, "not_configured", "Connector is not configured")
    provider = PROVIDERS[provider_id]
    acct = repo.get_account(email, provider_id)
    if acct is None or acct["status"] not in ("active", "error"):
        raise ConnectorError(404, "not_connected", "Connector is not connected")
    if acct["status"] == "error":
        raise ConnectorError(401, "reconnect", "Please reconnect this account")
    try:
        refresh_plain = crypto.decrypt(acct["refresh_token_enc"])
    except ConnectorError as err:
        if err.code == "crypto":
            repo.set_status(email, provider_id, "error")
        raise
    try:
        result = provider.refresh(refresh_plain)
    except ProviderError as err:
        if err.code != "reconnect":
            raise
        result = _retry_rotated(email, provider_id, provider, acct["refresh_token_enc"])
        if result is None:
            repo.set_status(email, provider_id, "error")
            log.warning("connector reconnect required provider=%s", provider_id)
            raise ConnectorError(401, "reconnect", "Please reconnect this account")
    if result.new_refresh_token:
        repo.update_refresh_token(email, provider_id, crypto.encrypt(result.new_refresh_token))
    return provider, result


def _retry_rotated(email, provider_id, provider, used_enc):
    """Another request may have rotated the token since we read it: retry once with the stored one. None if no retry."""
    fresh = repo.get_account(email, provider_id)
    if not fresh or fresh["refresh_token_enc"] == used_enc:
        return None
    try:
        return provider.refresh(crypto.decrypt(fresh["refresh_token_enc"]))
    except ProviderError as err:
        if err.code == "reconnect":
            return None
        raise


def get_access_token(email, provider_id):
    """-> (provider, access_token)."""
    provider, result = get_access_result(email, provider_id)
    return provider, result.access_token
