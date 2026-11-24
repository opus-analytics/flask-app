"""Versa CV ranking: in-memory parsing, one JSON-mode call, server-side validation, sorting and initials.

Nothing here touches disk and nothing logs CV text or candidate names. Candidates are [C<n>] in the
narrative, with n = fileIndex + 1; the real name is only in candidates[].fullName.
"""
import json
import re
from io import BytesIO

import fitz  # PyMuPDF
from docx import Document

FALLBACK_NARRATIVE = "The ranking could not be produced this time. Please try again."
MAX_CV_CHARS = 12000  # shortcut: hard cut per CV, upgrade to per-CV scoring if batches overflow the context

SYSTEM = (
    "You are a Human Resources AI that scores and ranks candidates. Use only the information in the "
    "resumes and the job description. Reply with one JSON object and nothing else."
)

RUBRIC = """Score every candidate from 0 to 100 with this fixed rubric:
- 40 points: required skills and must-haves from the job description
- 30 points: relevant experience (years, seniority, domain)
- 15 points: education and certifications
- 15 points: achievements and evidence of impact
Same input must give the same scores. Do not skip anyone."""


def extract_text(filename, data):
    """Plain text of a pdf/docx held in memory; '' if unreadable or another type."""
    name = (filename or "").lower()
    try:
        if name.endswith(".docx"):
            text = "\n".join(p.text for p in Document(BytesIO(data)).paragraphs)
        elif name.endswith(".pdf"):
            with fitz.open(stream=data, filetype="pdf") as doc:
                text = "".join(page.get_text() for page in doc)
        else:
            return ""
    except Exception:
        return ""
    return re.sub(r"\s+", " ", text).strip()[:MAX_CV_CHARS]


def read_files(files):
    """files: werkzeug FileStorage list -> [(fileIndex, fileName, text)] for readable CVs only."""
    out = []
    for i, f in enumerate(files):
        if f and f.filename:
            text = extract_text(f.filename, f.read())
            if text:
                out.append((i, f.filename.replace("\\", "/").rsplit("/", 1)[-1], text))
    return out


def initials(full_name, file_name=""):
    words = re.findall(r"\w+", full_name or "") or re.findall(r"[^\W_]+", re.sub(r"\.\w+$", "", file_name))
    return "".join(w[0].upper() + "." for w in words[:3])


def _prompt(cvs, description, job_description):
    blocks = "\n\n".join(f"[C{i + 1}]\n{text}" for i, _, text in cvs)
    return f"""Role: {description}
Job description: {job_description}

{RUBRIC}

Return JSON with this shape:
{{"candidates": [{{"token": "C1", "fullName": "<name as written in the CV, or empty>", "score": <0-100 integer>,
"summary": "<one line, max 20 words>", "strengths": ["..."], "gaps": ["..."]}}],
"narrative": "<full English Markdown report, see the Narrative rules>"}}

Rules:
- One entry per candidate, all {len(cvs)} of them.
- In "summary", "strengths", "gaps" and "narrative" refer to people only as [C1], [C2]... never by name or initials.
- Narrative rules: write a full report, never a one-line answer. Use these Markdown sections in this order:
  ### Ranking Overview (all candidates strongest to weakest, one line each with the score)
  Then, for EACH candidate in rank order, a "### [Cn]" section containing:
  "#### Strengths" (bullets; technical, tied to the rubric: required skills, experience, education/certifications, achievements, each with concrete evidence from the CV),
  "#### Weaknesses" (bullets; gaps and risks versus the job description),
  "#### Why this candidate was ranked here" (4-6 lines explaining the selection rationale and the score against the job description),
  and finally "### Final Recommendation" (the best candidate and a justification based on the job description).
- Use a technical, explanatory tone. No conversational phrases. Use only the information in the resumes.

Resumes:
{blocks}"""


def _valid_score(value):
    try:
        return max(0, min(100, int(round(float(value)))))
    except (TypeError, ValueError):
        return 0


def _strs(value):
    return [str(s) for s in value][:8] if isinstance(value, list) else []


def rank_candidates(client, model, cvs, description="", job_description=""):
    """Returns (markdown, candidates). candidates is [] when the model reply is not usable JSON."""
    completion = client.chat.completions.create(
        model=model,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": _prompt(cvs, description, job_description)},
        ],
    )
    raw = completion.choices[0].message.content or ""
    try:
        data = json.loads(raw)
        rows = data["candidates"]
        if not isinstance(rows, list):
            raise ValueError
    except (ValueError, KeyError, TypeError):
        return FALLBACK_NARRATIVE, []  # raw output may hold real names, so never return it unmasked

    by_token = {}
    for row in rows:
        if isinstance(row, dict):
            by_token.setdefault(re.sub(r"\D", "", str(row.get("token", ""))), row)
    out = []
    for i, name, _ in cvs:
        row = by_token.get(str(i + 1), {})  # a CV the model skipped still gets a row, score 0
        full = str(row.get("fullName") or "").strip()
        out.append({
            "fileIndex": i, "fileName": name, "fullName": full or name, "initials": initials(full, name),
            "score": _valid_score(row.get("score")), "summary": str(row.get("summary") or ""),
            "strengths": _strs(row.get("strengths")), "gaps": _strs(row.get("gaps")),
        })
    out.sort(key=lambda c: -c["score"])  # stable: ties keep upload order
    for rank, c in enumerate(out, 1):
        c["rank"] = rank
    narrative = data.get("narrative")
    return (narrative if isinstance(narrative, str) and narrative else FALLBACK_NARRATIVE), out
