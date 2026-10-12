from flask import g, jsonify, request

from . import riddlex_bp, repo_jobs
from .auth import org_required
from .errors import ApiError


@riddlex_bp.route("/jobs", methods=["GET"])
@org_required
def list_jobs():
    return jsonify(repo_jobs.jobs_list(g.org_email))


@riddlex_bp.route("/jobs", methods=["POST"])
@org_required
def create_job():
    fields = repo_jobs.validate_job_draft(
        request.get_json(silent=True), repo_jobs.site_languages(g.org_email))
    return jsonify(repo_jobs.job_create(g.org_email, fields)), 201


@riddlex_bp.route("/jobs/<job_id>/status", methods=["PATCH"])
@org_required
def set_job_status(job_id):
    status = repo_jobs.validate_status(request.get_json(silent=True))
    job = repo_jobs.job_set_status(g.org_email, job_id, status)
    if job is None:
        raise ApiError(404, "Job not found.")
    return jsonify(job)
