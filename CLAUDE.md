# CLAUDE.md — flask-app (Opus backend)

Inherits context from `../../CLAUDE.md` (02_Opus) and the root `GLOBAL.md` / `CLAUDE.md`.

## What this repo is

The Flask API backend for Opus Analytics (an HR / talent-assessment SaaS product — resume analysis,
job-description analysis, candidate surveys/assessments, subscriptions). Most of the app logic lives in
a single large `app.py` (~2,700 lines) rather than being fully modularized into blueprints — be aware of
that when searching for an endpoint; grep `app.py` first, then check `routes/` and `models/`.

## Stack

- Flask, MySQL (via `mysql-connector-python`, Azure Database for MySQL), `flask_cors`, `flask_mail`,
  `flask_wtf`, `flask_httpauth`
- Auth: JWT (`PyJWT`), `bcrypt`, `Werkzeug==2.2.2` (pinned)
- Payments: `stripe`
- AI: `openai` / `AzureOpenAI` (Azure OpenAI endpoint, used in `Resume_analysis.py` and inline in
  `app.py`)
- Documents: `python-docx`, `docx2txt`, `PyPDF2`, `PyMuPDF` (`fitz`) — resume/JD parsing
- Email: `flask_mail`, `email_graph.py` (`AzureGraphMailer` — Microsoft Graph mail), `msal`
- Data: `pandas`, `xmltodict`

## Structure

- `app.py` — main app; creates the Flask app, configures CORS, registers blueprints, and defines most
  API endpoints directly (`/api/...`)
- `config.py` — `Config` class (DB creds, mail, JWT config) — **contains real secrets in plaintext**,
  not just `.env` lookups. Treat as sensitive; don't echo its contents into chat/commits/docs.
- `database.py` — DB connection/cursor helpers (`get_cursor`, `get_db`), `database.init_app(app)`
- `opus_conn.py` — additional DB helper functions (e.g. `get_competencies_hamza`, `get_job_info_from_db`)
- `Resume_analysis.py` — `OpusResume`, `OpusJDAnalyzer` classes (Azure OpenAI-backed resume/JD analysis)
- `email_graph.py` — `AzureGraphMailer` (Microsoft Graph email sending)
- `routes/` — `auth.py` (`auth_bp`, mounted at `/api/auth`), `user.py` (`user_bp`, mounted at
  `/api/user`)
- `models/` — `surveys.py` (`survey_bp`, mounted at `/api/survey`), plus `assessment.py`,
  `subscriptions.py`, `users.py` (check whether these are imported/registered in `app.py` before
  assuming they're live — `app.py` only explicitly registers `auth_bp`, `user_bp`, `survey_bp`)
- `templates/`, `static/`, `uploads/` — Flask template/static/upload dirs
- `step_by_step_process.md` / `Step by step process.txt` — existing process notes, worth checking before
  writing new docs that might duplicate them
- `TODO.md` — current open task list; check before starting new work

## Running locally

```
pip install -r requirements.txt
python app.py   # runs with debug=True, default Flask dev server
```

Needs a `.env` file for `SECRET_KEY` and `MAIL_PASSWORD` at minimum (see `config.py` for what's read
from env vs. hardcoded).

CORS is currently locked to `http://localhost:5173/*` (the Vite dev server for `OpusReact`) plus two
Azure Static Web Apps hostnames — update `CORS(...)` in `app.py` if a new frontend origin is added.

## Conventions / notes for Claude

- No test suite currently exists in this repo — don't assume `pytest` or similar is set up; ask before
  scaffolding one.
- `Werkzeug` is pinned to `2.2.2` — don't let a dependency upgrade bump it without checking compatibility
  with the rest of the Flask/Werkzeug stack.
- Prefer extending `routes/` or `models/` blueprints for new endpoint groups rather than adding more to
  the already-large `app.py`, unless the surrounding code clearly expects it inline.
- Never commit real secrets. `config.py` already has some hardcoded (pre-existing issue, not something to
  silently "fix" by rewriting credentials without asking first).
