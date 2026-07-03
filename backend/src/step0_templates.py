"""Step 0. 생애주기 기반 발달 특성 안내 — 정적 템플릿 (LLM 미사용).

PRD 3.3절: 연령대 x 성별 조합의 경우의 수가 제한적이므로 규칙 매칭만으로 처리한다.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AgeBand:
    min_age: int
    max_age: int
    label: str


AGE_BANDS = (
    AgeBand(4, 6, "유아기"),
    AgeBand(7, 9, "초등 저학년"),
    AgeBand(10, 12, "초등 고학년"),
)

_TEMPLATES: dict[tuple[str, str], str] = {
    ("유아기", "male"): (
        "이 나이대 남자아이들은 몸으로 에너지를 표현하고 규칙보다 흥미를 먼저 따르는 시기입니다. "
        "낯선 환경에서 떼를 쓰거나 산만해 보이는 모습도 이 시기 발달 과정에서 자연스럽게 나타났다가 "
        "성장하며 점차 조절 능력이 자리 잡습니다."
    ),
    ("유아기", "female"): (
        "이 나이대 여자아이들은 감정 표현이 풍부해지고 또래 관계에 관심이 커지는 시기입니다. "
        "작은 일에도 예민하게 반응하거나 낯가림이 심해지는 모습은 이 시기 발달 과정에서 흔히 나타나며, "
        "시간이 지나며 자연스럽게 안정됩니다."
    ),
    ("초등 저학년", "male"): (
        "이 나이대 남자아이들은 학교라는 새로운 환경에 적응하며 행동 변동성이 큰 시기입니다. "
        "규칙을 따르는 것과 자기 뜻대로 하고 싶은 마음 사이에서 부딪히는 모습이 흔히 나타나며, "
        "이런 특성들은 발달 과정에서 자연스럽게 변할 수 있습니다."
    ),
    ("초등 저학년", "female"): (
        "이 나이대 여자아이들은 학교라는 새로운 환경에 적응하며 친구 관계와 평가에 민감해지는 시기입니다. "
        "작은 실수에도 걱정이 많아지거나 위축되는 모습이 나타날 수 있으며, "
        "이런 특성들은 발달 과정에서 자연스럽게 변할 수 있습니다."
    ),
    ("초등 고학년", "male"): (
        "이 나이대 남자아이들은 또래 집단 안에서의 위치와 인정에 민감해지는 시기입니다. "
        "감정을 말보다 행동으로 먼저 표현하는 경우가 많으며, "
        "이런 특성들은 자아가 성장하는 과정에서 자연스럽게 변할 수 있습니다."
    ),
    ("초등 고학년", "female"): (
        "이 나이대 여자아이들은 신체적·정서적 변화가 함께 시작되며 자기 자신과 관계에 대한 고민이 깊어지는 시기입니다. "
        "기분 기복이 커지거나 예민해지는 모습이 나타날 수 있으며, "
        "이런 특성들은 자아가 성장하는 과정에서 자연스럽게 변할 수 있습니다."
    ),
}

_DEFAULT_MESSAGE = (
    "아이들은 저마다의 속도로 성장하며, 특정 시기에 나타나는 행동 변화는 대부분 "
    "발달 과정에서 자연스럽게 지나가는 특성입니다."
)


def _resolve_age_band(age: int) -> AgeBand | None:
    for band in AGE_BANDS:
        if band.min_age <= age <= band.max_age:
            return band
    return None


def get_step0_message(age: int, gender: str) -> str:
    """연령·성별 조합에 맞는 생애주기 발달 특성 안내 문구를 반환한다."""
    band = _resolve_age_band(age)
    if band is None:
        return _DEFAULT_MESSAGE
    return _TEMPLATES.get((band.label, gender), _DEFAULT_MESSAGE)
