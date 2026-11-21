from opus_api.models.subscriptions import Subscription

NINE = (1, "a@x.com", "RiddleX", "Active", None, None, "res-1", "owner@x.com", "user")


def test_nine_values_construct_with_default_flag():
    sub = Subscription(*NINE)
    assert sub.connectors_enabled == 1


def test_trailing_column_is_read():
    assert Subscription(*NINE, 0).connectors_enabled == 0


def test_extra_trailing_columns_are_ignored():
    assert Subscription(*NINE, 1, "extra").connectors_enabled == 1


def test_non_int_trailing_value_does_not_crash():
    assert Subscription(*NINE, "garbage").connectors_enabled == 1


def test_to_dict_includes_flag():
    assert Subscription(*NINE, 0).to_dict()["connectors_enabled"] == 0
