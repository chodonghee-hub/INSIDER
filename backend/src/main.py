"""FastAPI 앱 — POST /report 단일 엔드포인트 (PRD 7.1절)."""

import json
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.genai.errors import APIError
from pydantic import BaseModel

from src.report_generator import build_report

load_dotenv()

app = FastAPI(title="K-CBCL 사전 안내 리포트 API")

_default_origins = ["http://localhost:5173"]
_extra_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins + _extra_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "sample_scores.json"


class Child(BaseModel):
    age: int
    gender: str


class ReportRequest(BaseModel):
    child: Child
    scores: dict[str, float]


@app.get("/api/report/get/sample-cases")
def get_sample_cases():
    """프론트엔드 더미 데이터 드롭다운용 케이스 목록을 반환한다."""
    cases = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    return cases


@app.post("/report")
def create_report(request: ReportRequest):
    try:
        return build_report(child=request.child.model_dump(), scores=request.scores)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except APIError as exc:
        raise HTTPException(
            status_code=502, detail=f"LLM 호출 중 오류가 발생했습니다: {exc.message}"
        ) from exc
