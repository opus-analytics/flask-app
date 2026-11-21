"""Pure aggregation for GET /api/user/stats. No DB, no Flask: feed it rows, get the response dict.

Time is UTC. Month keys are "YYYY-MM"; naive datetimes are treated as UTC.
"""
from datetime import datetime, timedelta, timezone

PRODUCTS = ("Start", "Advance", "Enable", "Motivera", "RiddleX")
MONTH_LABELS = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")


def _naive_utc(dt):
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def month_key(dt):
    dt = _naive_utc(dt)
    return f"{dt.year:04d}-{dt.month:02d}"


def shift_month(key, delta):
    year, month = (int(p) for p in key.split("-"))
    idx = year * 12 + (month - 1) + delta
    return f"{idx // 12:04d}-{idx % 12 + 1:02d}"


def month_keys(now, n):
    """n month keys, oldest first, ending with the month of `now`."""
    current = month_key(now)
    return [shift_month(current, -i) for i in range(n - 1, -1, -1)]


def label_for(key):
    return MONTH_LABELS[int(key.split("-")[1]) - 1]


def delta_pct(value, previous):
    if not previous:
        return None
    return round((value - previous) / previous * 100, 1)


def normalise_product(name):
    """Collapse Enable-* to Enable and Motivara/Motivera to Motivera. Blank -> None."""
    raw = (name or "").strip()
    if not raw:
        return None
    low = raw.casefold()
    if low == "enable" or low.startswith("enable-"):
        return "Enable"
    if low in ("motivara", "motivera"):
        return "Motivera"
    return raw


def active_products(sub_rows, now):
    """sub_rows: dicts with subscription, subscription_status, subscription_expiration_date."""
    now = _naive_utc(now)
    products = set()
    for row in sub_rows:
        if (row.get("subscription_status") or "").strip().casefold() != "active":
            continue
        exp = _naive_utc(row.get("subscription_expiration_date"))
        if exp is not None and exp <= now:
            continue
        product = normalise_product(row.get("subscription"))
        if product:
            products.add(product)
    ordered = sorted(products)
    return {"value": len(ordered), "products": ordered}


def _count(events, month, pred):
    return sum(1 for e in events if month_key(e["created_at"]) == month and pred(e))


def _is_feature(e):
    return e.get("event_type") == "feature_use"


def _is_login(e):
    return e.get("event_type") == "login"


def monthly_streak(events, now):
    """Consecutive months with >= 1 event, ending at the current month; if the current month
    has none yet, the streak starts at the previous month."""
    months = {month_key(e["created_at"]) for e in events}
    k = month_key(now)
    if k not in months:
        k = shift_month(k, -1)
    count = 0
    while k in months:
        count += 1
        k = shift_month(k, -1)
    return count


def _scorecard(events, now, pred):
    current = month_key(now)
    previous = shift_month(current, -1)
    value = _count(events, current, pred)
    prev = _count(events, previous, pred)
    return {"value": value, "previous": prev, "deltaPct": delta_pct(value, prev)}


def build_stats(email, full_name, events, sub_rows, tracking_since, now, months=6):
    """Assemble the full /api/user/stats response from raw rows.

    events: dicts with event_type, feature, product, created_at (any order).
    sub_rows: dicts with subscription, subscription_status, subscription_expiration_date.
    tracking_since: datetime or None (earliest user_activity row across all users).
    """
    now = _naive_utc(now)
    keys = month_keys(now, months)

    feature_usage = []
    logins_vs_features = []
    for key in keys:
        row = {"month": key, "label": label_for(key)}
        for product in PRODUCTS:
            row[product] = _count(events, key, lambda e, p=product: _is_feature(e) and e.get("product") == p)
        feature_usage.append(row)
        logins_vs_features.append({
            "month": key,
            "label": label_for(key),
            "logins": _count(events, key, _is_login),
            "features": _count(events, key, _is_feature),
        })

    recent = sorted((e for e in events if _is_feature(e)), key=lambda e: _naive_utc(e["created_at"]), reverse=True)[:10]
    recent_activity = [
        {
            "feature": e.get("feature"),
            "product": e.get("product"),
            "at": _naive_utc(e["created_at"]).isoformat(timespec="milliseconds") + "Z",
        }
        for e in recent
    ]

    return {
        "user": {"email": email, "fullName": full_name},
        "scorecards": {
            "usedFeatures": _scorecard(events, now, _is_feature),
            "activeSubscriptions": active_products(sub_rows, now),
            "monthlyStreak": {"value": monthly_streak(events, now)},
            "logins": _scorecard(events, now, _is_login),
        },
        "featureUsage": feature_usage,
        "loginsVsFeatures": logins_vs_features,
        "recentActivity": recent_activity,
        "trackingSince": (_naive_utc(tracking_since).isoformat(timespec="milliseconds") + "Z") if tracking_since else None,
    }
