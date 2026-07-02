"""분류 결과 + LLM 호출 -> 최종 리포트 조립 (PRD 3.2절 파이프라인).

CBCL 원본 데이터 -> 규칙 기반 분류기 -> LLM 프롬프트 생성 -> 리포트 텍스트 생성
-> 가드레일 필터링 -> 최종 리포트 출력
"""

import json
import re

from src.classifier import classify_all
from src.guardrail import apply_guardrail
from src.llm_client import generate_text
from src.prompt_templates import build_step1_prompt
from src.step0_templates import get_step0_message

_CODE_FENCE_RE = re.compile(r"^```[a-zA-Z]*\n|\n```$")


def _strip_code_fence(text: str) -> str:
    return _CODE_FENCE_RE.sub("", text.strip())


def _generate_step1_content(classified: dict) -> dict:
    prompt = build_step1_prompt(classified)
    raw_text = generate_text(prompt)
    cleaned = _strip_code_fence(raw_text)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise ValueError(f"LLM 응답을 JSON으로 파싱하지 못했습니다: {raw_text!r}") from exc


def build_report(child: dict, scores: dict[str, float]) -> dict:
    """아동 정보와 T점수를 받아 Step 0~1을 포함한 최종 리포트를 생성한다."""
    classified = classify_all(scores)

    step0_message = get_step0_message(age=child["age"], gender=child["gender"])
    step1_content = _generate_step1_content(classified)

    report = {
        "child": child,
        "step0": {"message": step0_message},
        "step1": step1_content,
        "classification": {
            scale: {"t_score": result.t_score, "level": result.level.value}
            for scale, result in classified.items()
        },
    }

    return apply_guardrail(report)
