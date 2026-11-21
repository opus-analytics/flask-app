"""Connector routes: list, start, popup callback, disconnect. Email always comes from the JWT or the signed state."""
import json
import logging

from flask import Response, jsonify, request

from riddlex.limits import limiter
from routes.auth import auth

from . import config, connectors_bp, crypto, repo
from .errors import ConnectorError
from .providers.base import PROVIDERS, ProviderError
from .state import make_state, pkce_challenge, pkce_verifier, read_state
from .tokens import require_enabled

log = logging.getLogger("connectors")

PROVIDER_IDS = ("google", "onedrive")
NAMES = {"google": "Google Drive", "onedrive": "OneDrive"}
NO_REFRESH_HINTS = ("refresh token", "offline_access")

_POPUP = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
          '<meta name="viewport" content="width=device-width, initial-scale=1">'
          "<title>Opus connector</title></head><body><p>You can close this window.</p>"
          "<script>(function(){var msg=__MSG__;try{if(window.opener){window.opener.postMessage(msg,__ORIGIN__)}}"
          "catch(e){}window.close()})()</script></body></html>")


def _provider_id(value):
    if value not in PROVIDER_IDS:
        raise ConnectorError(404, "unknown_provider", "Unknown connector")
    return value


def _pick_origin(value):
    allowed = config.frontend_origins()
    if isinstance(value, str) and value.strip().rstrip("/") in allowed:
        return value.strip().rstrip("/")
    return allowed[0]


def _js(value):
    return json.dumps(value).replace("</", "<\\/")


def _popup(provider_id, origin, ok, error):
    """Callback page: posts the result to the opener (one concrete origin, never "*") and closes itself."""
    msg = _js({"type": "opus-connector", "provider": provider_id, "ok": ok, "error": error})
    html = _POPUP.replace("__MSG__", msg).replace("__ORIGIN__", _js(origin))
    resp = Response(html, mimetype="text/html")
    resp.headers["Cache-Control"] = "no-store"
    resp.headers["Referrer-Policy"] = "no-referrer"
    resp.headers["Content-Security-Policy"] = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'"
    return resp


def _is_no_refresh(message):
    text = (message or "").lower()
    return any(hint in text for hint in NO_REFRESH_HINTS)


@connectors_bp.route("", methods=["GET"], strict_slashes=False)
@limiter.limit("60/minute")
@auth.login_required
def list_connectors():
    email = auth.current_user()
    enabled = None  # looked up once, and only when a provider is configured
    out = []
    for pid in PROVIDER_IDS:
        item = {"id": pid, "name": NAMES[pid], "status": "disabled", "accountLabel": None,
                "reason": "not configured"}
        if config.provider_ready(pid):
            if enabled is None:
                enabled = repo.connectors_enabled(email)
            if not enabled:
                item["reason"] = "not enabled"
            else:
                acct = repo.get_account(email, pid)
                state = acct["status"] if acct else None
                if state in ("active", "error"):
                    item.update(status="connected" if state == "active" else "error",
                                accountLabel=acct["account_label"], reason=None)
                else:
                    item.update(status="available", reason=None)
        out.append(item)
    return jsonify(out)


@connectors_bp.route("/<provider>/start", methods=["POST"])
@limiter.limit("10/minute")
@auth.login_required
def start(provider):
    pid = _provider_id(provider)
    email = auth.current_user()
    require_enabled(email)
    if not config.provider_ready(pid):
        raise ConnectorError(503, "not_configured", "Connector is not configured")
    prov = PROVIDERS[pid]
    body = request.get_json(silent=True)
    origin = _pick_origin(body.get("origin") if isinstance(body, dict) else None)
    token, nonce = make_state(email, pid, origin)
    challenge = pkce_challenge(pkce_verifier(nonce)) if prov.uses_pkce else None
    return jsonify({"authUrl": prov.auth_url(token, config.redirect_uri(pid), challenge)})


@connectors_bp.route("/<provider>/callback", methods=["GET"])
@limiter.limit("20/minute")
def callback(provider):
    origins = config.frontend_origins()
    if not origins:
        return Response("Connectors are not configured.", status=400, mimetype="text/plain")
    pid = provider if provider in PROVIDER_IDS else ""
    data = None
    if pid:
        try:
            data = read_state(request.args.get("state", ""), pid)
        except ConnectorError:
            data = None
    if data is None:
        return _popup(pid, origins[0], False, "bad_state")
    origin = data.get("o") if data.get("o") in origins else origins[0]
    if request.args.get("error"):
        return _popup(pid, origin, False, "access_denied")
    code = request.args.get("code", "")
    if not code:
        return _popup(pid, origin, False, "bad_request")
    if not config.provider_ready(pid):
        return _popup(pid, origin, False, "not_configured")
    if not repo.connectors_enabled(data["e"]):
        return _popup(pid, origin, False, "disabled")
    prov = PROVIDERS[pid]
    verifier = pkce_verifier(data["n"]) if prov.uses_pkce else None
    try:
        result = prov.exchange_code(code, config.redirect_uri(pid), verifier)
        if not result.refresh_token:
            raise ProviderError("bad_request", "No refresh token returned")
        repo.upsert_account(data["e"], pid, result.account_label,
                            crypto.encrypt(result.refresh_token), result.scopes)
    except ProviderError as err:
        log.warning("connector callback failed provider=%s code=%s", pid, err.code)
        error = "no_refresh_token" if _is_no_refresh(err.message) else "exchange_failed"
        return _popup(pid, origin, False, error)
    except Exception as err:  # the popup must always render, so no provider or DB detail leaks out
        log.warning("connector callback failed provider=%s error=%s", pid, type(err).__name__)
        return _popup(pid, origin, False, "exchange_failed")
    return _popup(pid, origin, True, None)


def _revoke_quietly(provider_id, acct):
    try:
        prov = PROVIDERS.get(provider_id)
        if prov is not None:
            prov.revoke(crypto.decrypt(acct["refresh_token_enc"]))
    except Exception as err:
        log.info("connector revoke skipped provider=%s error=%s", provider_id, type(err).__name__)


@connectors_bp.route("/<provider>", methods=["DELETE"])
@limiter.limit("60/minute")
@auth.login_required
def disconnect(provider):
    pid = _provider_id(provider)
    email = auth.current_user()
    acct = repo.get_account(email, pid)
    if acct is not None:
        _revoke_quietly(pid, acct)
        repo.delete_account(email, pid)
    return jsonify({"ok": True})
