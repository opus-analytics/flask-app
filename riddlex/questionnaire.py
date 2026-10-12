"""RiddleX questionnaire generation (pure logic, no database access).

Python port of ``buildSkillQuestions`` / ``SKILL_CATALOG`` / ``skillId`` /
``buildQuestions`` / ``scoreSkills`` from
``OpusReact/src/store/apis/riddlexMockServer.ts``, plus an Azure OpenAI layer
(``generate_with_fallback``) that always falls back to the catalog builders.

Persistence of the generated questionnaire is wired elsewhere.
"""

import json
import logging
import math
import os
import re

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Catalog (copied verbatim from the TS mock: same order, same terms)
# ---------------------------------------------------------------------------

SKILL_CATALOG = [
    {"skill": "React", "category": "Technical", "terms": ["react"]},
    {"skill": "TypeScript", "category": "Technical", "terms": ["typescript"]},
    {"skill": "JavaScript", "category": "Technical", "terms": ["javascript"]},
    {"skill": "Next.js", "category": "Technical", "terms": ["next.js", "nextjs"]},
    {"skill": "Node.js", "category": "Technical", "terms": ["node.js", "nodejs", "node"]},
    {"skill": "GraphQL", "category": "Technical", "terms": ["graphql"]},
    {"skill": "Redux", "category": "Technical", "terms": ["redux"]},
    {"skill": "Tailwind CSS", "category": "Technical", "terms": ["tailwind"]},
    {"skill": "REST API integration", "category": "Technical", "terms": ["rest api", "api integration"]},
    {"skill": "Accessibility (WCAG)", "category": "Technical", "terms": ["accessibility", "accessible", "wcag"]},
    {"skill": "Performance optimisation", "category": "Technical", "terms": ["performance"]},
    {"skill": "Automated testing", "category": "Technical", "terms": ["cypress", "jest", "testing", "test automation"]},
    {"skill": "Python", "category": "Technical", "terms": ["python"]},
    {"skill": "SQL", "category": "Technical", "terms": ["sql"]},
    {"skill": "Flask", "category": "Technical", "terms": ["flask"]},
    {"skill": "Statistics", "category": "Technical", "terms": ["statistics", "statistical"]},
    {"skill": "Data visualisation & dashboards", "category": "Technical", "terms": ["dashboard", "visualisation", "visualization"]},
    {"skill": "KPI design", "category": "Technical", "terms": ["kpi"]},
    {"skill": "Candidate sourcing", "category": "Technical", "terms": ["sourcing"]},
    {"skill": "Candidate screening", "category": "Technical", "terms": ["screening"]},
    {"skill": "Power BI", "category": "Tools", "terms": ["power bi"]},
    {"skill": "Excel", "category": "Tools", "terms": ["excel"]},
    {"skill": "Azure", "category": "Tools", "terms": ["azure"]},
    {"skill": "Git", "category": "Tools", "terms": ["git", "github"]},
    {"skill": "Figma", "category": "Tools", "terms": ["figma", "design handoff"]},
    {"skill": "LinkedIn Recruiter", "category": "Tools", "terms": ["linkedin"]},
    {"skill": "Written & verbal communication", "category": "Professional", "terms": ["communication"]},
    {"skill": "Stakeholder management", "category": "Professional", "terms": ["stakeholder"]},
    {"skill": "Organisation & prioritisation", "category": "Professional", "terms": ["organisation", "organization", "prioriti"]},
    {"skill": "Cross-team collaboration", "category": "Professional", "terms": ["partner", "collaborat"]},
    {"skill": "End-to-end ownership", "category": "Professional", "terms": ["end to end", "end-to-end", "ownership"]},
]

# Used to top the questionnaire up when the job text names few recognisable skills.
FALLBACK_SKILLS = [
    "Problem solving",
    "Written & verbal communication",
    "Cross-team collaboration",
    "Learning new tools quickly",
]

MIN_SKILLS = 4
MAX_SKILLS = 8
CATEGORY_ORDER = ["Technical", "Tools", "Professional"]
SCREENING_MIN_CHARS = [20, 20, 2]
SCREENING_COUNT = 3
# AI output is candidate-visible and derived from recruiter text: bound it.
MAX_SKILL_CHARS = 80
MAX_QUESTION_CHARS = 500


def _mentions(text, terms):
    """Word-start, case-insensitive match (JS ``\\b`` is ASCII-only, so re.ASCII)."""
    return any(
        re.search(r"\b" + re.escape(t), text, re.IGNORECASE | re.ASCII) for t in terms
    )


def skill_id(skill):
    slug = re.sub(r"[^a-z0-9]+", "_", skill.lower())
    slug = re.sub(r"(^_|_\Z)", "", slug)
    return "skill_" + slug


def _js_round(x):
    """JS Math.round: halves round toward +infinity."""
    return int(math.floor(x + 0.5))


def _utf16_len(text):
    return len(text.encode("utf-16-le", errors="surrogatepass")) // 2


def _js_slice_utf16(text, end):
    """JS ``String.prototype.slice(0, end)`` counts UTF-16 code units."""
    units = text.encode("utf-16-le", errors="surrogatepass")
    if len(units) // 2 <= end:
        return text
    # A cut inside a surrogate pair leaves a lone surrogate in JS; keep it too.
    return units[: end * 2].decode("utf-16-le", errors="surrogatepass")


def _s(job, key):
    value = job.get(key)
    return "" if value is None else str(value)


# ---------------------------------------------------------------------------
# Catalog builders / scoring
# ---------------------------------------------------------------------------

def build_skill_catalog_questions(job):
    requirements = _s(job, "requirements")
    all_text = f"{_s(job, 'title')} {_s(job, 'description')} {requirements}"
    picked = [
        {
            "id": skill_id(c["skill"]),
            "skill": c["skill"],
            "category": c["category"],
            "required": _mentions(requirements, c["terms"]),
        }
        for c in SKILL_CATALOG
        if _mentions(all_text, c["terms"])
    ]
    # sorted()/list.sort() is stable, like Array.prototype.sort in modern JS engines.
    picked.sort(key=lambda q: (not q["required"], CATEGORY_ORDER.index(q["category"])))
    selected = picked[:MAX_SKILLS]

    for skill in FALLBACK_SKILLS:
        if len(selected) >= MIN_SKILLS:
            break
        if not any(q["skill"] == skill for q in selected):
            selected.append(
                {"id": skill_id(skill), "skill": skill, "category": "Professional", "required": False}
            )
    return selected


def score_skills(ratings):
    def weight(r):
        return 2 if r.get("required") else 1

    total = sum(weight(r) for r in ratings)
    if not total:
        return 0
    earned = 0
    for r in ratings:
        earned += weight(r) * (r["proficiency"] / 5)
    return _js_round((earned / total) * 100)


def _screening_texts(job, lang):
    title = _s(job, "title")
    job_requirements = _s(job, "requirements")
    skills = [
        c["skill"]
        for c in SKILL_CATALOG
        if c["category"] != "Professional"
        and _mentions(f"{title} {job_requirements}", c["terms"])
    ]
    ellipsis = "…" if _utf16_len(job_requirements) > 120 else ""
    requirements = f"{_js_slice_utf16(job_requirements, 120)}{ellipsis}"
    location = _s(job, "location") or "on-site"
    job_type = _s(job, "jobType")

    if lang == "ar":
        primary = skills[0] if skills else "المهارات الأساسية المطلوبة لهذا الدور"
        secondary = " و".join(skills[1:3])
        with_ = f" مع {secondary}" if secondary else ""
        return [
            f"صف مشروعاً حديثاً استخدمت فيه {primary}{with_}. ما كان دورك وما النتيجة؟",
            f'يتطلب دور {title}: "{requirements}". ما أقوى مجالاتك من بينها، وأين ستحتاج إلى دعم؟',
            f"هذه وظيفة ({job_type}) في {location}. متى يمكنك البدء، وهل يناسبك نظام العمل هذا؟",
        ]
    if lang == "fr":
        primary = skills[0] if skills else "les compétences clés de ce poste"
        secondary = " et ".join(skills[1:3])
        with_ = f" avec {secondary}" if secondary else ""
        return [
            f"Décrivez un projet récent où vous avez utilisé {primary}{with_}. Quel était votre rôle et quel a été le résultat ?",
            f"Le poste de {title} demande : « {requirements} ». Quel est votre point fort parmi ces éléments, et où auriez-vous besoin de soutien ?",
            f"Il s'agit d'un poste ({job_type}) basé à {location}. Quand pouvez-vous commencer, et ce mode de travail vous convient-il ?",
        ]

    primary = skills[0] if skills else "the core skills listed for this role"
    secondary = " and ".join(skills[1:3])
    together = f" together with {secondary}" if secondary else ""
    return [
        f"Describe a recent project where you used {primary}{together}. What was your role and what was the outcome?",
        f'The {title} role asks for: "{requirements}". Which of these is your strongest area, and where would you need support?',
        f"This is a {job_type.lower()} position ({location}). What is your availability to start, and does this work setup suit you?",
    ]


def _screening_payload(texts):
    return [
        {"question": q, "minChars": SCREENING_MIN_CHARS[i] if i < len(SCREENING_MIN_CHARS) else 2}
        for i, q in enumerate(texts)
    ]


def build_screening_questions(job, lang="en"):
    return _screening_payload(_screening_texts(job, lang))


# ---------------------------------------------------------------------------
# Azure OpenAI layer
# ---------------------------------------------------------------------------

SKILLS_PROMPT = (
    "You design a skills self-assessment questionnaire for job candidates.\n"
    "Return STRICTLY a JSON object of the form "
    '{{"skills":[{{"skill":"<short skill name>","category":"Technical|Tools|Professional",'
    '"required":true|false}}]}}.\n'
    "Rules: between 4 and 8 skills; category must be exactly one of Technical, Tools, "
    "Professional; required is true only for skills explicitly demanded in the requirements; "
    "list required skills first. No commentary.\n\n"
    "Job title: {title}\nDescription: {description}\nRequirements: {requirements}\n"
)

SCREENING_PROMPT = (
    "You write screening questions for job candidates.\n"
    'Return STRICTLY a JSON object of the form {{"questions":["q1","q2","q3"]}} with exactly '
    "3 non-empty questions written in language code '{lang}':\n"
    "1) a recent project using the key skills, 2) strongest area vs. areas needing support "
    "against the requirements, 3) availability to start and suitability of the work setup. "
    "No commentary.\n\n"
    "Job title: {title}\nRequirements: {requirements}\nLocation: {location}\nJob type: {job_type}\n"
)

_ENV_VARS = ("AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_KEY", "AZURE_OPENAI_DEPLOYMENT")
_API_VERSION = "2024-02-15-preview"


class AIUnavailable(RuntimeError):
    """Azure OpenAI is not configured; the catalog is used instead."""


def _build_prompt(job, kind, lang):
    if kind == "skills":
        return SKILLS_PROMPT.format(
            title=_s(job, "title"),
            description=_s(job, "description"),
            requirements=_s(job, "requirements"),
        )
    return SCREENING_PROMPT.format(
        lang=lang,
        title=_s(job, "title"),
        requirements=_s(job, "requirements"),
        location=_s(job, "location") or "on-site",
        job_type=_s(job, "jobType"),
    )


def _call_openai(prompt, *, timeout=8, client=None):
    """Call Azure OpenAI in JSON mode and return the parsed JSON response.

    Raises AIUnavailable when any of the AZURE_OPENAI_* env vars is unset.
    """
    env = {name: os.environ.get(name) for name in _ENV_VARS}
    if not all(env.values()):
        raise AIUnavailable("Azure OpenAI is not configured")
    if client is None:
        from openai import AzureOpenAI

        client = AzureOpenAI(
            azure_endpoint=env["AZURE_OPENAI_ENDPOINT"],
            api_key=env["AZURE_OPENAI_KEY"],
            api_version=_API_VERSION,
            timeout=timeout,
            max_retries=0,
        )
    response = client.chat.completions.create(
        model=env["AZURE_OPENAI_DEPLOYMENT"],
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.2,
        timeout=timeout,
    )
    return json.loads(response.choices[0].message.content)


def _validate_skills(data):
    items = data.get("skills") if isinstance(data, dict) else data
    if not isinstance(items, list) or not (MIN_SKILLS <= len(items) <= MAX_SKILLS):
        return None
    out, seen = [], set()
    for item in items:
        if not isinstance(item, dict):
            return None
        skill = item.get("skill")
        category = item.get("category")
        required = item.get("required")
        if not isinstance(skill, str) or not skill.strip() or len(skill.strip()) > MAX_SKILL_CHARS:
            return None
        if category not in CATEGORY_ORDER or not isinstance(required, bool):
            return None
        skill = skill.strip()
        sid = skill_id(skill)
        if sid == "skill_" or sid in seen:
            return None
        seen.add(sid)
        out.append({"id": sid, "skill": skill, "category": category, "required": required})
    out.sort(key=lambda q: (not q["required"], CATEGORY_ORDER.index(q["category"])))  # same order as catalog
    return out


def _validate_screening(data):
    items = data.get("questions") if isinstance(data, dict) else data
    if not isinstance(items, list) or len(items) != SCREENING_COUNT:
        return None
    if not all(isinstance(q, str) and q.strip() and len(q.strip()) <= MAX_QUESTION_CHARS for q in items):
        return None
    return _screening_payload([q.strip() for q in items])


def generate_with_fallback(job, kind, lang="en", *, client=None):
    """Return ``(payload, source)`` where source is ``"ai"`` or ``"catalog"``.

    Any AI failure (unconfigured, timeout, bad JSON, invalid shape) falls back
    to the deterministic catalog builders. Job text and keys are never logged.
    """
    if kind not in ("skills", "screening"):
        raise ValueError("kind must be 'skills' or 'screening'")
    try:
        prompt = _build_prompt(job, kind, lang)
        kwargs = {} if client is None else {"client": client}
        data = _call_openai(prompt, **kwargs)
        if isinstance(data, (str, bytes)):
            data = json.loads(data)
        payload = _validate_skills(data) if kind == "skills" else _validate_screening(data)
        if payload is not None:
            return payload, "ai"
        logger.warning("riddlex: AI %s output failed validation; using catalog", kind)
    except AIUnavailable:
        pass
    except Exception as exc:  # noqa: BLE001 - any failure must fall back
        logger.warning(
            "riddlex: AI %s generation failed (%s); using catalog", kind, type(exc).__name__
        )

    if kind == "skills":
        return build_skill_catalog_questions(job), "catalog"
    return build_screening_questions(job, lang), "catalog"
