import json
from pathlib import Path

def test_every_baseline_route_still_registered():
    from app import app
    baseline = json.loads(Path(__file__).with_name("baseline_routes.json").read_text())
    live = {(r.rule, tuple(sorted(r.methods - {"HEAD", "OPTIONS"}))) for r in app.url_map.iter_rules()}
    missing = [b for b in baseline if (b["rule"], tuple(sorted(set(b["methods"]) - {"HEAD", "OPTIONS"}))) not in live]
    assert missing == []
