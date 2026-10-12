# RiddleX Backend + Frontend Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the localStorage RiddleX mock server with a real Flask + MySQL backend (jobs, white-label career site, public apply flow, applications pipeline, dashboard) and cut the OpusReact frontend over to it with no page-level rewrites.

**Architecture:** One new Flask blueprint package `opus_api/blueprints/riddlex/` (routes → services → repositories), mounted at `/api/riddlex`. Tenancy is the **subscription owner** (a RiddleX subscription's `owner` is the org; assigned users share that org's data). Public candidate endpoints are token-gated and unauthenticated. The frontend keeps `riddlexApi.ts` (RTK Query) and its hook names; only the `baseQuery`/endpoint bodies change, so pages stay untouched.

**Tech Stack:** Flask, mysql-connector (existing `opus_api/db.py`), PyJWT (existing `HTTPTokenAuth`), Azure OpenAI (existing), Azure Blob Storage (new), flask-limiter (new), pytest (new), RTK Query (existing).

**Spec:** the existing mock is the spec — `OpusReact/src/store/apis/riddlexMockServer.ts` (types, validation, scoring, status codes) and `routes.riddlex` in `OpusReact/src/store/apis/routes.ts`. Behaviour of the mock must be preserved unless this plan says otherwise.

> **Note on "React Query":** the repo uses **RTK Query** (`@reduxjs/toolkit/query`), not TanStack React Query. This plan builds on RTK Query. Do not add TanStack Query.

## Execution decisions (2026-10-09, supersede paths below)

- **Layout:** the refactor is finished (Task 0) and RiddleX lives in a self-contained **top-level package `riddlex/`** at the flask-app root. Path mapping: `opus_api/blueprints/riddlex/*` → `riddlex/*`; `opus_api/repositories/riddlex_repo.py` → `riddlex/repo.py`; `opus_api/services/riddlex_questionnaire.py` → `riddlex/questionnaire.py`; `opus_api/services/blob_storage.py` → `riddlex/blob_storage.py`; `opus_api/migrations/riddlex/001_schema.sql` → `riddlex/migrations/001_schema.sql`. It imports shared pieces from `opus_api.*`.
- **Do not touch** the running dev setup: Vite on 5173, backend on 5000, the existing default API base URL, port forwarding. `VITE_API_BASE_URL` is an optional override only; with it unset behaviour must be identical to today.
- **Tests never touch the real database.** `tests/riddlex/conftest.py` must refuse to run unless the DB name ends in `_test` (env `RIDDLEX_TEST_DB_*`).
- **No git commits** during execution; leave changes in the working tree for the user to review.

## Global Constraints

- Endpoint prefix is `/api/riddlex`; route paths match `routes.riddlex` (`jobs`, `applications`, `career-site`, `public/jobs`, `public/questions`, `public/skills-questionnaire`, `public/apply`, `public/careers`).
- Error shape from backend: `{"message": "<human readable>"}` with the same HTTP statuses as the mock (400 validation, 403 bad token, 404 missing, 409 duplicate application, 410 closed job). Frontend `RiddleXApiError` stays `{status, message}`.
- JSON keys are **camelCase** and identical to the TS types in `riddlexMockServer.ts` (`publicToken`, `skillsMatch`, `applicantEmail`, …). Timestamps are ISO-8601 UTC strings. IDs are strings.
- `publicToken` is never returned by any public endpoint (`toPublicJob` strips it).
- No secrets in code, plan, commits or logs. Existing `config.py` and `app.py` contain plaintext credentials/keys — new code reads **only from environment variables**.
- New endpoints live in `opus_api/blueprints/riddlex/`; do not add more routes to `app.py`.
- `Werkzeug==2.2.2` stays pinned.
- Frontend: `npm run lint` must pass with `--max-warnings 0`; keep existing hook names exported from `riddlexApi.ts`.
- Existing endpoints must not change behaviour (guarded by `tests/baseline_routes.json`).

## Findings that shape the plan (verified in the repos)

1. **The backend working tree is mid-refactor.** Git has staged renames (`config.py → opus_api/config.py`, `database.py → opus_api/db.py`, `models/{users,subscriptions,assessment}.py → opus_api/models/`, `Resume_analysis.py → opus_api/services/resume_analysis.py`, …) but `app.py` and `routes/*.py` still import the old paths (`from config import Config`, `import database`, `from models.users import User`). As it stands the app cannot start. Task 0 resolves this before anything else.
2. `app.py` contains a hardcoded Azure OpenAI key (twice). Rotate it and move it to env (Task 0 notes it; do not copy it anywhere).
3. No tests exist in flask-app (only `tests/baseline_routes.json`, a route snapshot). pytest is introduced in Task 1 (CLAUDE.md says to ask before scaffolding tests — confirm in the Task 0 checkpoint).
4. The mock has **no org concept** and a single `careerSite`. Real backend needs tenancy → keyed on `Subscription.owner`.
5. The mock stores resumes as a **filename only** and logos as **data URLs** — real backend needs file storage for both.
6. The mock's "AI" is deterministic (catalog match). With a real LLM the questionnaire is non-deterministic, so it must be **generated once and persisted per job**; submission is validated against the persisted copy (the mock revalidates by rebuilding — that cannot work with an LLM).
7. The dashboard computes all stats client-side from the full applications list — fine for a mock, wrong at scale → server-side summary endpoint (Task 9).
8. `baseApi.ts` hardcodes `http://127.0.0.1:5000/api/` and its 401 handler logs the user out + redirects to sign-in. Public candidate pages must **not** use that base query.

## File Structure

**Backend (`flask-app/`)**

| File | Responsibility |
|---|---|
| `opus_api/migrations/riddlex/001_schema.sql` | All RiddleX tables |
| `opus_api/blueprints/riddlex/__init__.py` | `riddlex_bp`, imports route modules |
| `opus_api/blueprints/riddlex/auth.py` | `org_required` decorator → sets `g.org_email` from JWT + active RiddleX subscription |
| `opus_api/blueprints/riddlex/errors.py` | `ApiError(status, message)` + error handler |
| `opus_api/blueprints/riddlex/schemas.py` | Validation + constants (stages, job types, fonts, languages, regexes) ported from the mock |
| `opus_api/blueprints/riddlex/jobs_routes.py` | `/jobs` |
| `opus_api/blueprints/riddlex/career_site_routes.py` | `/career-site`, `/career-site/logo` |
| `opus_api/blueprints/riddlex/applications_routes.py` | `/applications`, `/dashboard` |
| `opus_api/blueprints/riddlex/public_routes.py` | `/public/*` (rate limited) |
| `opus_api/repositories/riddlex_repo.py` | All SQL (one function per query) |
| `opus_api/services/riddlex_questionnaire.py` | Catalog + Azure OpenAI generation, persistence, scoring |
| `opus_api/services/blob_storage.py` | Upload/download-URL for resumes and logos (Azure Blob; local-disk fallback in dev) |
| `tests/riddlex/` | pytest suite (`conftest.py`, one file per route module, `test_scoring.py`) |
| `app.py` | +3 lines: register `riddlex_bp`, limiter init |

**Frontend (`OpusReact/`)**

| File | Responsibility |
|---|---|
| `src/store/apis/baseApi.ts` | Read base URL from `VITE_API_BASE_URL`; export `publicBaseQuery` |
| `src/store/apis/riddlexApi.ts` | Real `query`/`mutation` endpoints, error mapping, optimistic stage updates, finer tags |
| `src/store/apis/riddlexMockServer.ts` | Types/constants stay; the `riddlexMockServer` object and DB are deleted at cutover |
| `scripts/riddlex-mock-smoke.ts` | Rewritten as `riddlex-api-smoke.ts` against the live API |

---

## Phase 0 — Baseline

### Task 0: Stabilise the backend baseline

**Files:**
- Modify: `app.py:30-48`, `routes/auth.py`, `routes/user.py`, `models/surveys.py`
- Test: `tests/test_baseline_routes.py`

**Interfaces:**
- Produces: a backend that boots with imports from `opus_api.*`, and a test that fails if any route in `tests/baseline_routes.json` disappears.

**Checkpoint (ask the user before this task):** is the `opus_api/` refactor yours and meant to land? If not, revert the staged renames (`git restore --staged --worktree .`) and place the RiddleX package under the old layout instead (`riddlex/` at repo root) — every later path in this plan then drops the `opus_api/` prefix. The rest of the plan is unchanged.

- [ ] **Step 1: Write the failing test**

```python
# tests/test_baseline_routes.py
import json
from pathlib import Path

def test_every_baseline_route_still_registered():
    from app import app
    baseline = json.loads(Path(__file__).with_name("baseline_routes.json").read_text())
    live = {(r.rule, tuple(sorted(r.methods - {"HEAD", "OPTIONS"}))) for r in app.url_map.iter_rules()}
    missing = [b for b in baseline if (b["rule"], tuple(sorted(set(b["methods"]) - {"HEAD", "OPTIONS"}))) not in live]
    assert missing == []
```

- [ ] **Step 2: Run it — expect FAIL (ImportError: `config`/`database`/`models`)**

Run: `pip install pytest && python -m pytest tests/test_baseline_routes.py -v`

- [ ] **Step 3: Fix imports**
  - `app.py`: `from config import Config` → `from opus_api.config import Config`; `import database` → `from opus_api import db as database`; `from Resume_analysis import …` → `from opus_api.services.resume_analysis import …`; `from opus_conn import …` → `from opus_api.repositories.legacy_competency import …`; `from email_graph import AzureGraphMailer` → `from opus_api.services.graph_mailer import AzureGraphMailer`; `from database import get_cursor, get_db` → `from opus_api.db import get_cursor, get_db`.
  - `routes/auth.py`, `routes/user.py`: `from models.users` / `models.subscriptions` → `from opus_api.models.…`.
  - `models/surveys.py`: `from database import …` → `from opus_api.db import …`.
  - `app.py`: replace the two literal Azure OpenAI keys with `os.environ["AZURE_OPENAI_KEY"]`; add the variable to `.env`. **Rotate the old key in Azure.**

- [ ] **Step 4: Run it — expect PASS**

Run: `python -m pytest tests/test_baseline_routes.py -v`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "fix: point app imports at opus_api package; move OpenAI key to env"
```

---

## Phase 1 — Backend foundation

### Task 1: Schema, test harness, errors, tenancy

**Files:**
- Create: `opus_api/migrations/riddlex/001_schema.sql`, `opus_api/blueprints/riddlex/{__init__,errors,auth,schemas}.py`, `tests/riddlex/conftest.py`, `tests/riddlex/test_auth.py`
- Modify: `app.py` (register blueprint), `requirements.txt` (`pytest`, `flask-limiter`, `azure-storage-blob`)

**Interfaces:**
- Produces: `riddlex_bp` (Blueprint), `ApiError(status:int, message:str)`, `@org_required` (sets `g.org_email: str`, `g.user_email: str`), pytest fixtures `client`, `db`, `auth_headers(org="owner@x.com", user="owner@x.com")`, `make_public_job()`.

- [ ] **Step 1: Write the schema** (`001_schema.sql`; MySQL 8, utf8mb4). Applied manually per environment — no migration tool exists; the file is idempotent (`IF NOT EXISTS`).

```sql
CREATE TABLE IF NOT EXISTS riddlex_career_sites (
  org_email VARCHAR(255) PRIMARY KEY,
  company_name VARCHAR(120) NOT NULL,
  slug VARCHAR(40) NOT NULL UNIQUE,
  tagline VARCHAR(255) NOT NULL DEFAULT '',
  logo_url VARCHAR(512) NOT NULL DEFAULT '',
  colors JSON NOT NULL,
  font VARCHAR(20) NOT NULL,
  hiring_locations JSON NOT NULL,
  languages JSON NOT NULL,
  default_language CHAR(2) NOT NULL,
  published TINYINT(1) NOT NULL DEFAULT 0,
  updated_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS riddlex_jobs (
  id CHAR(36) PRIMARY KEY,
  org_email VARCHAR(255) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  location VARCHAR(200) NOT NULL,
  job_type ENUM('Full-time','Part-time','Contract','Internship') NOT NULL,
  language CHAR(2) NOT NULL,
  status ENUM('Open','Closed') NOT NULL DEFAULT 'Open',
  public_token CHAR(32) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_jobs_org_created (org_email, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Generated once per job, then immutable: submissions are validated against these rows.
CREATE TABLE IF NOT EXISTS riddlex_job_questionnaires (
  job_id CHAR(36) NOT NULL,
  kind ENUM('screening','skills') NOT NULL,
  lang CHAR(2) NOT NULL,            -- 'en' for skills (skill names are language-neutral)
  payload JSON NOT NULL,
  generated_by ENUM('ai','catalog') NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (job_id, kind, lang),
  FOREIGN KEY (job_id) REFERENCES riddlex_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS riddlex_applications (
  id CHAR(36) PRIMARY KEY,
  job_id CHAR(36) NOT NULL,
  applicant_name VARCHAR(200) NOT NULL,
  applicant_email VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(40) NOT NULL,
  resume_file_name VARCHAR(255) NOT NULL,
  resume_blob_path VARCHAR(512) NOT NULL,
  answers JSON NOT NULL,
  skills JSON NOT NULL,
  skills_match TINYINT UNSIGNED NOT NULL,
  stage ENUM('New','In Review','Interview','Offer','Hired','Rejected') NOT NULL DEFAULT 'New',
  notes TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_job_email (job_id, applicant_email),
  INDEX idx_app_job_stage (job_id, stage),
  INDEX idx_app_created (created_at),
  FOREIGN KEY (job_id) REFERENCES riddlex_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS riddlex_application_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  application_id CHAR(36) NOT NULL,
  stage ENUM('New','In Review','Interview','Offer','Hired','Rejected') NOT NULL,
  at DATETIME(3) NOT NULL,
  INDEX idx_hist_app (application_id, at),
  FOREIGN KEY (application_id) REFERENCES riddlex_applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

- [ ] **Step 2: Write failing tests for tenancy**

```python
# tests/riddlex/test_auth.py
def test_requires_bearer_token(client):
    assert client.get("/api/riddlex/jobs").status_code == 401

def test_requires_active_riddlex_subscription(client, auth_headers):
    r = client.get("/api/riddlex/jobs", headers=auth_headers(subscription=None))
    assert r.status_code == 403
    assert "RiddleX" in r.get_json()["message"]

def test_assigned_user_resolves_to_owner_org(client, auth_headers):
    # a team member assigned to owner@x.com's subscription sees the owner's data
    h = auth_headers(org="owner@x.com", user="member@x.com")
    assert client.get("/api/riddlex/jobs", headers=h).status_code == 200
```

`conftest.py` provides `auth_headers` by inserting a `Subscription` row (`subscription="RiddleX"`, `subscription_status` active, `owner=org`, `email=user`) into the test database and minting a JWT with the app's `JWT_SECRET_KEY`. Tests run against a dedicated MySQL schema named by env `RIDDLEX_TEST_DB`; `conftest.py` applies `001_schema.sql` and truncates tables between tests.

- [ ] **Step 3: Run — expect FAIL (404 on every route)**

Run: `python -m pytest tests/riddlex/test_auth.py -v`

- [ ] **Step 4: Implement**

```python
# opus_api/blueprints/riddlex/errors.py
from flask import jsonify

class ApiError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status, self.message = status, message

def register_error_handlers(bp):
    @bp.errorhandler(ApiError)
    def _api_error(e):
        return jsonify({"message": e.message}), e.status
```

```python
# opus_api/blueprints/riddlex/auth.py
from functools import wraps
from flask import g
from routes.auth import auth            # existing HTTPTokenAuth; verify_token returns the user's email
from opus_api.models.subscriptions import Subscription
from .errors import ApiError

def _resolve_org(user_email: str) -> str:
    for sub in Subscription.find_by_email(user_email) or []:
        if sub.subscription == "RiddleX" and sub.subscription_status == "active":
            return sub.owner
    raise ApiError(403, "An active RiddleX subscription is required.")

def org_required(fn):
    @wraps(fn)
    @auth.login_required
    def wrapper(*a, **kw):
        g.user_email = auth.current_user()
        g.org_email = _resolve_org(g.user_email)
        return fn(*a, **kw)
    return wrapper
```

Before relying on `subscription_status == "active"`, read `opus_api/models/subscriptions.py:35` (`find_active_by_email`) and use that method if it already encodes "active" (it likely does) — then `_resolve_org` calls `find_active_by_email` instead of filtering by hand.

`__init__.py` creates `riddlex_bp = Blueprint("riddlex", __name__)`, calls `register_error_handlers`, imports the route modules. In `app.py` add `app.register_blueprint(riddlex_bp, url_prefix="/api/riddlex")`. Add `"http://localhost:5173"` (no `/*`) handling check: the existing CORS origin list uses `http://localhost:5173/*` and bare hostnames without scheme — verify preflight works from the Vite dev server and Azure SWA hosts in Step 5 and fix the list if not.

- [ ] **Step 5: Run — expect PASS; manually confirm a CORS preflight**

Run: `python -m pytest tests/riddlex/test_auth.py -v` then `curl -i -X OPTIONS http://127.0.0.1:5000/api/riddlex/jobs -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: POST"` — expect `Access-Control-Allow-Origin`.

- [ ] **Step 6: Commit** — `git commit -m "feat(riddlex): schema, org tenancy, error handling, test harness"`

---

## Phase 2 — Career site and jobs (authenticated)

### Task 2: Jobs API (the vertical-slice pattern every later task copies)

**Files:**
- Create: `opus_api/repositories/riddlex_repo.py`, `opus_api/blueprints/riddlex/jobs_routes.py`, `tests/riddlex/test_jobs.py`
- Modify: `opus_api/blueprints/riddlex/schemas.py`

**Interfaces:**
- Produces: `GET /jobs → Job[]` (newest first), `POST /jobs {title, description, requirements, location, jobType, language} → 201 Job`, `PATCH /jobs/<id>/status {status} → Job`. Repo: `jobs_list(org)`, `job_create(org, fields)`, `job_get(org, id)`, `job_set_status(org, id, status)`. All queries filter by `org_email`; a job from another org returns **404**, never 403.

- [ ] **Step 1: Failing tests** (port of mock behaviour)

```python
def test_create_job_validates_title(client, auth_headers):
    r = client.post("/api/riddlex/jobs", headers=auth_headers(), json={"title": "ab", "description": "", "requirements": "", "location": "", "jobType": "Full-time", "language": "en"})
    assert r.status_code == 400 and "at least 3" in r.get_json()["message"]

def test_create_job_defaults_and_token(client, auth_headers):
    r = client.post("/api/riddlex/jobs", headers=auth_headers(), json=JOB)
    body = r.get_json()
    assert r.status_code == 201 and body["status"] == "Open" and len(body["publicToken"]) >= 16
    assert body["location"] == "Remote"  # blank location defaults like the mock

def test_job_language_must_be_in_career_site_languages(client, auth_headers):
    save_site(client, auth_headers(), languages=["en"], default="en")
    r = client.post("/api/riddlex/jobs", headers=auth_headers(), json={**JOB, "language": "ar"})
    assert r.status_code == 400

def test_other_orgs_job_is_404(client, auth_headers):
    jid = client.post("/api/riddlex/jobs", headers=auth_headers(org="a@x.com"), json=JOB).get_json()["id"]
    r = client.patch(f"/api/riddlex/jobs/{jid}/status", headers=auth_headers(org="b@x.com"), json={"status": "Closed"})
    assert r.status_code == 404
```

- [ ] **Step 2:** Run — FAIL. **Step 3:** Implement. IDs `str(uuid.uuid4())`; token `secrets.token_urlsafe(24)[:32]`; row→dict mapper `job_to_json` renames snake_case to the camelCase keys; datetimes via `.isoformat(timespec="milliseconds") + "Z"`. Use `get_cursor(dictionary=True)` and parameterised SQL only. **Step 4:** Run — PASS. **Step 5:** commit `feat(riddlex): jobs API`.

### Task 3: Career site API + logo upload

**Files:** Create `career_site_routes.py`, `services/blob_storage.py`, `tests/riddlex/test_career_site.py`; modify `schemas.py`, `riddlex_repo.py`.

**Interfaces:**
- Produces: `GET /career-site → CareerSiteConfig | null`, `PUT /career-site CareerSiteInput → CareerSiteConfig` (upsert by org), `POST /career-site/logo` (multipart `file`, PNG/JPG/SVG ≤ 300 KB) `→ {logoUrl}`. `blob_storage.upload(container:str, path:str, data:bytes, content_type:str) -> str` and `blob_storage.download_url(container, path, ttl_minutes=15) -> str`.
- Consumes: `ApiError`, `org_required`.

Behaviour to port **verbatim** from `validateCareerSite` in the mock into `schemas.validate_career_site(input) -> dict`: company ≥ 2 chars; slug 3–40 chars matching `^[a-z0-9]+(?:-[a-z0-9]+)*$`; four hex colours (stored lowercase); font ∈ the 8 keys; 1–25 unique non-empty locations; languages ⊆ {en, ar, fr}, ≥ 1, `defaultLanguage` ∈ languages. New server-only rule: slug unique across orgs → **409** "That career site URL is taken." `logoDataUrl` is replaced by `logoUrl` (see Task 10 for the frontend adaptation).

- [ ] **Step 1: Failing tests:** one per validation rule above (parametrised), upsert idempotency (PUT twice → one row), slug collision across two orgs → 409, logo > 300 KB → 400, logo wrong MIME → 400.
- [ ] **Step 2:** FAIL. **Step 3:** implement. `blob_storage` uses `azure.storage.blob.BlobServiceClient.from_connection_string(os.environ["AZURE_STORAGE_CONNECTION_STRING"])`; when `RIDDLEX_STORAGE=local` it writes under `uploads/riddlex/` and returns `/api/riddlex/_dev_files/<path>` (dev/test only; route registered only when the flag is set). Logo container is public-read (it renders on the public site); resume container is private. SVG uploads are sanitised by rejecting any `<script` / `on*=` attribute (reject, don't try to clean). **Step 4:** PASS. **Step 5:** commit.

---

## Phase 3 — Public candidate flow

### Task 4: Questionnaire service (catalog + AI, persisted)

**Files:** Create `services/riddlex_questionnaire.py`, `tests/riddlex/test_questionnaire.py`, `tests/riddlex/test_scoring.py`.

**Interfaces:**
- Produces:
  - `build_skill_catalog_questions(job: dict) -> list[SkillQuestion]` — Python port of `buildSkillQuestions` + `SKILL_CATALOG` (copy the catalog table verbatim; min 4, max 8 skills; required skills first; category order Technical → Tools → Professional; `skillId()` slug rule identical).
  - `build_screening_questions(job: dict, lang: str) -> list[ScreeningQuestion]` — port of `buildQuestions` (en/ar/fr templates) with `minChars` `[20, 20, 2]`.
  - `get_or_create_questionnaire(job: dict, kind: str, lang: str) -> list[dict]` — reads `riddlex_job_questionnaires`; on miss tries Azure OpenAI (JSON mode, 8 s timeout), validates the shape, falls back to the catalog builders on any exception, then inserts with `generated_by`. Concurrency: `INSERT … ON DUPLICATE KEY UPDATE job_id = job_id` then re-read, so two simultaneous first requests converge on one row.
  - `score_skills(ratings: list[dict]) -> int` — weighted mean, required skills weigh 2, `round(earned/total*100)`, 0 when empty.

- [ ] **Step 1: Failing tests (parity with the mock — these are golden values, compute them by running the TS functions once and pasting results):**

```python
def test_skill_questions_match_mock_for_frontend_job():
    job = {"title": "Front-End Engineer (React)", "description": "...", "requirements": "3+ years with React and TypeScript, Tailwind CSS, REST API integration, accessibility (WCAG) and performance profiling."}
    ids = [q["id"] for q in build_skill_catalog_questions(job)]
    assert ids[:4] == ["skill_react", "skill_typescript", "skill_tailwind_css", "skill_rest_api_integration"]

def test_score_weights_required_double():
    r = [{"required": True, "proficiency": 5}, {"required": False, "proficiency": 1}]
    assert score_skills(r) == round((2*1 + 1*0.2) / 3 * 100)

def test_ai_failure_falls_back_to_catalog(monkeypatch):
    monkeypatch.setattr(q, "_call_openai", lambda *a, **k: (_ for _ in ()).throw(TimeoutError()))
    assert get_or_create_questionnaire(JOB, "skills", "en")  # non-empty, generated_by == "catalog"

def test_questionnaire_is_stable_across_calls():
    assert get_or_create_questionnaire(JOB, "skills", "en") == get_or_create_questionnaire(JOB, "skills", "en")
```

- [ ] **Step 2:** FAIL. **Step 3:** implement; prompt lives in a module constant and asks for strictly `{"skills":[{"skill","category","required"}]}` / `{"questions":["q1","q2","q3"]}`; any response that fails schema checks (counts, categories, non-empty strings) is discarded in favour of the catalog. Config: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_KEY`, `AZURE_OPENAI_DEPLOYMENT` from env; if unset → catalog only (so local dev and tests need no network). **Step 4:** PASS. **Step 5:** commit.

### Task 5: Public endpoints (job, questions, skills, career page)

**Files:** Create `public_routes.py`, `tests/riddlex/test_public.py`; modify `app.py` (limiter).

**Interfaces:**
- Produces (all unauthenticated):
  - `GET /public/jobs/<jobId>?token= → {job: PublicJob, site: PublicCareerSite}`
  - `POST /public/questions {jobId, token, lang} → ScreeningQuestion[]`
  - `POST /public/skills-questionnaire {jobId, token} → SkillQuestion[]`
  - `GET /public/careers/<slug> → {site, jobs: (PublicJob & {applyPath})[]}` — 404 unless the site is `published`; only `Open` jobs; `applyPath = /riddlex/apply/<id>?token=<publicToken>`.
- `require_public_job(job_id, token)`: 404 missing → 403 bad/missing token (constant-time `hmac.compare_digest`) → 410 closed. Same order as the mock.
- Site fallback when the org has no career site: the mock's `DEFAULT_SITE` constant, ported.
- Rate limits (flask-limiter, key = IP): 60/min for GET, 20/min for POST; `/public/apply` 5/min. Storage: in-memory in dev, `RATELIMIT_STORAGE_URI` env in prod (Azure Redis if available, otherwise per-instance memory is acceptable as a first cut — note in the PR).

- [ ] **Step 1: Failing tests:** wrong token → 403; closed job → 410; unknown job → 404; response never contains `publicToken`; careers page hides closed jobs and unpublished sites; question endpoint returns exactly 3 questions with `minChars`; calling it twice returns identical text (persistence); 21st request in a minute → 429.
- [ ] **Steps 2–5:** FAIL → implement → PASS → commit.

### Task 6: Submit application (resume upload, validation, scoring)

**Files:** Modify `public_routes.py`, `riddlex_repo.py`; create `tests/riddlex/test_apply.py`.

**Interfaces:**
- Produces: `POST /public/apply` — `multipart/form-data` with `payload` (JSON string of `SubmitApplicationInput` **minus** `resumeFileName`) and `resume` (PDF/DOC/DOCX ≤ 5 MB) `→ 201 {id}`.
- Rules ported from `submitApplication`: name required; `EMAIL_PATTERN`; exactly 3 non-blank answers; every skill in the **persisted** questionnaire rated, `proficiency` integer 1–5, `years ∈ {"<1","1-2","3-5","5+"}`; unknown/extra skill ids ignored (server rebuilds ratings from the persisted questionnaire, so candidates cannot invent or drop skills); duplicate (job, lowercased email) → **409** (enforced by the `uq_job_email` constraint — catch `IntegrityError 1062`, don't pre-check); `skills_match = score_skills(...)` computed server-side, the client value is ignored.
- Resume: MIME sniffed from magic bytes (`%PDF`, `PK\x03\x04`, `\xD0\xCF\x11\xE0`), not the filename; stored at `resumes/<org>/<job_id>/<application_id>.<ext>` in the **private** container; original filename kept in `resume_file_name` for display only.
- Insert application + first `history` row (`stage=New`) in one transaction.

- [ ] **Step 1: Failing tests:** happy path (row, history row, `skillsMatch` equals `score_skills`); client-supplied `skillsMatch` ignored; each validation failure → 400 with the mock's message text; duplicate email different case → 409; 6 MB file → 413/400; `.pdf` extension with text content → 400; missing rating → 400; closed job → 410.
- [ ] **Steps 2–5:** FAIL → implement → PASS → commit.

---

## Phase 4 — Recruiter pipeline

### Task 7: Applications list/detail/update

**Files:** Create `applications_routes.py`, `tests/riddlex/test_applications.py`.

**Interfaces:**
- Produces:
  - `GET /applications?jobId=&stage=&q=&sort=newest|oldest|match&page=1&pageSize=50 → {items: ApplicationWithJob[], total:int, page:int, pageSize:int}` (pageSize cap 100). `q` matches name/email (`LIKE` with escaped wildcards).
  - `GET /applications/<id> → ApplicationWithJob` (includes `history: {stage, at}[]`, ordered ascending).
  - `PATCH /applications/<id> {stage, notes} → Application` — appends a history row **only when the stage changed** (mock behaviour), updates `updated_at`, one transaction. Stage must be in `STAGES`; notes ≤ 5000 chars.
  - `GET /applications/<id>/resume → {url, fileName}` — 15-minute SAS URL from the private container.
- Org scoping is via `JOIN riddlex_jobs j ON j.id = a.job_id WHERE j.org_email = %s`; a foreign id returns 404.
- **Compatibility decision:** the mock returns a bare array. To keep pages working during the cutover the frontend `transformResponse` unwraps `items` (Task 10); pagination controls are added in Task 12.

- [ ] **Step 1: Failing tests:** list scoped to org; filters; sort by match; pagination totals; detail history order; PATCH same stage adds no history; PATCH new stage adds one; invalid stage → 400; foreign org → 404; resume URL for foreign org → 404.
- [ ] **Steps 2–5:** FAIL → implement → PASS → commit.

### Task 8: Dashboard summary

**Files:** Modify `applications_routes.py`; create `tests/riddlex/test_dashboard.py`.

**Interfaces:**
- Produces: `GET /dashboard → {openJobs:int, newThisWeek:int, active:int, byStage:Record<Stage,int>, reachedInterviewRate:number, trend:{date:string,count:int}[], jobRows:{jobId,title,status,newCount,active,hired,avgMatch:int}[], awaitingReview:ApplicationWithJob[]}`.
- Before writing SQL, read `RiddleXDashboard.tsx:66-121` and reproduce **exactly** its definitions of `ACTIVE_STAGES`, "reached interview" (uses `history`), the trend window and `avgMatch` rounding; test fixtures use the mock's seed data shape so the numbers match what the UI shows today.

- [ ] **Steps 1–5:** failing test per metric (fixed fixture with known counts) → implement with grouped queries (no per-job N+1) → PASS → commit.

---

## Phase 5 — Frontend cutover (RTK Query)

### Task 9: Base query plumbing

**Files:** Modify `OpusReact/src/store/apis/baseApi.ts`, `.env.development`, `.env.production` (`VITE_API_BASE_URL`).

**Interfaces:**
- Produces: `baseQueryWithReauth` unchanged in behaviour but `baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:5000/api/"`; new `publicBaseQuery = fetchBaseQuery({ baseUrl })` **without** the auth header and without the 401 logout/redirect. Remove the `console.log("Base query result")` (it logs every response, including candidate PII, to the console).

- [ ] **Step 1:** Edit `baseApi.ts` accordingly; export `publicBaseQuery`.
- [ ] **Step 2:** `npm run lint && npm run build` — expect clean.
- [ ] **Step 3:** Commit.

### Task 10: Rewrite `riddlexApi.ts` on real endpoints

**Files:** Modify `src/store/apis/riddlexApi.ts`, `src/store/apis/routes.ts` (drop the "not implemented" comment); modify the career-site setup page for logo upload (`RiddleXCareerSiteSetup.tsx`) and apply page for resume upload (`RiddleXApplyJob.tsx`).

**Design (what "enhance on top of it" means here):**

1. **One composed `baseQuery`** that routes by endpoint: authenticated endpoints use `baseQueryWithReauth`; endpoints whose name starts with `riddlexPublic`/`generateRiddlex…`/`submit…` use `publicBaseQuery`. Implement as a small wrapper `riddlexBaseQuery(args, api, extra)` that checks `api.endpoint` against a `PUBLIC_ENDPOINTS` set.
2. **Error mapping** so no page changes: `transformErrorResponse: (res) => ({ status: Number(res.status) || 500, message: (res.data as any)?.message ?? "Something went wrong. Please try again." })` applied once via a `baseQuery` wrapper, giving the existing `RiddleXApiError` shape; `riddlexErrorMessage()` is untouched. (Note `baseApi`'s 401 check reads `originalStatus`, which only exists for non-JSON bodies — fix to `result.error.status === 401` in the same task so expired tokens actually log out.)
3. **Same hook names**, same argument/return types. Where the backend shape differs, adapt in `transformResponse`: applications list unwraps `{items}`; `riddlexCareerSite` maps `logoUrl` → keep `logoDataUrl` field name in the TS type for the UI but treat it as a URL (rename the field to `logoUrl` across `riddlexMockServer.ts` types, the setup page, `BrandedShell`, and the career-site pages — a mechanical rename, grep for `logoDataUrl`).
4. **Tags:** replace blanket `"Application"` with `{type:"Application", id:"LIST"}` + per-id tags, add `"Dashboard"`; `updateRiddlexApplication` invalidates its own id, `LIST`, and `Dashboard`; `createRiddlexJob`/`setRiddlexJobStatus` invalidate `Job` and `Dashboard`; `submitRiddlexApplication` invalidates nothing on the public side (candidate has no cache to refresh).
5. **Optimistic stage/notes update** with `onQueryStarted`: patch `riddlexApplication(id)` and the cached list entries via `updateQueryData`, `undo()` on failure, `toast.error` with the server message.
6. **Caching:** `keepUnusedDataFor: 300` for jobs/career site; `refetchOnFocus`/`refetchOnReconnect` enabled via `setupListeners(globalStore.dispatch)` in `store.ts` (check it isn't already called); dashboard `pollingInterval` stays off (use `refetchOnMountOrArgChange: 30`).
7. **Multipart:** `submitRiddlexApplication` takes `{input, resume: File}` and builds `FormData` (`payload` JSON + `resume`); never set `Content-Type` manually. `saveRiddlexCareerSite` stays JSON; add `uploadRiddlexLogo` mutation (`FormData`, `file`) returning `{logoUrl}`.
8. **New hook** `useRiddlexDashboardQuery()` and `useRiddlexResumeUrlQuery(id, {skip})` (fetched on click, not on page load).

- [ ] **Step 1:** Rewrite endpoints; keep exports. **Step 2:** `npm run lint && npm run build`. **Step 3:** Run the Flask app against a dev DB seeded by Task 11 and walk the flows manually (below). **Step 4:** Commit.

Manual verification checklist (each is a distinct commit-gate):
- [ ] Sign in as a RiddleX subscriber → career-site setup saves, slug collision shows the server message, logo uploads and renders on `/careers/:slug`.
- [ ] Create a job in each of en/ar/fr → appears in dashboard → public apply link opens in an **incognito** window (no token in storage) and works end to end including resume upload.
- [ ] Move an application through stages → timeline updates instantly (optimistic), then survives reload.
- [ ] Expired token on an authenticated page → logged out + redirected; the same on a public page → no redirect.

### Task 11: Seed/reset replacement and mock removal

**Files:** Create `flask-app/scripts/seed_riddlex.py`; modify `RiddleXDashboard.tsx` (remove the "reset mock data" control), `riddlexMockServer.ts` (delete `riddlexMockServer`, `seed`, `load/save`, `SKILL_CATALOG`, `buildSkillQuestions`, `buildQuestions`, `scoreSkills`, `validateCareerSite`, `RiddleXMockError`; **keep** exported types and the constants the UI uses: `STAGES`, `JOB_TYPES`, `LANGUAGES`, `FONTS`, `SUGGESTED_LOCATIONS`, `DEFAULT_SITE`, `SLUG_PATTERN`, `EMAIL_PATTERN`, `PROFICIENCY_LEVELS`, `YEARS_BANDS`) — rename the file to `riddlexTypes.ts` and update imports; rewrite `scripts/riddlex-mock-smoke.ts` → `scripts/riddlex-api-smoke.ts` and the `smoke:riddlex` npm script; update `.claude/agents/riddlex-qa.md` invariants (it references the mock server).

- [ ] **Step 1:** `seed_riddlex.py --org owner@x.com` inserts the same 3 jobs / 10 applications as the mock seed (dev/staging only; refuses to run if `FLASK_ENV=production`). **Step 2:** delete mock code; `grep -rn "riddlexMockServer\|RiddleXMockError" src scripts` returns nothing. **Step 3:** `npm run lint && npm run build && npm run smoke:riddlex`. **Step 4:** commit.

---

## Phase 6 — Enhancements beyond parity (do after cutover is stable)

### Task 12: Server-side pagination, search and filters in the applications list
Wire `RiddleXApplicationsList.tsx` to `GET /applications?...` params (debounced `q`, stage chips, sort), `keepPreviousData`-style behaviour via `selectFromResult`/`isFetching`, and prefetch the next page + hovered row's detail (`usePrefetch("riddlexApplication")`). Tests: component-level manual check plus the existing backend pagination tests.

### Task 13 (optional — confirm scope with the user first): Candidate notifications
Email the candidate on apply-received and on `Rejected`/`Offer` using the existing `AzureGraphMailer` (`opus_api/services/graph_mailer.py`), templated per language, sent after commit and failure-tolerant. Not in the mock; skipped unless approved.

---

## Phase 7 — Deploy

### Task 14: Environments and rollout
- [ ] Provision: Azure Storage account with `riddlex-logos` (public blob read) and `riddlex-resumes` (private) containers; set App Service settings `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_KEY` (rotated), `AZURE_OPENAI_DEPLOYMENT`, `RATELIMIT_STORAGE_URI`.
- [ ] Run `001_schema.sql` on the `test` branch database (deployed by `.github/workflows/test_opus-new-backend.yml`), run the smoke script against it, then repeat for production (`main` → `opus-app`).
- [ ] Add `VITE_API_BASE_URL` to both Azure Static Web Apps workflows (`dev` → kind-mushroom, `main` → thankful-moss).
- [ ] Confirm the SWA hostnames are in the CORS allowlist **with** `https://`.
- [ ] Add a pytest step to the backend workflow (needs a MySQL service container) so the new suite gates deploys.
- [ ] Update `flask-app/CLAUDE.md` and `OpusReact/CLAUDE.md` (RiddleX is now real; remove the "mock server" notes) and run `graphify update .` in both repos.

---

## Self-Review

**Spec coverage** (every mock capability → task): jobs list/create/status (2) · career site config + validation + slug (3) · logo (3, 10) · public job + token/closed rules (5) · screening questions i18n (4, 5) · skills questionnaire + required flag (4, 5) · apply + duplicate guard + server scoring (6) · applications list/detail/update + history (7) · dashboard stats (8) · public careers page (5) · reset/seed (11) · white-label languages/default language rule (3) · subscription gating (1). Gaps intentionally left: password-protected jobs, job editing/deletion, multi-recruiter comments — none exist in the mock.

**Placeholder scan:** schema is complete; Tasks 2–8 give contracts, validation rules and concrete tests but not every handler body — handlers follow the Task 2 slice pattern and the mock's code is the line-by-line reference for validation text. Two spots require reading code first, called out in-step (Subscription "active" helper in Task 1, dashboard definitions in Task 8).

**Type consistency:** `logoDataUrl → logoUrl` rename is the only TS type change and is scoped to Task 10; `ApplicationWithJob` gains no fields; list response gains an envelope that Task 10 unwraps; `submitRiddlexApplication` argument changes from `SubmitApplicationInput` to `{input, resume}` — call site is `RiddleXApplyJob.tsx` only.

## Open decisions (defaults chosen, tell me if you disagree)

1. Org = subscription **owner** (team members share data). Alternative: per-user data.
2. Azure Blob Storage for resumes/logos (vs. DB blobs or the `uploads/` folder, which doesn't survive App Service redeploys).
3. LLM-generated questionnaires persisted per job, with the deterministic catalog as fallback.
4. pytest + a real MySQL test schema (no SQLite — JSON columns and ENUMs differ).
5. Finish the in-progress `opus_api/` refactor rather than reverting it (Task 0 checkpoint).
