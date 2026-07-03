# (주)인사이터 사전과제

🌐 배포 주소 : https://insiderfrontend-production.up.railway.app/

### 기간 : 26.07.01 ~ 26.07.03

# AI 기반 K-CBCL 보호자 맞춤형 사전 안내 리포트 (PoC)

K-CBCL 검사 결과(T점수)를 규칙 기반으로 정상/준임상/임상 판정한 뒤, LLM이 판정 결과를
보호자 친화적인 문장(강점/관심 필요 영역 재해석)으로 표현해주는 PoC입니다.

> PoC 구현 범위: **Step 1(강점/약점 재해석)** 을 핵심으로 구현했으며,
> Step 0(생애주기 발달 특성, 정적 템플릿)까지 함께 제공합니다. Step 2(종합 환경 추천)는
> 코드에는 반영되지 않았습니다 (이번 PoC 범위에서 제외).

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
| 모델 선정 경위 | `gemma-3-27b-it`(서비스 종료) → `gemma-4-31b-it`(72초대, 느림) → `gemini-2.5-flash` + `thinking_budget=0`(7~8초대, 안정적)로 전환. |
| 무료 티어 한도 | 분당/일별 요청 수 제한(RPM/RPD)이 있습니다. 데모 시 연속 호출을 피하고
호출 사이에 간격을 두세요 (짧은 시간 내 여러 케이스를 연달아 생성하면 429/502 오류가 날 수 있음). |

## LLM 사용 방식 상세

이 프로젝트는 LLM을 "판정"이 아니라 "표현(문장 생성)"에만 국한해서 사용합니다.
판정 로직 자체는 결정론적 규칙(`classifier.py`)이 전담하고, LLM은 그 결과를 감정적으로
안전한 문장으로 재구성하는 역할만 맡습니다. 검사 1건당 LLM 호출은 정확히 1회입니다.

### 1) 프롬프트 구성 (`backend/src/prompt_templates.py`)

- **System instruction**: "판정을 바꾸지 말 것", "진단/치료/처방 등 임상 용어 금지",
  "정상 범위는 강점으로, 준임상/임상 범위는 순화된 표현으로 재해석" 등 6가지 원칙과 함께
  응답 스키마(JSON)를 고정 명시합니다.
- **User prompt**: `classifier.py`가 반환한 척도별 T점수·판정 결과를 "강점으로 재해석할 대상"과
  "관심 필요 영역으로 재해석할 대상" 두 그룹으로 나눠 텍스트 블록으로 삽입합니다.
- 두 블록을 합쳐 하나의 프롬프트 문자열로 만들어 단일 호출에 전달합니다(멀티턴 대화 없음).

### 2) 모델 호출 (`backend/src/llm_client.py`)

- SDK: `google-genai`, 모델: `gemini-2.5-flash` (환경 변수 `GEMINI_MODEL`로 교체 가능)
- `temperature=0.3`으로 표현의 일관성을 확보하고, `max_output_tokens=8000`으로 상한을 둡니다.
- gemini 계열 모델에는 `thinking_config(thinking_budget=0)`을 설정해 내부 reasoning 토큰을
  비활성화합니다. 판정은 이미 끝난 상태라 LLM이 별도로 추론할 필요가 없고, 이를 통해 응답
  속도를 72초대 → 7~8초대로 단축했습니다.

### 3) 응답 파싱 및 방어 처리 (`backend/src/report_generator.py`)

- LLM 응답이 코드펜스(```json ... ```)로 감싸져 오는 경우를 대비해 정규식으로 먼저 제거합니다.
- `json.loads`로 파싱을 시도하고, 실패 시 원문을 포함한 `ValueError`를 발생시켜 상위(`main.py`)에서
  HTTP 502로 변환합니다 — LLM이 스키마를 어겼을 때 원인 파악이 가능하도록 원문을 보존합니다.

### 4) 출력 가드레일 (`backend/src/guardrail.py`)

- LLM이 시스템 지침을 100% 지킨다고 신뢰하지 않고, 후처리 단계에서 별도로 검증합니다.
- `진단→특성 확인`, `치료→케어`, `처방→제안`, `질환→특성`, `장애→경향`, `증후군→경향` 등
  금지어 사전을 정규식으로 치환합니다(리포트 JSON 전체를 재귀 순회).
- 리포트 하단에 고정된 면책 문구(`DISCLAIMER`)를 항상 삽입합니다.

## 목업 데이터 및 전체 파이프라인 상세

### 목업 데이터 (`backend/data/sample_scores.json`)

- LLM으로 생성한 데이터가 아니라, PoC 시연을 위해 **수작업으로 설계한 정적 JSON 3건**입니다.
- 판정 경계값(T=60/63/65/70)을 기준으로 세 가지 시나리오를 의도적으로 구성했습니다.
  - `case-normal-01`: 전 척도 정상 범위 위주 (만 7세 남아)
  - `case-borderline-01`: 불안/우울·주의집중이 준임상 구간 (만 9세 여아)
  - `case-clinical-01`: 공격성·주의집중이 임상 구간 (만 6세 남아)
- 프론트엔드는 `GET /api/report/get/sample-cases`로 이 목록을 받아 케이스 선택 드롭다운을 채우고,
  선택된 케이스의 `child`/`scores`를 그대로 `POST /report`에 전달합니다. 실제 개인정보는 없습니다.

### 전체 데이터 파이프라인

```
[1] 프론트엔드: 케이스 선택 (또는 T점수 직접 입력)
      │  child(age, gender), scores(척도별 T점수)
      ▼
[2] POST /report (backend/src/main.py)
      ▼
[3] classify_all() — backend/src/classifier.py
      · 복합척도(총문제행동/내재화/외현화): T<60 정상, 60~63 준임상, T≥64 임상
      · 하위척도(위축/신체증상/…): T<65 정상, 65~69 준임상, T≥70 임상
      ▼
[4] get_step0_message() — backend/src/step0_templates.py (LLM 미사용)
      · 연령대(4~6/7~9/10~12세) × 성별 조합의 정적 템플릿 매칭
      ▼
[5] build_step1_prompt() — backend/src/prompt_templates.py
      · [3]의 판정 결과를 강점군/관심영역군으로 분리해 프롬프트 조립
      ▼
[6] generate_text() — backend/src/llm_client.py
      · gemini-2.5-flash 1회 호출 (thinking_budget=0, temperature=0.3)
      ▼
[7] JSON 파싱 + 코드펜스 제거 — backend/src/report_generator.py
      ▼
[8] apply_guardrail() — backend/src/guardrail.py
      · 금지어 치환 + 면책 문구 삽입
      ▼
[9] 최종 리포트 JSON 반환 → 프론트엔드 5단계 화면 렌더링
      (인트로 → Step0 연령대 특징 → Step1 강점/관심영역 → 가정 케어 팁)
```

- [3][4]는 규칙 기반(결정론적)이라 LLM 호출이 없고, [5]~[8]에서만 LLM이 개입합니다.
- 오류 처리: LLM 응답 파싱 실패는 502(`ValueError`), API 키 누락은 500(`RuntimeError`),
  Google API 자체 오류(rate limit 등)는 502(`google.genai.errors.APIError`)로 매핑됩니다
  (`backend/src/main.py`).

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
  트래픽 증가 시 배치 처리(batch API) 적용을 통해 단가를 낮추는 방안을 검토합니다.

## 설계 트레이드오프

PoC 범위와 기간(2박 3일) 안에서 의도적으로 선택한 절충들입니다.

| 결정 | 선택한 이유 | 포기한 것 / 리스크 |
|---|---|---|
| **판정은 규칙, 표현만 LLM** | 임상적 판정을 LLM에 맡기면 환각(hallucination)으로 오판정 위험이 생김. T점수 컷오프 비교는 결정론적이라 100% 재현 가능하고 감사(audit)가 쉬움 | LLM의 맥락적 판단력(예: 척도 간 상호작용 고려)은 활용하지 못함. 컷오프 경계값 자체가 잘못 설정되면 규칙 단으로는 스스로 교정되지 않음 |
| **`gemini-2.5-flash` + `thinking_budget=0`** | 응답 속도를 72초대 → 7~8초대로 단축, 무료 티어로 PoC 비용 0원 | thinking을 끄면 복잡한 추론이 필요한 케이스(척도 간 모순, 애매한 경계값)에서 표현 품질이 떨어질 수 있음. 무료 티어 RPM/RPD 제한으로 데모 중 연속 호출 시 429/502 발생 가능 |
| **가드레일을 정규식 치환으로 구현** | 별도 LLM 재검증 호출 없이 즉시·저비용으로 금지어를 걸러낼 수 있음 | 문자열 완전일치 기반이라 금지어의 변형 표현(띄어쓰기, 유의어, 조사 결합 등)은 걸러지지 못함. 치환 후 문장이 어색해질 수 있음(예: "진단"→"특성 확인"이 문맥에 안 맞는 경우) |
| **LLM 호출을 검사당 1회, 단일 프롬프트로 통합** | 멀티턴/체인 호출 대비 지연시간과 비용을 최소화 | 강점/관심영역을 한 번에 생성하므로 항목별 개별 재시도(retry)가 불가능 — 응답 전체가 스키마를 어기면 전체를 다시 생성해야 함 |
| **DB/캐싱 없이 매 요청마다 즉시 생성** | 아키텍처를 단순하게 유지해 PoC 개발 속도 확보 | 동일 케이스를 반복 조회해도 매번 LLM을 호출해 비용·지연시간이 누적됨. 응답 이력을 남기거나 재현/비교하기 어려움 |
| **정적 목업 JSON(`sample_scores.json`) 3건만 사용** | 실제 검사 연동 없이도 정상/준임상/임상 3개 시나리오를 바로 시연 가능 | 실제 사용자 분포를 반영하지 못하며, 경계값 근처의 edge case나 척도 조합의 다양성이 검증되지 않음 |
| **Step 2(종합 환경 추천) 범위 제외** | Step 1(재해석)에 리소스를 집중해 핵심 가치를 먼저 검증 | 보호자 입장에서 "그래서 무엇을 해야 하는지"에 대한 실질적 답은 아직 제공하지 못함 |

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
└── README.md
```
