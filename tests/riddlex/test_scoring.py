"""score_skills tests, including golden parity with the TS seed applications."""

import json
from pathlib import Path

import pytest

from riddlex.questionnaire import score_skills

GOLDEN = json.loads(
    (Path(__file__).parent / "fixtures" / "ts_golden.json").read_text(encoding="utf-8")
)
APPS = GOLDEN["applications"]


@pytest.mark.parametrize("app", APPS, ids=[a["id"] for a in APPS])
def test_seed_application_scores_match_ts(app):
    assert score_skills(app["skills"]) == app["skillsMatch"]


def test_golden_has_all_seed_applications():
    assert len(APPS) == 10


def test_score_weights_required_double():
    r = [{"required": True, "proficiency": 5}, {"required": False, "proficiency": 1}]
    assert score_skills(r) == round((2 * 1 + 1 * 0.2) / 3 * 100)


def test_empty_is_zero():
    assert score_skills([]) == 0


def test_all_max_and_all_min():
    assert score_skills([{"required": False, "proficiency": 5}] * 3) == 100
    assert score_skills([{"required": True, "proficiency": 1}] * 3) == 20


def test_half_rounds_up_like_js_math_round():
    # 2.5/5 = 0.5 -> 50 exactly; use proficiencies giving x.5 percentages.
    # Two skills, p=1 and p=2 -> mean 0.3 -> 30 (no tie); craft a tie: 1/8 of 100 = 12.5.
    ratings = [{"required": False, "proficiency": p} for p in (5, 0, 0, 0, 0, 0, 0, 0)]
    # earned = 1, total = 8 -> 12.5 -> JS Math.round gives 13 (banker's rounding would give 12)
    assert score_skills(ratings) == 13
    ratings = [{"required": False, "proficiency": p} for p in (5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)]
    # 1/16 = 6.25 -> 6
    assert score_skills(ratings) == 6
    # 3/8 of 100 = 37.5 -> 38 (Python round() would give 38 too; 2.5-type ties differ below)
    ratings = [{"required": False, "proficiency": p} for p in (5, 5, 5, 0, 0, 0, 0, 0)]
    assert score_skills(ratings) == 38
    # 0.5 percent tie: 1/200 -> 0.5 -> 1 (Python round(0.5) == 0)
    ratings = [{"required": False, "proficiency": 5}] + [{"required": False, "proficiency": 0}] * 199
    assert score_skills(ratings) == 1
