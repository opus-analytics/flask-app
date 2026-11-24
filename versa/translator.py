"""Azure Translator wrapper for Versa. No Flask, no OpenAI, never logs text."""
import os
import re
import time

import requests

SUPPORTED_CACHE = {"at": 0.0, "data": None}  # Microsoft's language list, cached 24h
SUPPORTED_TTL = 24 * 3600
MAX_LANGS = 10
CODE_RE = re.compile(r"^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,4})?$")
TOKEN_RE = re.compile(r"\[C\d+\]")


def _endpoint():
    return os.environ.get("AZURE_TRANSLATOR_ENDPOINT") or "https://api.cognitive.microsofttranslator.com"


def supported_languages():
    """Returns {code: {name, nativeName, dir}}, or {} if the list cannot be fetched."""
    if SUPPORTED_CACHE["data"] is not None and time.time() - SUPPORTED_CACHE["at"] < SUPPORTED_TTL:
        return SUPPORTED_CACHE["data"]
    try:
        resp = requests.get(f"{_endpoint()}/languages",
                            params={"api-version": "3.0", "scope": "translation"}, timeout=15)
        resp.raise_for_status()
        data = resp.json().get("translation", {})
    except Exception:
        return {}
    SUPPORTED_CACHE.update(at=time.time(), data=data)
    return data


def _clean(langs):
    """Drops blanks, "en" and duplicates (case-insensitive), keeps order."""
    seen, out = set(), []
    for raw in langs:
        code = str(raw).strip()
        low = code.lower()
        if not code or low == "en" or low in seen:
            continue
        seen.add(low)
        out.append(code)
    return out


def _wrap(match):
    tok = match.group(0)
    return f'<mstrans:dictionary translation="{tok}">{tok}</mstrans:dictionary>'


def _call(text, codes, key):
    """One HTTP call. Returns {code: (text, error)}; raises on any transport or parse failure."""
    headers = {"Ocp-Apim-Subscription-Key": key, "Content-Type": "application/json"}
    region = os.environ.get("AZURE_TRANSLATOR_REGION", "").strip()
    if region:
        headers["Ocp-Apim-Subscription-Region"] = region
    resp = requests.post(f"{_endpoint()}/translate",
                         params=[("api-version", "3.0")] + [("to", c) for c in codes],
                         headers=headers, json=[{"Text": TOKEN_RE.sub(_wrap, text)}], timeout=15)
    resp.raise_for_status()
    got = {t.get("to", "").lower(): t.get("text") for t in resp.json()[0].get("translations", [])}
    return {c: (got[c.lower()], None) if c.lower() in got else (None, "failed") for c in codes}


def translate_many(text, langs):
    """Never raises. One item per requested language, in requested order; English is not included."""
    codes, out = [], {}
    try:
        codes = _clean(langs)
        key = os.environ.get("AZURE_TRANSLATOR_KEY", "").strip()
        if not key:
            out = {c: (None, "not_configured") for c in codes}
        else:
            sup = {k.lower() for k in supported_languages()}
            ok = [c for c in codes if CODE_RE.match(c) and (not sup or c.lower() in sup)][:MAX_LANGS]
            out = {c: (None, "unsupported") for c in codes if c not in ok}
            if ok:
                out.update(_call(text, ok, key))
    except Exception:
        pass
    for c in codes:
        out.setdefault(c, (None, "failed"))
    return [{"lang": c, "text": out[c][0], "error": out[c][1]} for c in codes]
