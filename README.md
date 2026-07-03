# (주)인사이터 사전과제

🌐 배포 주소 : https://insiderfrontend-production.up.railway.app/

### 기간 : 26.07.01 ~ 26.07.03

# AI 기반 K-CBCL 보호자 맞춤형 사전 안내 리포트 (PoC)

K-CBCL 검사 결과(T점수)를 규칙 기반으로 정상/준임상/임상 판정한 뒤, LLM이 판정 결과를
보호자 친화적인 문장(강점/관심 필요 영역 재해석)으로 표현해주는 PoC입니다.
자세한 기획 배경과 설계 원칙은 [`.claude/PRD.md`](.claude/PRD.md)를 참고하세요.

> PoC 구현 범위: PRD 4장에 따라 **Step 1(강점/약점 재해석)** 을 핵심으로 구현했으며,
> Step 0(생애주기 발달 특성, 정적 템플릿)까지 함께 제공합니다. Step 2(종합 환경 추천)는
> 계획 문서(`workflow/1_feat/phase2_종합추천.md`)만 존재하며 코드에는 반영되지 않았습니다
> (이번 PoC 범위에서 제외).

## 아키텍처 요약

```
T점수 JSON --(규칙 기반 판정)--> classifier.py --(프롬프트 생성)--> LLM(Gemini 2.5 Flash)
  --(텍스트 생성)--> 가드레일(금지어 필터 + 면책 문구) --> 최종 리포트 JSON --> React 화면
```

- **판정은 규칙, 표현은 LLM**: 정상/준임상/임상 판정은 `backend/src/classifier.py`의
  T점수 컷오프 비교로만 처리하며, LLM은 그 결과를 문장으로 바꾸는 역할만 담당합니다.
- **가드레일**: LLM 출력에서 '진단/치료/처방' 등 임상적 개입을 암시하는 단어를
  후처리 단계에서 중립적 표현으로 치환하고, 리포트 하단에 면책 문구를 고정 삽입합니다.
- **모바일 스텝 플로우**: 프론트엔드는 카드 나열형 단일 화면이 아니라 `입력 폼 → 인트로 →
  연령대 특징(Step0) → 강점/관심영역(Step1) → 가정 케어 팁` 순서의 5단계 화면 전환 구조로
  동작합니다 (`frontend/src/App.tsx`).

## 사용 모델 / API

| 항목 | 내용 |
|---|---|
| LLM | `gemini-2.5-flash` (Google AI Studio API, `google-genai` SDK) — 환경 변수 `GEMINI_MODEL`로 교체 가능 |
| 호출 방식 | 검사(요청)당 1회 `client.models.generate_content()` 호출, `thinking_budget=0`으로 내부 thinking 비활성화 |
| 모델 선정 경위 | `gemma-3-27b-it`(서비스 종료) → `gemma-4-31b-it`(72초대, 느림) → `gemini-2.5-flash` + `thinking_budget=0`(7~8초대, 안정적)로 전환. 상세 비교는 [`workflow/4_refactor/phase1_리포트생성속도개선.md`](workflow/4_refactor/phase1_리포트생성속도개선.md) 참고. |
| 무료 티어 한도 | 분당/일별 요청 수 제한(RPM/RPD)이 있습니다. 데모 시 연속 호출을 피하고
호출 사이에 간격을 두세요 (짧은 시간 내 여러 케이스를 연달아 생성하면 429/502 오류가 날 수 있음). |

## 실행 방법

### 1. 백엔드 (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate   # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt

cp .env.example .env            # GOOGLE_API_KEY 값을 본인의 Google AI Studio API 키로 교체

uvicorn src.main:app --reload --port 8000
```

Windows에서는 `backend/run.bat`으로 `.venv` 존재 여부를 확인한 뒤 바로 서버를 기동할 수 있습니다.

API 키는 [Google AI Studio](https://aistudio.google.com/)에서 무료로 발급받을 수 있습니다.

### 2. 프론트엔드 (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속 후, 더미 데이터 케이스를 선택하고
"리포트 생성" 버튼을 누르면 백엔드(`http://localhost:8000`)로 요청이 전달되어
`인트로 → 연령대 특징 → 강점/관심영역 → 가정 케어 팁` 순서로 리포트 화면이 단계별로 렌더링됩니다.
(`vite.config.ts`의 `server.proxy` 설정으로 `/report`, `/api` 요청이 자동으로 백엔드에 프록시됩니다.)

### 3. 테스트

```bash
cd backend
source .venv/Scripts/activate
pytest
```

`classifier.py`의 경계값(T=60/63/65/70 등)에 대한 단위 테스트를 포함합니다.

## 환경 변수

| 변수 | 설명 | 위치 |
|---|---|---|
| `GOOGLE_API_KEY` | Google AI Studio API 키 (필수) | `backend/.env` |
| `GEMINI_MODEL` | 사용할 모델명 (기본값 `gemini-2.5-flash`) | `backend/.env` (선택) |
| `ALLOWED_ORIGINS` | 배포 환경에서 CORS로 추가 허용할 프론트엔드 도메인, 콤마 구분 (로컬 `http://localhost:5173`은 기본 허용) | `backend/.env` (선택) |

`.env` 파일은 `.gitignore`에 등록되어 있어 커밋되지 않습니다. 실제 커밋 전
`git status`로 `.env`가 포함되지 않았는지 확인하세요.

## 배포

백엔드는 Railway(Nixpacks 빌더)로 배포합니다. 모노레포 구조이므로 Railway 서비스의
**Root Directory를 `backend`로 지정**해야 `backend/railway.toml`을 인식합니다.

- 시작 명령: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
- 헬스체크: `GET /api/report/get/sample-cases`
- Railway Variables에 `GOOGLE_API_KEY`, `GEMINI_MODEL`(선택), `ALLOWED_ORIGINS`(선택, 프론트 배포 도메인)를 등록해야 합니다.

프론트엔드 배포 방식(Railway 정적 서빙 vs Vercel 등)은 아직 확정되지 않았습니다.

## 데이터

`backend/data/sample_scores.json`에 정의된 가상 아동 케이스(정상 범위 위주 / 준임상 포함
/ 임상 범위 포함, 총 3종)만 사용합니다. 실제 개인정보는 포함되어 있지 않습니다.

## 예상 운영 비용

- Google AI Studio 무료 티어 기준으로 PoC 검증에는 별도 비용이 발생하지 않습니다.
- 검사 1건당 LLM 호출 1회, 입출력 토큰 규모는 리포트 길이에 따라 수백~수천 토큰
  수준으로 예상됩니다.
- 실제 운영 전환 시에는 (월간 검사 건수) × (건당 호출 비용)으로 총 운영비를 산정하고,
  트래픽 증가 시 배치 처리(batch API) 적용을 통해 단가를 낮추는 방안을 검토합니다
  (자세한 내용은 [`.claude/PRD.md`](.claude/PRD.md) 6장 참고).

## 프로젝트 구조

```
INSIDER/
├── backend/
│   ├── data/sample_scores.json
│   ├── src/
│   │   ├── classifier.py          # 규칙 기반 정상/준임상/임상 판정
│   │   ├── step0_templates.py     # Step 0 정적 템플릿 (LLM 미사용)
│   │   ├── prompt_templates.py    # Step 1 재해석 프롬프트
│   │   ├── llm_client.py          # Google AI Studio API 연동 (gemini-2.5-flash)
│   │   ├── guardrail.py           # 금지어 필터 + 면책 문구
│   │   ├── report_generator.py    # 파이프라인 조립
│   │   └── main.py                # FastAPI (POST /report, GET /api/report/get/sample-cases)
│   ├── tests/test_classifier.py
│   ├── run.bat                    # Windows 로컬 서버 실행 스크립트
│   ├── railway.toml                # Railway 배포 설정
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/            # ReportForm, CaseSelect, IntroScreen, StepZeroCard,
│   │   │                          # StrengthScreen, HomeCareScreen, StrengthCard, WeaknessCard
│   │   │   └── layout/            # MobileHeader, ScreenFooter
│   │   ├── api/reportApi.ts
│   │   └── lib/types.ts
│   └── vite.config.ts
├── .claude/PRD.md
├── workflow/                       # 작업 계획/결과 기록 (브랜치·이슈별)
└── README.md
```
