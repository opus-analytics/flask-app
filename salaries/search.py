"""Job search over (country, family, job) triples. Pure functions, no DB."""
import re

MAX_HITS = 25

_SYN_JUNIOR = {"junior", "jr", "i"}
_SYN_SENIOR = {"senior", "sr", "iii"}
_SYNONYMS = {
    "junior": _SYN_JUNIOR, "jr": _SYN_JUNIOR, "entry": _SYN_JUNIOR,
    "senior": _SYN_SENIOR, "sr": _SYN_SENIOR,
    "mid": {"mid", "ii"},
}
# Synonym pair matched as substrings (like non-seniority tokens): either word satisfies either token.
_SUBSTRING_SYNONYMS = {"engineer": ("engineer", "developer"), "developer": ("engineer", "developer")}
_SENIORITY_TOKENS = {"junior", "jr", "entry", "senior", "sr", "mid"}

_PHRASE_FIXES = [
    (re.compile(r"\bfront[ -]end\b"), "frontend"),
    (re.compile(r"\bback[ -]end\b"), "backend"),
    (re.compile(r"\bfull[ -]stack\b"), "fullstack"),
]
_NON_ALNUM = re.compile(r"[^a-z0-9]+")


def normalize(text):
    s = _NON_ALNUM.sub(" ", (text or "").lower())
    s = " ".join(s.split())
    for pattern, replacement in _PHRASE_FIXES:
        s = pattern.sub(replacement, s)
    return s


def _token_matches(token, job_norm, job_words):
    if token in _SYNONYMS:
        return any(word in job_words for word in _SYNONYMS[token])  # whole-word match
    if token in _SUBSTRING_SYNONYMS:
        return any(word in job_norm for word in _SUBSTRING_SYNONYMS[token])
    return token in job_norm  # substring match


def search_jobs(q, triples):
    """Distinct triples matching the query. Tier 1: ALL tokens match (exact title, fewer extra words, alpha).
    Tier 2 (only to fill up to 25): at least one non-seniority token matches, most tokens matched first. Max 25."""
    q_norm = normalize(q)
    tokens = q_norm.split()
    if not tokens:
        return []

    seen = set()
    tier1, tier2 = [], []
    for country, family, job in triples:
        country_s = (country or "").strip()
        family_s = (family or "").strip()
        job_s = (job or "").strip()
        if not job_s or (country_s, family_s, job_s) in seen:
            continue
        job_norm = normalize(job_s)
        if not job_norm:
            continue
        seen.add((country_s, family_s, job_s))
        job_words = set(job_norm.split())
        matched = [t for t in tokens if _token_matches(t, job_norm, job_words)]
        hit = {"country": country_s, "family": family_s, "job": job_s}
        tail = (len(job_norm.split()) - len(tokens),
                job_s.lower(), family_s.lower(), country_s.lower())
        if len(matched) == len(tokens):
            tier1.append(((0 if job_norm == q_norm else 1,) + tail, hit))
        else:
            # Job-word matches outrank seniority matches, so "Frontend Developer" beats "Developer I".
            core = sum(1 for t in matched if t not in _SENIORITY_TOKENS)
            if core:
                tier2.append(((-core, -len(matched)) + tail, hit))

    tier1.sort(key=lambda h: h[0])
    hits = [hit for _, hit in tier1[:MAX_HITS]]
    if len(hits) < MAX_HITS:
        tier2.sort(key=lambda h: h[0])
        hits += [hit for _, hit in tier2[:MAX_HITS - len(hits)]]
    return hits
