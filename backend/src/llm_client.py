"""Google AI Studio API 연동 (PRD 7.1/7.2절).

검사당 1회 일괄 호출로 Step 1 재해석 문장을 생성한다.
"""

import os

from google import genai

_DEFAULT_MODEL = "gemma-3-27b-it"


def _get_client() -> genai.Client:
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY 환경 변수가 설정되지 않았습니다. .env.example을 참고해 .env를 구성하세요."
        )
    return genai.Client(api_key=api_key)


def generate_text(prompt: str, temperature: float = 0.3, max_output_tokens: int = 2000) -> str:
    """LLM에 프롬프트를 전달하고 생성된 텍스트를 반환한다."""
    client = _get_client()
    model = os.environ.get("GEMINI_MODEL", _DEFAULT_MODEL)

    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config={
            "temperature": temperature,
            "max_output_tokens": max_output_tokens,
        },
    )
    return response.text
