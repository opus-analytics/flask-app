"""Salary chart presentation: per-country config, value/experience parsing, series building."""
import re

# Year -> (max column, min column). H = max, L = min. Read BY COLUMN NAME.
YEAR_COLUMNS = {2000 + yy: (f"H_{yy}", f"L_{yy}") for yy in range(20, 27)}

PERIOD = "month"

PERCENTILE_NOTES = [
    "Minimum represents the 50th percentile of the data being presented.",
    "Maximum represents the 90th percentile of the data being presented.",
]

COUNTRY_CONFIG = {
    "Egypt": {
        "currency": "EGP", "basis": "Net", "divide_by": 12,
        "y_axis_label": "Salary in EGP/month NET",
        "country_note": "Numbers being presented are in EGP, in 'Net' values. Net meaning the 'take home'.",
    },
    "Saudi Arabia": {
        "currency": "SAR", "basis": "Gross", "divide_by": 1,
        "y_axis_label": "Salary in SAR/month Gross",
        "country_note": "Numbers being presented are in Saudi Riyals, in 'Gross' values.",
    },
    "UAE": {
        "currency": "AED", "basis": "Gross", "divide_by": 1,
        "y_axis_label": "Salary in AED/month Gross",
        "country_note": "Numbers being presented are in UAE Dirhams (AED), in 'Gross' values.",
    },
    "South Africa": {
        "currency": "ZAR", "basis": "Gross", "divide_by": 1,
        "y_axis_label": "Salary in ZAR/month", "country_note": None,
    },
    "Ghana": {
        "currency": "USD", "basis": None, "divide_by": 1,
        "y_axis_label": "Salary in $/month", "country_note": None,
    },
    "Kenya": {
        "currency": "USD", "basis": None, "divide_by": 1,
        "y_axis_label": "Salary in $/month", "country_note": None,
    },
    "Nigeria": {
        "currency": "USD", "basis": None, "divide_by": 1,
        "y_axis_label": "Salary in $/month", "country_note": None,
    },
    "Rwanda": {
        "currency": "USD", "basis": None, "divide_by": 1,
        "y_axis_label": "Salary in $/month", "country_note": None,
    },
    "Uganda": {
        "currency": "USD", "basis": None, "divide_by": 1,
        "y_axis_label": "Salary in $/month", "country_note": None,
    },
    "Mauritius": {
        "currency": "USD", "basis": None, "divide_by": 1,
        "y_axis_label": "Salary in $/month", "country_note": None,
    },
    "default": {
        "currency": "USD", "basis": "Gross", "divide_by": 1,
        "y_axis_label": "Salary in $/month", "country_note": None,
    },
}

# Canonical value for jobs with no experience band (NULL, blank or "-" in the DB). Sorted last.
NO_EXPERIENCE = "-"

_EXP_OPERATOR_SPACES = re.compile(r"\s*([-<>+])\s*")
_LEADING_NUMBER = re.compile(r"\d+(?:\.\d+)?")


def country_config(country):
    return COUNTRY_CONFIG.get(country, COUNTRY_CONFIG["default"])


def build_meta(country, family, job_title, experience):
    cfg = country_config(country)
    notes = ([cfg["country_note"]] if cfg["country_note"] else []) + PERCENTILE_NOTES
    return {
        "country": country,
        "family": family,
        "jobTitle": job_title,
        "experience": experience,
        "currency": cfg["currency"],
        "basis": cfg["basis"],
        "period": PERIOD,
        "yAxisLabel": cfg["y_axis_label"],
        "notes": notes,
    }


def parse_salary(raw):
    """'213,216' -> 213216.0, '900000.0' -> 900000.0. NULL/empty/unparsable/<=0 -> None (no data)."""
    if raw is None:
        return None
    text = "".join(ch for ch in str(raw) if ch in "0123456789.")
    if not text:
        return None
    try:
        value = float(text)
    except ValueError:
        return None
    return value if value > 0 else None


_AMOUNT_TEXT = re.compile(r"[\d,.\s]+")


def is_valid_amount(raw):
    """True for a real salary amount: digits/commas/dots/spaces only, and parses to a number > 0.
    Rejects NULL, blank, ' - ', '0', '0.00' and text bands such as '5-10'."""
    if raw is None:
        return False
    text = str(raw).strip()
    if not _AMOUNT_TEXT.fullmatch(text):
        return False
    return parse_salary(text) is not None


def count_data_points(rows):
    """Each (row, year) that has a valid H or L amount counts once, across YEAR_COLUMNS."""
    count = 0
    for row in rows:
        for h_col, l_col in YEAR_COLUMNS.values():
            if is_valid_amount(row.get(h_col)) or is_valid_amount(row.get(l_col)):
                count += 1
    return count


def canonical_experience(value):
    """Trim, collapse whitespace, drop spaces around - > < +: '2 - 3' -> '2-3', ' > 10' -> '>10'.
    NULL, blank and '-' all become NO_EXPERIENCE ('-')."""
    text = " ".join(str(value or "").split())
    if text in ("", NO_EXPERIENCE):
        return NO_EXPERIENCE
    return _EXP_OPERATOR_SPACES.sub(lambda m: m.group(1), text)


def sort_experience(values):
    """Distinct canonical experience values, by leading number; '>N' after plain 'N-...'; non-numeric next;
    NO_EXPERIENCE ('-') last."""
    unique = {canonical_experience(v) for v in values}

    def key(v):
        if v == NO_EXPERIENCE:
            return (2, 0.0, 0, v)
        match = _LEADING_NUMBER.search(v)
        if not match:
            return (1, 0.0, 0, v)
        return (0, float(match.group()), 1 if v.startswith(">") else 0, v)

    return sorted(unique, key=key)


def build_series(rows, divide_by=1):
    """Per year: average valid (H, L) pairs across duplicate rows, divide, round. Years with no pair are skipped.
    If the source has L > H for a year, the two values are swapped so the output always has min <= max."""
    series = []
    for year in sorted(YEAR_COLUMNS):
        h_col, l_col = YEAR_COLUMNS[year]
        highs, lows = [], []
        for row in rows:
            high = parse_salary(row.get(h_col))
            low = parse_salary(row.get(l_col))
            if high is None or low is None:
                continue
            highs.append(high)
            lows.append(low)
        if not highs:
            continue
        low_out = round(sum(lows) / len(lows) / divide_by)
        high_out = round(sum(highs) / len(highs) / divide_by)
        if low_out > high_out:
            low_out, high_out = high_out, low_out
        series.append({"year": year, "min": low_out, "max": high_out})
    return series


def build_chart(rows, country, family, job_title, experience):
    cfg = country_config(country)
    return {
        "meta": build_meta(country, family, job_title, experience),
        "series": build_series(rows, cfg["divide_by"]),
    }
