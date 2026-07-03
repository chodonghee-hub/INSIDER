import type { ChildInfo, ReportResponse, SampleCase } from "../lib/types";

// 로컬 개발: 비워두면 vite.config.ts의 server.proxy가 localhost:8000으로 전달한다.
// 배포 환경: 프론트엔드와 백엔드가 별도 호스트로 배포되므로 백엔드의 절대 URL을 지정해야 한다.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export async function fetchSampleCases(): Promise<SampleCase[]> {
  const res = await fetch(`${API_BASE_URL}/api/report/get/sample-cases`);
  if (!res.ok) {
    throw new Error("더미 데이터를 불러오지 못했습니다.");
  }
  return res.json();
}

export async function createReport(
  child: ChildInfo,
  scores: Record<string, number>,
): Promise<ReportResponse> {
  const res = await fetch(`${API_BASE_URL}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ child, scores }),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail ?? "리포트 생성 중 오류가 발생했습니다.");
  }

  return res.json();
}
