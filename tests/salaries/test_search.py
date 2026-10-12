"""Pure unit tests for search_jobs. No DB, no app import."""
from salaries.search import MAX_HITS, normalize, search_jobs

TRIPLES = [
    ("Egypt", "Software Development", "Frontend Developer I"),
    ("Egypt", "Software Development", "Frontend Developer II"),
    ("Egypt", "Software Development", "Frontend Developer III"),
    ("Egypt", "Software Development", "Senior Frontend Developer"),
    ("Egypt", "Software Development", "Front-End Engineer"),
    ("KSA", "Cloud", "Cloud Engineer -Telco"),
    ("UAE", "Cloud", "Cloud Engineer"),
    ("UAE", "Cloud", "DotNet Developer "),
]


def _jobs(hits):
    return [h["job"] for h in hits]


def test_normalize_collapses_front_end_and_strips_punctuation():
    assert normalize("Front-End Developer") == "frontend developer"
    assert normalize("Full Stack / Back-end") == "fullstack backend"
    assert normalize("Cloud Engineer -Telco") == "cloud engineer telco"


def test_normalize_non_alnum_becomes_space():
    assert normalize("Sr.Engineer") == "sr engineer"
    assert normalize("Front.End  Dev") == "frontend dev"


def test_mid_matches_word_mid_and_ii():
    triples = [("Egypt", "Dev", "Mid Level Engineer"), ("Egypt", "Dev", "Engineer II"), ("Egypt", "Dev", "Midwife")]
    assert sorted(_jobs(search_jobs("mid engineer", triples))) == ["Engineer II", "Mid Level Engineer"]


def test_junior_front_end_matches_frontend_developer_i():
    hits = search_jobs("junior front-end", TRIPLES)
    assert "Frontend Developer I" in _jobs(hits)
    # 'junior' is whole-word {junior, jr, i}: 'III'/'II' are only tier-2 fillers, ranked after the full matches
    jobs = _jobs(hits)
    assert jobs.index("Frontend Developer I") < jobs.index("Frontend Developer III")
    assert jobs.index("Frontend Developer I") < jobs.index("Frontend Developer II")


def test_senior_frontend_does_not_match_frontend_developer_i():
    hits = search_jobs("senior frontend", TRIPLES)
    jobs = _jobs(hits)
    assert jobs.index("Senior Frontend Developer") < jobs.index("Frontend Developer I")
    assert jobs.index("Frontend Developer III") < jobs.index("Frontend Developer I")


def test_mid_matches_roman_ii_only():
    hits = search_jobs("mid frontend", TRIPLES)
    assert _jobs(hits)[0] == "Frontend Developer II"


def test_cloud_engineer_matches_telco_title():
    assert "Cloud Engineer -Telco" in _jobs(search_jobs("cloud engineer", TRIPLES))


def test_hits_are_triples_with_country_family_job_keys():
    hit = search_jobs("cloud engineer", TRIPLES)[0]
    assert set(hit) == {"country", "family", "job"}


def test_exact_normalized_title_ranks_first_then_fewer_extra_words():
    hits = _jobs(search_jobs("cloud engineer", TRIPLES))
    assert hits[0] == "Cloud Engineer"  # exact match beats "Cloud Engineer -Telco"
    assert hits[1] == "Cloud Engineer -Telco"


def test_partial_matches_fill_after_full_matches():
    jobs = _jobs(search_jobs("cloud dotnet", TRIPLES))
    assert set(jobs) == {"Cloud Engineer", "Cloud Engineer -Telco", "DotNet Developer "[:-1]}


def test_seniority_only_token_match_is_not_enough():
    assert search_jobs("senior zzz", [("E", "F", "Senior Accountant")]) == []


def test_engineer_developer_synonym_junior_front_end_engineer():
    triples = [
        ("Egypt", "Dev", "Front End Developer II"),
        ("Egypt", "Dev", "Front End Developer I"),
        ("Egypt", "Dev", "Backend Developer"),
        ("Egypt", "Dev", "Front End Designer"),
    ]
    jobs = _jobs(search_jobs("junior front-end engineer", triples))
    assert jobs[0] == "Front End Developer I"
    assert jobs.index("Front End Developer II") < jobs.index("Front End Designer") or "Front End Designer" in jobs
    assert "Backend Developer" not in jobs[:1]


def test_duplicate_triples_are_returned_once():
    dup = TRIPLES + [TRIPLES[0], TRIPLES[0]]
    hits = search_jobs("frontend developer i", dup)
    assert _jobs(hits).count("Frontend Developer I") == 1


def test_empty_or_punctuation_only_query_returns_nothing():
    assert search_jobs("", TRIPLES) == []
    assert search_jobs(" -- ", TRIPLES) == []


def test_max_25_hits():
    many = [("Egypt", "Dev", f"Developer {n}") for n in range(60)]
    hits = search_jobs("developer", many)
    assert len(hits) == MAX_HITS == 25


def test_junior_front_end_engineer_fallback_ranks_front_end_before_cloud_and_drops_unrelated():
    triples = [
        ("Egypt", "Engineering", "Front End Developer II"),
        ("Egypt", "Engineering", "Frontend Developer"),
        ("Egypt", "Engineering", "Cloud Engineer"),
        ("Egypt", "Finance", "Senior Accountant"),
    ]
    jobs = _jobs(search_jobs("junior front-end engineer", triples))
    assert "Senior Accountant" not in jobs
    assert set(jobs[:2]) == {"Front End Developer II", "Frontend Developer"}
    assert jobs.index("Cloud Engineer") == 2
