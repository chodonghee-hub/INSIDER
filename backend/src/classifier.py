"""K-CBCL T점수 규칙 기반 분류기.

PRD 3.1절 설계 원칙: 판정은 규칙, 표현은 LLM.
- 복합척도(총문제행동/내재화/외현화): 정상 T<60, 준임상 60~63, 임상 T>=64
- 하위척도(위축/신체증상/불안-우울/사회적미성숙/사고문제/주의집중/비행/공격성):
  정상 T<65, 준임상 65~69, 임상 T>=70
"""

from dataclasses import dataclass
from enum import Enum


class ClinicalLevel(str, Enum):
    NORMAL = "정상"
    BORDERLINE = "준임상"
    CLINICAL = "임상"


COMPOSITE_SCALES = ("총문제행동", "내재화", "외현화")

SYNDROME_SCALES = (
    "위축",
    "신체증상",
    "불안/우울",
    "사회적미성숙",
    "사고문제",
    "주의집중",
    "비행",
    "공격성",
)


@dataclass(frozen=True)
class ScaleResult:
    scale: str
    t_score: float
    level: ClinicalLevel


def _classify_composite(t_score: float) -> ClinicalLevel:
    if t_score < 60:
        return ClinicalLevel.NORMAL
    if t_score <= 63:
        return ClinicalLevel.BORDERLINE
    return ClinicalLevel.CLINICAL


def _classify_syndrome(t_score: float) -> ClinicalLevel:
    if t_score < 65:
        return ClinicalLevel.NORMAL
    if t_score < 70:
        return ClinicalLevel.BORDERLINE
    return ClinicalLevel.CLINICAL


def classify_score(scale: str, t_score: float) -> ScaleResult:
    """단일 척도의 T점수를 정상/준임상/임상으로 판정한다."""
    if scale in COMPOSITE_SCALES:
        level = _classify_composite(t_score)
    elif scale in SYNDROME_SCALES:
        level = _classify_syndrome(t_score)
    else:
        raise ValueError(f"알 수 없는 척도명: {scale}")
    return ScaleResult(scale=scale, t_score=t_score, level=level)


def classify_all(scores: dict[str, float]) -> dict[str, ScaleResult]:
    """{척도명: T점수} 딕셔너리를 받아 척도별 판정 결과를 반환한다."""
    return {scale: classify_score(scale, t_score) for scale, t_score in scores.items()}
