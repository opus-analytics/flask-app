from flask import g, jsonify, request

from . import riddlex_bp, repo_jobs
from .auth import org_required
from .errors import ApiError
from user_stats.tracker import track


FLAG_OFF = "Custom questions are not enabled for your subscription."


def _require_custom_questions():
    if not g.custom_questions_enabled:
        raise ApiError(403, FLAG_OFF)


@riddlex_bp.route("/entitlements", methods=["GET"])
@org_required
def entitlements():
    return jsonify({"customQuestionsEnabled": g.custom_questions_enabled})


@riddlex_bp.route("/jobs", methods=["GET"])
@org_required
def list_jobs():
    return jsonify(repo_jobs.jobs_list(g.org_email))


@riddlex_bp.route("/jobs", methods=["POST"])
@track("riddlex_job_create", "RiddleX")
@org_required
def create_job():
    body = request.get_json(silent=True)
    fields = repo_jobs.validate_job_draft(body, repo_jobs.site_languages(g.org_email))
    questions = repo_jobs.validate_custom_questions(body.get("customQuestions", []))
    if questions:
        _require_custom_questions()
    fields["custom_questions"] = questions
    return jsonify(repo_jobs.job_create(g.org_email, fields)), 201


@riddlex_bp.route("/jobs/<job_id>/status", methods=["PATCH"])
@org_required
def set_job_status(job_id):
    status = repo_jobs.validate_status(request.get_json(silent=True))
    job = repo_jobs.job_set_status(g.org_email, job_id, status)
    if job is None:
        raise ApiError(404, "Job not found.")
    return jsonify(job)


@riddlex_bp.route("/jobs/<job_id>/custom-questions", methods=["PUT"])
@org_required
def set_job_custom_questions(job_id):
    _require_custom_questions()
    body = request.get_json(silent=True)
    questions = repo_jobs.validate_custom_questions(body.get("customQuestions") if isinstance(body, dict) else None)
    job = repo_jobs.job_set_questions(g.org_email, job_id, questions)
    if job is None:
        raise ApiError(404, "Job not found.")
    return jsonify(job)
