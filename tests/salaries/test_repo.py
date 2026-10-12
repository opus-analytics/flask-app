"""Repo SQL is parameterised: user input goes in as %s params, never into the SQL text. No DB."""
from salaries import repo


class FakeCursor:
    def __init__(self, rows=()):
        self.rows = list(rows)
        self.executed = []
        self.closed = False

    def execute(self, sql, params=()):
        self.executed.append((sql, params))

    def fetchall(self):
        return self.rows

    def close(self):
        self.closed = True


def test_chart_rows_params_and_python_experience_filter(monkeypatch):
    rows = [
        {"Years_of_Experience": " 2 - 3 ", "Job": "Frontend Developer I", "H_26": "1"},
        {"Years_of_Experience": "0-1", "Job": "Frontend Developer I", "H_26": "2"},
    ]
    cur = FakeCursor(rows=rows)
    monkeypatch.setattr(repo, "get_cursor", lambda dictionary=False: cur)

    out = repo.chart_rows("Egypt", "Software Development", "Frontend Developer I", "2-3")

    assert out == [rows[0]]
    sql, params = cur.executed[0]
    assert params == ("Egypt", "Software Development")
    assert sql.count("%s") == 2
    for user_value in ("Egypt", "Software Development", "Frontend Developer I"):
        assert user_value not in sql
    assert cur.closed is True


def test_chart_rows_matches_job_ignoring_internal_whitespace(monkeypatch):
    rows = [
        {"Years_of_Experience": "2-3", "Job": "Senior Quality  Control Engineer", "H_26": "1"},
        {"Years_of_Experience": "2-3", "Job": "Senior Quality Control Engineer", "H_26": "2"},
        {"Years_of_Experience": "2-3", "Job": "Senior Quality Control Engineer ", "H_26": "3"},
        {"Years_of_Experience": "2-3", "Job": "Senior Quality Control Manager", "H_26": "4"},
    ]
    cur = FakeCursor(rows=rows)
    monkeypatch.setattr(repo, "get_cursor", lambda dictionary=False: cur)

    out = repo.chart_rows("Egypt", "QA", "Senior Quality Control Engineer", "2-3")

    assert out == rows[:3]


def test_list_experience_canonicalises_and_dedupes(monkeypatch):
    cur = FakeCursor(rows=[
        {"value": "2 - 3", "Job": "J"},
        {"value": "2-3", "Job": "J"},
        {"value": "Assistant Manager", "Job": "J"},
        {"value": "", "Job": "J"},
    ])
    monkeypatch.setattr(repo, "get_cursor", lambda dictionary=False: cur)
    assert repo.list_experience("UAE", "F", "J") == ["2-3", "Assistant Manager", "-"]
    assert cur.executed[0][1] == ("UAE", "F")


def test_list_experience_keeps_seniority_levels_readable(monkeypatch):
    cur = FakeCursor(rows=[
        {"value": "Partner (5+ years)", "Job": "J"},
        {"value": "Partner (1-4 years)", "Job": "J"},
        {"value": "Assistant Manager", "Job": "J"},
    ])
    monkeypatch.setattr(repo, "get_cursor", lambda dictionary=False: cur)
    assert repo.list_experience("UAE", "F", "J") == ["Partner (1-4 years)", "Partner (5+years)", "Assistant Manager"]
    sql, _ = cur.executed[0]
    assert "TRIM(Years_of_Experience)" in sql
    assert "REPLACE" not in sql


def test_list_experience_null_and_dash_rows_are_listed_as_dash_last(monkeypatch):
    cur = FakeCursor(rows=[
        {"value": None, "Job": "J"},
        {"value": "2-3", "Job": "J"},
        {"value": " - ", "Job": "J"},
        {"value": "-", "Job": "J"},
        {"value": "0-1", "Job": "J"},
    ])
    monkeypatch.setattr(repo, "get_cursor", lambda dictionary=False: cur)
    assert repo.list_experience("Mauritius", "F", "J") == ["0-1", "2-3", "-"]
    sql, params = cur.executed[0]
    assert "IS NOT NULL" not in sql and "<> ''" not in sql
    assert params == ("Mauritius", "F")


def test_list_experience_only_returns_experience_for_the_requested_job(monkeypatch):
    cur = FakeCursor(rows=[
        {"value": "2-3", "Job": "Senior Quality  Control Engineer"},
        {"value": "0-1", "Job": "Senior Quality Control Engineer"},
        {"value": "5-6", "Job": "Senior Quality Control Manager"},
    ])
    monkeypatch.setattr(repo, "get_cursor", lambda dictionary=False: cur)
    assert repo.list_experience("Egypt", "QA", "Senior Quality Control Engineer") == ["0-1", "2-3"]


def test_chart_rows_dash_matches_null_blank_and_dash_experience(monkeypatch):
    rows = [
        {"Years_of_Experience": None, "Job": "J", "H_26": "1"},
        {"Years_of_Experience": " - ", "Job": "J", "H_26": "2"},
        {"Years_of_Experience": "", "Job": "J", "H_26": "3"},
        {"Years_of_Experience": "-", "Job": "J", "H_26": "4"},
        {"Years_of_Experience": "2-3", "Job": "J", "H_26": "5"},
    ]
    cur = FakeCursor(rows=rows)
    monkeypatch.setattr(repo, "get_cursor", lambda dictionary=False: cur)

    out = repo.chart_rows("Mauritius", "F", "J", "-")

    assert out == rows[:4]
    sql, params = cur.executed[0]
    assert params == ("Mauritius", "F")
    assert sql.count("%s") == 2


def test_list_jobs_collapses_whitespace_dedupes_and_drops_blanks(monkeypatch):
    cur = FakeCursor(rows=[
        {"value": "Senior Quality  Control Engineer"},
        {"value": "Senior Quality Control Engineer"},
        {"value": "Frontend Developer"},
        {"value": "  Frontend \t Developer "},
        {"value": ""},
        {"value": None},
    ])
    monkeypatch.setattr(repo, "get_cursor", lambda dictionary=False: cur)

    assert repo.list_jobs("Egypt", "QA") == ["Frontend Developer", "Senior Quality Control Engineer"]
    sql, params = cur.executed[0]
    assert params == ("Egypt", "QA")
    assert "DISTINCT TRIM(Job)" in sql
    assert cur.closed is True


def test_all_triples_normalises_job_and_dedupes(monkeypatch):
    cur = FakeCursor(rows=[
        {"country": "Egypt", "family": "QA", "job": "Senior Quality  Control Engineer"},
        {"country": "Egypt", "family": "QA", "job": "Senior Quality Control Engineer"},
        {"country": "UAE", "family": "QA", "job": "Senior Quality Control Engineer"},
        {"country": "Egypt", "family": "Dev", "job": "Backend   Developer"},
    ])
    monkeypatch.setattr(repo, "get_cursor", lambda dictionary=False: cur)

    assert repo.all_triples() == [
        ("Egypt", "QA", "Senior Quality Control Engineer"),
        ("UAE", "QA", "Senior Quality Control Engineer"),
        ("Egypt", "Dev", "Backend Developer"),
    ]
    sql, params = cur.executed[0]
    assert params == ()
    assert "%s" not in sql


def test_normalize_text_collapses_whitespace_and_handles_none():
    assert repo.normalize_text("Senior Quality  Control Engineer") == "Senior Quality Control Engineer"
    assert repo.normalize_text("  a \n\t b  ") == "a b"
    assert repo.normalize_text(None) == ""
    assert repo.normalize_text("   ") == ""


def test_cursor_closed_even_when_query_fails(monkeypatch):
    class Boom(FakeCursor):
        def execute(self, sql, params=()):
            raise RuntimeError("db down")

    cur = Boom()
    monkeypatch.setattr(repo, "get_cursor", lambda dictionary=False: cur)
    try:
        repo.list_countries()
    except RuntimeError:
        pass
    assert cur.closed is True
