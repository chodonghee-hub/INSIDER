"""Step 1. 강점/약점 재해석 프롬프트 템플릿.

PRD 3.1절 설계 원칙: 판정(정상/준임상/임상)은 classifier.py가 이미 끝낸 상태로 전달하고,
LLM은 그 판정 결과를 보호자 친화적 문장으로 표현하는 역할만 담당한다.
"""

import json

from src.classifier import ClinicalLevel, ScaleResult

SCALE_DESCRIPTIONS: dict[str, str] = {
    "위축": "혼자 있으려는 정도, 사회적 위축",
    "신체증상": "특별한 이유 없이 나타나는 신체 불편감",
    "불안/우울": "불안하거나 우울한 정서",
    "사회적미성숙": "또래에 비해 어리게 행동하는 정도",
    "사고문제": "특이한 생각이나 반복 행동",
    "주의집중": "집중력, 산만함, 충동성",
    "비행": "규칙 위반 성향",
    "공격성": "공격적 행동, 반항성",
    "내재화": "위축·불안 등 안으로 향하는 정서 문제 총합",
    "외현화": "비행·공격성 등 밖으로 드러나는 행동 문제 총합",
    "총문제행동": "전체 문제행동 총점",
}

_SYSTEM_INSTRUCTION = """당신은 아동 발달 검사(K-CBCL) 결과를 보호자에게 따뜻하고 이해하기 쉽게 \
설명하는 작가입니다. 아래 원칙을 반드시 지키세요.

1. 이미 정해진 판정(정상/준임상/임상)을 다시 판단하거나 바꾸지 마세요. 표현만 담당합니다.
2. '진단', '치료', '처방', '질환', '장애', '증후군' 같은 임상적 개입을 암시하는 단어는 \
사용하지 마세요.
3. 정상 범위 척도는 아이의 숨겨진 강점/기질로 긍정적으로 재해석하세요.
4. 준임상·임상 범위 척도는 '문제'나 '약점'이라는 단어 대신 \
'현재 에너지가 많이 쓰이는 곳', '관심이 필요한 영역'처럼 순화된 표현을 사용하세요.
5. 기질이나 성향은 지금 시점의 경향성일 뿐 고정된 성격 유형이 아니라는 점을 \
자연스럽게 문장에 녹이세요.
6. 반드시 아래 JSON 스키마와 동일한 구조로만 응답하세요. 다른 설명은 추가하지 마세요.

JSON 스키마:
{
  "strengths": [
    {"scale": "척도명", "trait_theme": "친근한 기질 테마(짧은 별칭)", "description": "일상 언어로 재해석한 설명 2~3문장", "activity_suggestion": "기질에 맞는 가정 내 놀이·취미 제안 1문장"}
  ],
  "attention_areas": [
    {"scale": "척도명", "description": "관심이 필요한 영역을 순화된 표현으로 설명 2~3문장", "home_tip": "가정에서 실천 가능한 케어 방식/상호작용 팁 1문장"}
  ]
}
"""


def _format_scale_line(result: ScaleResult) -> str:
    description = SCALE_DESCRIPTIONS.get(result.scale, "")
    return f"- {result.scale}({description}): T점수 {result.t_score}, 판정 {result.level.value}"


def build_step1_prompt(classified: dict[str, ScaleResult]) -> str:
    """분류 결과를 받아 Step 1 재해석용 LLM 프롬프트 문자열을 생성한다."""
    strengths = [r for r in classified.values() if r.level == ClinicalLevel.NORMAL]
    attention = [r for r in classified.values() if r.level != ClinicalLevel.NORMAL]

    strengths_block = "\n".join(_format_scale_line(r) for r in strengths) or "(해당 없음)"
    attention_block = "\n".join(_format_scale_line(r) for r in attention) or "(해당 없음)"

    user_prompt = f"""아래는 한 아동의 K-CBCL 척도별 판정 결과입니다.

[정상 범위 척도 — 강점으로 재해석할 대상]
{strengths_block}

[준임상/임상 범위 척도 — 관심 필요 영역으로 재해석할 대상]
{attention_block}

위 판정 결과를 바탕으로 시스템 지침의 JSON 스키마에 맞춰 응답하세요."""

    return _SYSTEM_INSTRUCTION + "\n\n" + user_prompt


def parse_step1_response(raw_text: str) -> dict:
    """LLM 응답 텍스트를 JSON으로 파싱한다. 형식 오류 시 예외를 발생시킨다."""
    return json.loads(raw_text)
