"""Google AI Studio API 연동 (PRD 7.1/7.2절).

검사당 1회 일괄 호출로 Step 1 재해석 문장을 생성한다.
"""

import os

from google import genai
from google.genai import types

_DEFAULT_MODEL = "gemini-2.5-flash"


def _get_client() -> genai.Client:
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY 환경 변수가 설정되지 않았습니다. .env.example을 참고해 .env를 구성하세요."
        )
    return genai.Client(api_key=api_key)


def generate_text(prompt: str, temperature: float = 0.3, max_output_tokens: int = 8000) -> str:
    """LLM에 프롬프트를 전달하고 생성된 텍스트를 반환한다."""
    client = _get_client()
    model = os.environ.get("GEMINI_MODEL", _DEFAULT_MODEL)

    config = {"temperature": temperature, "max_output_tokens": max_output_tokens}
    if model.startswith("gemini"):
        # gemini 계열은 기본적으로 내부 thinking 토큰을 소모해 응답이 느려지므로,
        # 판정(정상/준임상/임상)은 이미 classifier.py가 끝낸 상태라 별도 추론이 필요 없어 비활성화한다.
        # (gemma 계열은 thinking_config 자체를 지원하지 않아 400 오류가 나므로 gemini에만 적용)
        config["thinking_config"] = types.ThinkingConfig(thinking_budget=0)

    response = client.models.generate_content(model=model, contents=prompt, config=config)
    return response.text
