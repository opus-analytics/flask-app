from flask import g, jsonify, request

from . import riddlex_bp, repo_apps
from .auth import org_required
from .blob_storage import download_url, resume_container
from .errors import ApiError


@riddlex_bp.route("/applications", methods=["GET"])
@org_required
def list_applications():
    args = repo_apps.parse_list_args(request.args)
    return jsonify(repo_apps.applications_list(g.org_email, args))


@riddlex_bp.route("/applications/<app_id>", methods=["GET"])
@org_required
def get_application(app_id):
    app = repo_apps.application_get(g.org_email, app_id)
    if app is None:
        raise ApiError(404, "Application not found.")
    return jsonify(app)


@riddlex_bp.route("/applications/<app_id>", methods=["PATCH"])
@org_required
def update_application(app_id):
    stage, notes = repo_apps.validate_update(request.get_json(silent=True))
    app = repo_apps.application_update(g.org_email, app_id, stage, notes)
    if app is None:
        raise ApiError(404, "Application not found.")
    return jsonify(app)


@riddlex_bp.route("/applications/<app_id>/resume", methods=["GET"])
@org_required
def application_resume(app_id):
    resume = repo_apps.application_resume(g.org_email, app_id)
    if resume is None:
        raise ApiError(404, "Application not found.")
    url = download_url(resume_container(), resume["blobPath"])
    return jsonify({"url": url, "fileName": resume["fileName"]})


@riddlex_bp.route("/dashboard", methods=["GET"])
@org_required
def get_dashboard():
    return jsonify(repo_apps.dashboard(g.org_email))
