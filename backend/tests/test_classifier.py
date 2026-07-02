import pytest

from src.classifier import ClinicalLevel, classify_all, classify_score


@pytest.mark.parametrize(
    "t_score, expected",
    [
        (59, ClinicalLevel.NORMAL),
        (60, ClinicalLevel.BORDERLINE),
        (63, ClinicalLevel.BORDERLINE),
        (64, ClinicalLevel.CLINICAL),
    ],
)
def test_composite_scale_boundaries(t_score, expected):
    result = classify_score("총문제행동", t_score)
    assert result.level == expected


@pytest.mark.parametrize(
    "t_score, expected",
    [
        (64, ClinicalLevel.NORMAL),
        (65, ClinicalLevel.BORDERLINE),
        (69, ClinicalLevel.BORDERLINE),
        (70, ClinicalLevel.CLINICAL),
    ],
)
def test_syndrome_scale_boundaries(t_score, expected):
    result = classify_score("주의집중", t_score)
    assert result.level == expected


def test_unknown_scale_raises():
    with pytest.raises(ValueError):
        classify_score("존재하지않는척도", 50)


def test_classify_all_returns_result_per_scale():
    scores = {"위축": 50, "공격성": 72, "총문제행동": 61}
    results = classify_all(scores)

    assert results["위축"].level == ClinicalLevel.NORMAL
    assert results["공격성"].level == ClinicalLevel.CLINICAL
    assert results["총문제행동"].level == ClinicalLevel.BORDERLINE
