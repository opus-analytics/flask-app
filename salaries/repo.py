"""Salary analysis SQL. Every query is parameterised (%s only); user input is never formatted into SQL."""
from opus_api.db import get_cursor

from .presentation import canonical_experience, count_data_points, sort_experience


def _fetch_all(sql, params=()):
    cur = get_cursor(dictionary=True)
    try:
        cur.execute(sql, params)
        return cur.fetchall()
    finally:
        cur.close()


def normalize_text(s):
    """Collapse runs of whitespace to one space and trim. None -> ''."""
    return " ".join(str(s).split()) if s is not None else ""


def overview_stats():
    """Live scorecard numbers: distinct markets / job families / job titles, and data points
    (each row x year with a valid H or L amount counts once)."""
    rows = _fetch_all(
        "SELECT COUNT(DISTINCT NULLIF(TRIM(Country), '')) AS markets, "
        "COUNT(DISTINCT NULLIF(TRIM(Family), '')) AS families, "
        "COUNT(DISTINCT NULLIF(TRIM(Job), '')) AS jobs "
        "FROM opus_prod.salarydatabse"
    )
    row = rows[0] if rows else {}
    value_rows = _fetch_all(
        "SELECT H_20, L_20, H_21, L_21, H_22, L_22, H_23, L_23, H_24, L_24, H_25, L_25, H_26, L_26 "
        "FROM opus_prod.salarydatabse"
    )
    return {
        "markets": int(row.get("markets") or 0),
        "jobFamilies": int(row.get("families") or 0),
        "jobTitles": int(row.get("jobs") or 0),
        "dataPoints": count_data_points(value_rows),
    }


def list_countries():
    rows = _fetch_all(
        "SELECT DISTINCT TRIM(Country) AS value FROM opus_prod.salarydatabse "
        "WHERE TRIM(Country) <> ''"
    )
    return [r["value"] for r in rows if r["value"]]


def list_families(country):
    rows = _fetch_all(
        "SELECT DISTINCT TRIM(Family) AS value FROM opus_prod.salarydatabse "
        "WHERE TRIM(Country) = %s AND TRIM(Family) <> ''",
        (country,),
    )
    return [r["value"] for r in rows if r["value"]]


def list_jobs(country, family):
    rows = _fetch_all(
        "SELECT DISTINCT TRIM(Job) AS value FROM opus_prod.salarydatabse "
        "WHERE TRIM(Country) = %s AND TRIM(Family) = %s AND TRIM(Job) <> ''",
        (country, family),
    )
    return sorted({normalize_text(r["value"]) for r in rows} - {""})


def list_experience(country, family, job):
    rows = _fetch_all(
        "SELECT DISTINCT TRIM(Years_of_Experience) AS value, Job FROM opus_prod.salarydatabse "
        "WHERE TRIM(Country) = %s AND TRIM(Family) = %s",
        (country, family),
    )
    wanted = normalize_text(job)
    return sort_experience(r["value"] for r in rows if normalize_text(r["Job"]) == wanted)


def chart_rows(country, family, job, experience):
    """All rows for one (country, family, job, canonical experience); duplicates are averaged by the caller."""
    rows = _fetch_all(
        "SELECT Years_of_Experience, Job, H_20, L_20, H_21, L_21, H_22, L_22, H_23, L_23, H_24, L_24, H_25, L_25, H_26, L_26 "
        "FROM opus_prod.salarydatabse "
        "WHERE TRIM(Country) = %s AND TRIM(Family) = %s",
        (country, family),
    )
    wanted_exp = canonical_experience(experience)
    wanted_job = normalize_text(job)
    return [
        r for r in rows
        if normalize_text(r["Job"]) == wanted_job
        and canonical_experience(r["Years_of_Experience"]) == wanted_exp
    ]


def all_triples():
    """Distinct (country, family, job) triples, for in-Python search (710 rows, no FULLTEXT index).
    Job titles are whitespace-normalised and the resulting triples deduplicated."""
    rows = _fetch_all(
        "SELECT DISTINCT TRIM(Country) AS country, TRIM(Family) AS family, Job AS job "
        "FROM opus_prod.salarydatabse"
    )
    triples = [(r["country"], r["family"], normalize_text(r["job"])) for r in rows]
    return list(dict.fromkeys(triples))
