from datetime import datetime, timedelta

from user_stats import service as s

NOW = datetime(2026, 10, 13, 10, 15)


def ev(event_type, when, feature=None, product=None):
    return {"event_type": event_type, "feature": feature, "product": product, "created_at": when}


def test_month_keys_zero_fill_oldest_first():
    keys = s.month_keys(NOW, 6)
    assert keys == ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]
    assert [s.label_for(k) for k in keys] == ["May", "Jun", "Jul", "Aug", "Sep", "Oct"]


def test_month_keys_cross_january_and_december():
    assert s.month_keys(datetime(2026, 1, 5), 3) == ["2025-11", "2025-12", "2026-01"]
    assert s.month_keys(datetime(2026, 12, 31, 23, 59), 2) == ["2026-11", "2026-12"]


def test_month_boundary_uses_utc_calendar_month():
    assert s.month_key(datetime(2026, 1, 1, 0, 30)) == "2026-01"
    assert s.month_key(datetime(2025, 12, 31, 23, 59, 59)) == "2025-12"


def test_delta_pct_null_when_previous_zero():
    assert s.delta_pct(5, 0) is None
    assert s.delta_pct(0, 0) is None


def test_delta_pct_rounded():
    assert s.delta_pct(12, 8) == 50.0
    assert s.delta_pct(9, 4) == 125.0
    assert s.delta_pct(2, 3) == -33.3


def test_used_features_and_logins_scorecards():
    events = [
        ev("feature_use", datetime(2026, 10, 2), "resume_analyze", "Start"),
        ev("feature_use", datetime(2026, 10, 3), "salary_chart", "Advance"),
        ev("login", datetime(2026, 10, 3)),
        ev("feature_use", datetime(2026, 9, 30, 23, 59), "resume_analyze", "Start"),
        ev("login", datetime(2026, 9, 1)),
        ev("login", datetime(2026, 9, 2)),
    ]
    out = s.build_stats("u@x.com", "U", events, [], None, NOW)
    assert out["scorecards"]["usedFeatures"] == {"value": 2, "previous": 1, "deltaPct": 100.0}
    assert out["scorecards"]["logins"] == {"value": 1, "previous": 2, "deltaPct": -50.0}


def test_previous_zero_gives_null_delta_in_scorecard():
    events = [ev("feature_use", datetime(2026, 10, 1), "x", "Start")]
    out = s.build_stats("u@x.com", None, events, [], None, NOW)
    assert out["scorecards"]["usedFeatures"]["deltaPct"] is None
    assert out["scorecards"]["logins"] == {"value": 0, "previous": 0, "deltaPct": None}


def test_streak_starts_from_previous_month_when_current_empty():
    events = [
        ev("login", datetime(2026, 7, 4)),
        ev("login", datetime(2026, 8, 4)),
        ev("feature_use", datetime(2026, 9, 9), "x", "Start"),
    ]
    assert s.monthly_streak(events, NOW) == 3  # Sep, Aug, Jul; Oct has nothing yet


def test_streak_counts_current_month_and_stops_at_gap():
    events = [
        ev("login", datetime(2026, 6, 4)),
        ev("login", datetime(2026, 8, 4)),
        ev("login", datetime(2026, 9, 4)),
        ev("login", datetime(2026, 10, 1)),
    ]
    assert s.monthly_streak(events, NOW) == 3  # Oct, Sep, Aug; Jul missing


def test_streak_zero_without_events():
    assert s.monthly_streak([], NOW) == 0


def test_streak_across_year_boundary():
    events = [ev("login", datetime(2025, 12, 1)), ev("login", datetime(2026, 1, 1))]
    assert s.monthly_streak(events, datetime(2026, 1, 15)) == 2


def test_feature_usage_zero_filled_and_ignores_unknown_products():
    events = [
        ev("feature_use", datetime(2026, 10, 1), "a", "Start"),
        ev("feature_use", datetime(2026, 10, 2), "b", "Start"),
        ev("feature_use", datetime(2026, 9, 2), "c", "RiddleX"),
        ev("feature_use", datetime(2026, 9, 3), "d", None),
        ev("feature_use", datetime(2026, 9, 4), "e", "Other"),
    ]
    out = s.build_stats("u@x.com", None, events, [], None, NOW, months=3)
    fu = out["featureUsage"]
    assert [r["month"] for r in fu] == ["2026-08", "2026-09", "2026-10"]
    assert fu[0] == {"month": "2026-08", "label": "Aug", "Start": 0, "Advance": 0, "Enable": 0, "Motivera": 0, "RiddleX": 0}
    assert fu[1]["RiddleX"] == 1 and fu[1]["Start"] == 0
    assert fu[2]["Start"] == 2
    # NULL / unknown products are left out of the chart but still counted in usedFeatures.
    assert out["scorecards"]["usedFeatures"]["previous"] == 3


def test_logins_vs_features_series():
    events = [
        ev("login", datetime(2026, 10, 1)),
        ev("feature_use", datetime(2026, 10, 1), "a", None),
        ev("feature_use", datetime(2026, 8, 1), "a", "Enable"),
    ]
    out = s.build_stats("u@x.com", None, events, [], None, NOW, months=3)
    assert out["loginsVsFeatures"] == [
        {"month": "2026-08", "label": "Aug", "logins": 0, "features": 1},
        {"month": "2026-09", "label": "Sep", "logins": 0, "features": 0},
        {"month": "2026-10", "label": "Oct", "logins": 1, "features": 1},
    ]


def test_months_series_length_and_order_across_december():
    out = s.build_stats("u@x.com", None, [], [], None, datetime(2026, 2, 3), months=12)
    months = [r["month"] for r in out["featureUsage"]]
    assert len(months) == 12
    assert months[0] == "2025-03" and months[-1] == "2026-02"
    assert len(out["loginsVsFeatures"]) == 12


def test_subscriptions_collapse_normalise_and_expiry():
    rows = [
        {"subscription": "Enable-Contributor", "subscription_status": "Active", "subscription_expiration_date": None},
        {"subscription": "Enable-Admin", "subscription_status": "Active", "subscription_expiration_date": NOW + timedelta(days=5)},
        {"subscription": "Motivara", "subscription_status": "Active", "subscription_expiration_date": None},
        {"subscription": "Start", "subscription_status": "Active", "subscription_expiration_date": NOW - timedelta(days=1)},
        {"subscription": "Advance", "subscription_status": "Suspended", "subscription_expiration_date": None},
        {"subscription": "RiddleX", "subscription_status": "Active", "subscription_expiration_date": NOW + timedelta(days=30)},
    ]
    assert s.active_products(rows, NOW) == {"value": 3, "products": ["Enable", "Motivera", "RiddleX"]}


def test_subscriptions_empty():
    assert s.active_products([], NOW) == {"value": 0, "products": []}


def test_recent_activity_feature_only_newest_first_capped_at_10():
    events = [ev("feature_use", NOW - timedelta(minutes=i), f"f{i}", "Start") for i in range(12)]
    events.append(ev("login", NOW))
    out = s.build_stats("u@x.com", None, events, [], None, NOW)
    assert len(out["recentActivity"]) == 10
    assert out["recentActivity"][0] == {"feature": "f0", "product": "Start", "at": "2026-10-13T10:15:00.000Z"}


def test_tracking_since_iso_or_null():
    assert s.build_stats("u", None, [], [], None, NOW)["trackingSince"] is None
    out = s.build_stats("u", None, [], [], datetime(2026, 10, 13, 8), NOW)
    assert out["trackingSince"] == "2026-10-13T08:00:00.000Z"
