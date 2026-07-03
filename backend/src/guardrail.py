"""출력 전 가드레일 — 금지어 필터링 + 면책 문구 삽입 (PRD 3.3, 5장).

LLM이 프롬프트 지시를 100% 따른다고 보장할 수 없으므로,
코드 레벨의 후처리 검증을 별도로 둔다 (LLM 신뢰 대신 검증).
"""

import re

# 임상적 개입(진단·치료·처방)으로 오인될 수 있는 표현. 발견 시 중립적 표현으로 치환한다.
FORBIDDEN_TERMS: dict[str, str] = {
    "진단": "특성 확인",
    "치료": "케어",
    "처방": "제안",
    "질환": "특성",
    "장애": "경향",
    "증후군": "경향",
}

DISCLAIMER = (
    "이 리포트는 검사 결과를 이해하기 쉽게 풀어 설명하는 사전 안내 자료이며, "
    "임상적 진단이나 치료 방향을 제시하지 않습니다. 정확한 평가와 상담은 배정된 상담사와의 "
    "전화 상담을 통해 확인해 주세요."
)


def find_forbidden_terms(text: str) -> list[str]:
    """텍스트에 포함된 금지어 목록을 반환한다."""
    return [term for term in FORBIDDEN_TERMS if term in text]


def sanitize_text(text: str) -> str:
    """금지어를 중립적인 표현으로 치환한다."""
    sanitized = text
    for term, replacement in FORBIDDEN_TERMS.items():
        sanitized = re.sub(re.escape(term), replacement, sanitized)
    return sanitized


def _sanitize_value(value):
    if isinstance(value, str):
        return sanitize_text(value)
    if isinstance(value, list):
        return [_sanitize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _sanitize_value(item) for key, item in value.items()}
    return value


def apply_guardrail(report: dict) -> dict:
    """리포트 전체의 금지어를 치환하고 면책 문구를 삽입한다."""
    sanitized = _sanitize_value(report)
    sanitized["disclaimer"] = DISCLAIMER
    return sanitized
