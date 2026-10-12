"""Pure unit tests: value parsing, experience canonicalisation/sort, series building, meta. No DB, no app import."""
from salaries.presentation import (
    build_chart,
    build_meta,
    build_series,
    canonical_experience,
    count_data_points,
    is_valid_amount,
    parse_salary,
    sort_experience,
)


# --- value parsing ---
def test_parse_salary_formats():
    assert parse_salary("213,216") == 213216.0
    assert parse_salary("900000.0") == 900000.0
    assert parse_salary("3,600,000.00") == 3600000.0


def test_parse_salary_no_data():
    for raw in (None, "", "   ", "0.00", "0", "abc", "1.2.3", "."):
        assert parse_salary(raw) is None, raw


# --- experience canonicalisation / sort ---
def test_canonical_experience_keeps_words_readable():
    assert canonical_experience("Assistant Manager") == "Assistant Manager"
    assert canonical_experience("Partner (1-4 yrs)") == "Partner (1-4 yrs)"
    assert canonical_experience("Partner  (5 +  years)") == "Partner (5+years)"


def test_canonical_experience_removes_operator_whitespace():
    assert canonical_experience("2 - 3") == "2-3"
    assert canonical_experience(" > 10") == ">10"
    assert canonical_experience("\t0 - 1") == "0-1"


def test_canonical_experience_seniority_levels_keep_words_and_spacing():
    assert canonical_experience("15 -17") == "15-17"
    assert canonical_experience("Partner (1-4 years)") == "Partner (1-4 years)"
    assert canonical_experience("Partner (5+ years)") == "Partner (5+years)"
    assert canonical_experience("Assistant Manager") == "Assistant Manager"


def test_sort_experience_by_leading_number_dedupes_and_puts_non_numeric_last():
    raw = ["10+", ">10", "2-3", "0-1", "n/a", "2 - 3", " 5 - 6 "]
    assert sort_experience(raw) == ["0-1", "2-3", "5-6", "10+", ">10", "n/a"]


def test_null_blank_and_dash_experience_are_one_canonical_value_sorted_last():
    for raw in (None, "", "   ", "-", " - "):
        assert canonical_experience(raw) == "-", repr(raw)
    raw = [None, "2-3", " - ", "", "-", "n/a", "0-1"]
    assert sort_experience(raw) == ["0-1", "2-3", "n/a", "-"]


# --- series building ---
def _row(**cols):
    base = {f"{p}_{yy}": None for p in ("H", "L") for yy in range(20, 27)}
    base.update(cols)
    return base


def test_series_basic_shape_sorted_by_year_with_min_max():
    rows = [_row(H_22="1200", L_22="1000", H_20="500", L_20="400")]
    assert build_series(rows) == [
        {"year": 2020, "min": 400, "max": 500},
        {"year": 2022, "min": 1000, "max": 1200},
    ]


def test_series_egypt_divides_by_12_before_rounding():
    rows = [_row(H_26="120000", L_26="60000")]
    assert build_series(rows, divide_by=12) == [{"year": 2026, "min": 5000, "max": 10000}]


def test_series_rounds_after_division():
    rows = [_row(H_26="100", L_26="50")]
    # 100/12 = 8.33 -> 8 ; 50/12 = 4.17 -> 4
    assert build_series(rows, divide_by=12) == [{"year": 2026, "min": 4, "max": 8}]


def test_series_duplicate_rows_are_averaged_per_year():
    rows = [_row(H_24="100", L_24="50"), _row(H_24="300", L_24="150")]
    assert build_series(rows) == [{"year": 2024, "min": 100, "max": 200}]


def test_series_duplicate_rows_ignore_rows_without_data_for_that_year():
    rows = [_row(H_24="100", L_24="50"), _row(H_24="300", L_24="0.00")]
    assert build_series(rows) == [{"year": 2024, "min": 50, "max": 100}]


def test_series_zero_and_null_years_are_skipped():
    rows = [_row(H_21="0.00", L_21="0.00", H_22="1000", L_22=None, H_23="2000", L_23="1500")]
    assert build_series(rows) == [{"year": 2023, "min": 1500, "max": 2000}]


def test_series_skips_year_when_either_value_missing():
    rows = [_row(H_25="9000", L_25="")]
    assert build_series(rows) == []


def test_series_all_zero_row_gives_empty_list():
    rows = [_row(H_20="0.00", L_20="0.00", H_26="0", L_26="0")]
    assert build_series(rows) == []


def test_series_includes_2026_columns():
    rows = [_row(H_26="3,600,000.00", L_26="2,000,000.00")]
    assert build_series(rows) == [{"year": 2026, "min": 2000000, "max": 3600000}]


# --- meta / chart ---
def test_meta_egypt_has_country_note_then_percentiles():
    meta = build_meta("Egypt", "Software Development", "Frontend Developer I", "2-3")
    assert meta["currency"] == "EGP"
    assert meta["basis"] == "Net"
    assert meta["period"] == "month"
    assert meta["yAxisLabel"] == "Salary in EGP/month NET"
    assert meta["notes"][0] == "Numbers being presented are in EGP, in 'Net' values. Net meaning the 'take home'."
    assert meta["notes"][1].startswith("Minimum represents the 50th percentile")
    assert meta["notes"][2].startswith("Maximum represents the 90th percentile")
    assert len(meta["notes"]) == 3


def test_meta_default_country_is_usd_with_only_percentile_notes():
    meta = build_meta("Atlantis", "F", "J", "0-1")
    assert meta["currency"] == "USD"
    assert meta["basis"] == "Gross"
    assert meta["yAxisLabel"] == "Salary in $/month"
    assert len(meta["notes"]) == 2


def test_meta_new_usd_countries_have_null_basis_and_no_none_text():
    import json

    for country in ("Ghana", "Kenya", "Nigeria", "Rwanda", "Uganda", "Mauritius"):
        meta = build_meta(country, "F", "J", "-")
        assert meta["currency"] == "USD", country
        assert meta["basis"] is None, country
        assert meta["yAxisLabel"] == "Salary in $/month", country
        assert meta["period"] == "month", country
        assert len(meta["notes"]) == 2, country
        assert "None" not in json.dumps(meta), country
        assert json.loads(json.dumps(meta))["basis"] is None, country


def test_meta_egypt_saudi_uae_unchanged():
    egypt = build_meta("Egypt", "F", "J", "2-3")
    assert (egypt["currency"], egypt["basis"], egypt["yAxisLabel"]) == ("EGP", "Net", "Salary in EGP/month NET")
    assert len(egypt["notes"]) == 3

    saudi = build_meta("Saudi Arabia", "F", "J", "2-3")
    assert (saudi["currency"], saudi["basis"], saudi["yAxisLabel"]) == ("SAR", "Gross", "Salary in SAR/month Gross")
    assert saudi["notes"] == [
        "Numbers being presented are in Saudi Riyals, in 'Gross' values.",
        "Minimum represents the 50th percentile of the data being presented.",
        "Maximum represents the 90th percentile of the data being presented.",
    ]

    uae = build_meta("UAE", "F", "J", "2-3")
    assert (uae["currency"], uae["basis"], uae["yAxisLabel"]) == ("AED", "Gross", "Salary in AED/month Gross")
    assert uae["notes"][0] == "Numbers being presented are in UAE Dirhams (AED), in 'Gross' values."
    assert len(uae["notes"]) == 3


def test_build_chart_applies_country_divide_by():
    rows = [_row(H_26="120000", L_26="60000")]
    chart = build_chart(rows, "Egypt", "F", "J", "2-3")
    assert chart["series"] == [{"year": 2026, "min": 5000, "max": 10000}]
    assert chart["meta"]["jobTitle"] == "J"
    assert chart["meta"]["experience"] == "2-3"


def test_build_chart_uae_is_not_divided():
    rows = [_row(H_26="120000", L_26="60000")]
    chart = build_chart(rows, "UAE", "F", "J", "2-3")
    assert chart["series"] == [{"year": 2026, "min": 60000, "max": 120000}]
    assert chart["meta"]["currency"] == "AED"
    assert chart["meta"]["yAxisLabel"] == "Salary in AED/month Gross"


def test_saudi_arabia_is_not_divided():
    rows = [_row(H_26="120000", L_26="60000")]
    chart = build_chart(rows, "Saudi Arabia", "F", "J", "2-3")
    assert chart["series"] == [{"year": 2026, "min": 60000, "max": 120000}]


# --- data points scorecard ---
def test_is_valid_amount_accepts_real_amounts():
    for raw in ("213,216", "900000.0", " 5 ", 1200, "1"):
        assert is_valid_amount(raw) is True, raw


def test_is_valid_amount_rejects_null_zero_dash_and_bands():
    for raw in (None, "", "   ", "0", "0.00", " - ", "-", "5-10", "2 - 3", "abc", "1.2.3", "."):
        assert is_valid_amount(raw) is False, repr(raw)


def test_count_data_points_multi_year_row_counts_each_year_once():
    rows = [_row(H_20="500", L_20="400", H_22="1200", L_22="1000", H_26="3,600,000", L_26="2,000,000")]
    assert count_data_points(rows) == 3


def test_count_data_points_h_only_or_l_only_year_counts_once():
    rows = [_row(H_21="500", L_21=None), _row(H_21=None, L_21="400"), _row(H_22="1", L_22="2")]
    assert count_data_points(rows) == 3


def test_count_data_points_sums_across_rows_per_year():
    rows = [_row(H_24="100", L_24="50"), _row(H_24="300", L_24="150"), _row(H_25="9", L_25="8")]
    assert count_data_points(rows) == 3


def test_count_data_points_ignores_zero_dash_null_and_band_values():
    rows = [
        _row(H_20="0", L_20="0.00", H_21=" - ", L_21=" - ", H_22=None, L_22="", H_23="5-10", L_23="5-10"),
        _row(H_24="0.00", L_24=None, H_25="5-10", L_25=" - "),
    ]
    assert count_data_points(rows) == 0


def test_count_data_points_band_in_h_but_amount_in_l_still_counts():
    rows = [_row(H_20="5-10", L_20="400")]
    assert count_data_points(rows) == 1


def test_count_data_points_empty_list_is_zero():
    assert count_data_points([]) == 0


# --- South Africa label ---
def test_south_africa_axis_label_is_zar_and_currency_unchanged():
    meta = build_meta("South Africa", "F", "J", "2-3")
    assert meta["yAxisLabel"] == "Salary in ZAR/month"
    assert meta["currency"] == "ZAR"
    assert meta["basis"] == "Gross"
    assert "Rand" not in meta["yAxisLabel"]


# --- inverted H < L guard ---
def test_series_normal_row_unchanged_by_inversion_guard():
    rows = [_row(H_25="2123699", L_25="2085777")]
    assert build_series(rows) == [{"year": 2025, "min": 2085777, "max": 2123699}]


def test_series_inverted_row_is_swapped_to_min_max():
    rows = [_row(H_25="2085777", L_25="2123699")]
    assert build_series(rows) == [{"year": 2025, "min": 2085777, "max": 2123699}]


def test_series_inverted_row_keeps_year_and_other_years_untouched():
    rows = [_row(H_24="2085777", L_24="2123699", H_25="900", L_25="400")]
    assert build_series(rows) == [
        {"year": 2024, "min": 2085777, "max": 2123699},
        {"year": 2025, "min": 400, "max": 900},
    ]


def test_series_inverted_row_swapped_after_egypt_division_and_rounding():
    rows = [_row(H_26="60000", L_26="120000")]
    assert build_series(rows, divide_by=12) == [{"year": 2026, "min": 5000, "max": 10000}]


def test_build_chart_egypt_inverted_row_has_min_not_above_max():
    rows = [_row(H_26="60000", L_26="120000")]
    chart = build_chart(rows, "Egypt", "F", "J", "2-3")
    assert chart["series"] == [{"year": 2026, "min": 5000, "max": 10000}]


def test_series_duplicate_rows_still_averaged_when_one_row_is_inverted():
    # high avg = (3000 + 1000) / 2 = 2000; low avg = (1000 + 2000) / 2 = 1500
    rows = [_row(H_23="3000", L_23="1000"), _row(H_23="1000", L_23="2000")]
    assert build_series(rows) == [{"year": 2023, "min": 1500, "max": 2000}]
