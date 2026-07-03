import type { ChildInfo, ReportResponse, SampleCase } from "../lib/types";

export async function fetchSampleCases(): Promise<SampleCase[]> {
  const res = await fetch("/api/report/get/sample-cases");
  if (!res.ok) {
    throw new Error("더미 데이터를 불러오지 못했습니다.");
  }
  return res.json();
}

export async function createReport(
  child: ChildInfo,
  scores: Record<string, number>,
): Promise<ReportResponse> {
  const res = await fetch("/report", {
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
