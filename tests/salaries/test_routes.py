"""Route tests. The repo layer is monkeypatched (no real DB); the Bearer check is stubbed by the conftest."""
import pytest

from salaries import repo

def test_stats_returns_live_scorecard_numbers(client, bearer, monkeypatch):
    monkeypatch.setattr(repo, "overview_stats", lambda: {
        "markets": 2, "jobFamilies": 5, "jobTitles": 40, "dataPoints": 1234})
    monkeypatch.setattr(repo, "list_countries", lambda: ["UAE", "Egypt"])
    r = client.get("/api/salaries/stats", headers=bearer)
    assert r.status_code == 200
    assert r.get_json() == {"markets": 2, "jobFamilies": 5, "jobTitles": 40,
                            "dataPoints": 1234, "countries": ["Egypt", "UAE"]}


ROUTES = ["/api/salaries/stats", "/api/salaries/countries", "/api/salaries/families?country=Egypt",
          "/api/salaries/jobs?country=Egypt&family=F",
          "/api/salaries/experience?country=Egypt&family=F&job=J",
          "/api/salaries/chart?country=Egypt&family=F&job=J&experience=2-3",
          "/api/salaries/search?q=cloud"]


# --- 401 ---
def test_401_without_token_or_with_bad_token(anon_client):
    for route in ROUTES:
        for headers in ({}, {"Authorization": "Bearer nope"}):
            r = anon_client.get(route, headers=headers)
            assert r.status_code == 401, route
            assert r.get_json() == {"message": "Your session has expired. Please sign in again."}


# --- 400 missing / blank params ---
@pytest.mark.parametrize("route", [
    "/api/salaries/families",
    "/api/salaries/families?country=%20%20",
    "/api/salaries/jobs?country=Egypt",
    "/api/salaries/experience?country=Egypt&family=F",
    "/api/salaries/chart?country=Egypt&family=F&job=J",
    "/api/salaries/search",
    "/api/salaries/search?q=%20",
])
def test_400_on_missing_or_blank_param(client, bearer, route):
    r = client.get(route, headers=bearer)
    assert r.status_code == 400
    assert isinstance(r.get_json()["message"], str)


def test_search_one_char_is_400(client, bearer):
    r = client.get("/api/salaries/search?q=a", headers=bearer)
    assert r.status_code == 400


# --- 404 chart with no row ---
def test_chart_404_when_no_row(client, bearer, monkeypatch):
    monkeypatch.setattr(repo, "chart_rows", lambda *a: [])
    r = client.get("/api/salaries/chart?country=Egypt&family=F&job=J&experience=2-3", headers=bearer)
    assert r.status_code == 404
    assert "message" in r.get_json()


# --- 200 shapes ---
def test_countries_200_list(client, bearer, monkeypatch):
    monkeypatch.setattr(repo, "list_countries", lambda: ["UAE", "Egypt"])
    r = client.get("/api/salaries/countries", headers=bearer)
    assert r.status_code == 200
    assert r.get_json() == ["Egypt", "UAE"]


def test_empty_list_is_200_not_404(client, bearer, monkeypatch):
    monkeypatch.setattr(repo, "list_families", lambda country: [])
    r = client.get("/api/salaries/families?country=Nowhere", headers=bearer)
    assert r.status_code == 200
    assert r.get_json() == []


def test_experience_200_sorted_canonical(client, bearer, monkeypatch):
    monkeypatch.setattr(repo, "list_experience", lambda c, f, j: ["10+", "2-3", "0-1", "n/a"])
    r = client.get("/api/salaries/experience?country=Egypt&family=F&job=J", headers=bearer)
    assert r.get_json() == ["0-1", "2-3", "10+", "n/a"]


def test_chart_200_shape_and_experience_is_canonicalised(client, bearer, monkeypatch):
    seen = {}

    def fake_rows(country, family, job, experience):
        seen["args"] = (country, family, job, experience)
        return [{"H_25": "120000", "L_25": "60000", "H_26": "0.00", "L_26": "0.00"}]

    monkeypatch.setattr(repo, "chart_rows", fake_rows)
    r = client.get("/api/salaries/chart?country=Egypt&family=F&job=J&experience=%202%20-%203%20",
                   headers=bearer)
    assert r.status_code == 200
    assert seen["args"] == ("Egypt", "F", "J", "2-3")
    body = r.get_json()
    assert set(body) == {"meta", "series"}
    assert body["meta"]["currency"] == "EGP"
    assert body["meta"]["yAxisLabel"] == "Salary in EGP/month NET"
    assert len(body["meta"]["notes"]) == 3
    assert body["series"] == [{"year": 2025, "min": 5000, "max": 10000}]


def test_chart_200_with_all_zero_row_gives_empty_series(client, bearer, monkeypatch):
    monkeypatch.setattr(repo, "chart_rows", lambda *a: [{"H_26": "0.00", "L_26": "0.00"}])
    r = client.get("/api/salaries/chart?country=UAE&family=F&job=J&experience=0-1", headers=bearer)
    assert r.status_code == 200
    assert r.get_json()["series"] == []


def test_search_200_shape_max_25(client, bearer, monkeypatch):
    triples = [("Egypt", "Dev", f"Cloud Engineer {n}") for n in range(40)]
    monkeypatch.setattr(repo, "all_triples", lambda: triples)
    r = client.get("/api/salaries/search?q=cloud%20engineer", headers=bearer)
    assert r.status_code == 200
    hits = r.get_json()
    assert len(hits) == 25
    assert hits[0] == {"country": "Egypt", "family": "Dev", "job": "Cloud Engineer 0"}
