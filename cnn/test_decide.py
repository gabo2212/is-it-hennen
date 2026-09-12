"""Regression: a stranger with an overconfident head must not become HENNEN."""

from cnn.predict import decide_hennen


def test_stranger_head_cannot_override_low_cosine() -> None:
    # Last live miss: cosine 0.30 vs cut 0.61, tiny head 0.999 → old blend 57%.
    is_hennen, p = decide_hennen(cosine=0.3029, head_p=0.9993, threshold=0.6097)
    assert is_hennen is False
    assert p < 0.5


def test_real_hennen_still_passes() -> None:
    is_hennen, p = decide_hennen(cosine=0.70, head_p=0.99, threshold=0.61)
    assert is_hennen is True
    assert p > 0.5


if __name__ == "__main__":
    test_stranger_head_cannot_override_low_cosine()
    test_real_hennen_still_passes()
    print("ok")
