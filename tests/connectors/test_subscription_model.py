from opus_api.models.subscriptions import Subscription

NINE = (1, "a@x.com", "RiddleX", "Active", None, None, "res-1", "owner@x.com", "user")


def test_nine_values_construct():
    sub = Subscription(*NINE)
    assert sub.owner == "owner@x.com" and sub.tag == "user"


def test_extra_trailing_columns_are_ignored():
    sub = Subscription(*NINE, 0, 1, "x")
    assert sub.owner == "owner@x.com"


def test_to_dict_has_no_flag_keys():
    d = Subscription(*NINE, 0, 1, "x").to_dict()
    assert "connectors_enabled" not in d and "custom_questions_enabled" not in d
