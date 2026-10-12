"""Salary analysis endpoints (contract: salary_contract.md). All GET, all login-required."""
from flask import jsonify, request

from . import presentation, repo, salaries_bp, search
from .auth import auth


def _params(*names):
    """Return ({name: stripped value}, None), or (None, 400 response) when a required param is missing/blank."""
    values = {}
    for name in names:
        value = (request.args.get(name) or "").strip()
        if not value:
            return None, (jsonify({"message": f"Missing required parameter: {name}."}), 400)
        values[name] = value
    return values, None


@salaries_bp.route("/stats", methods=["GET"])
@auth.login_required
def stats():
    data = repo.overview_stats()
    data["countries"] = sorted(repo.list_countries())
    return jsonify(data)


@salaries_bp.route("/countries", methods=["GET"])
@auth.login_required
def countries():
    return jsonify(sorted(repo.list_countries()))


@salaries_bp.route("/families", methods=["GET"])
@auth.login_required
def families():
    p, err = _params("country")
    if err:
        return err
    return jsonify(sorted(repo.list_families(p["country"])))


@salaries_bp.route("/jobs", methods=["GET"])
@auth.login_required
def jobs():
    p, err = _params("country", "family")
    if err:
        return err
    return jsonify(sorted(repo.list_jobs(p["country"], p["family"])))


@salaries_bp.route("/experience", methods=["GET"])
@auth.login_required
def experience():
    p, err = _params("country", "family", "job")
    if err:
        return err
    return jsonify(presentation.sort_experience(repo.list_experience(p["country"], p["family"], p["job"])))


@salaries_bp.route("/chart", methods=["GET"])
@auth.login_required
def chart():
    p, err = _params("country", "family", "job", "experience")
    if err:
        return err
    exp = presentation.canonical_experience(p["experience"])
    rows = repo.chart_rows(p["country"], p["family"], p["job"], exp)
    if not rows:
        return jsonify({"message": "No salary data found for this selection."}), 404
    return jsonify(presentation.build_chart(rows, p["country"], p["family"], p["job"], exp))


@salaries_bp.route("/search", methods=["GET"])
@auth.login_required
def salary_search():
    p, err = _params("q")
    if err:
        return err
    if len(p["q"]) < 2:
        return jsonify({"message": "Search text must be at least 2 characters."}), 400
    return jsonify(search.search_jobs(p["q"], repo.all_triples()))
