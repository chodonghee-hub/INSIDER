import { useEffect, useState } from "react";
import { fetchSampleCases } from "../api/reportApi";
import type { ChildInfo, SampleCase } from "../lib/types";

interface ReportFormProps {
  onSubmit: (child: ChildInfo, scores: Record<string, number>) => void;
  loading: boolean;
}

export function ReportForm({ onSubmit, loading }: ReportFormProps) {
  const [cases, setCases] = useState<SampleCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchSampleCases()
      .then((data) => {
        setCases(data);
        if (data.length > 0) {
          setSelectedCaseId(data[0].case_id);
        }
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const selected = cases.find((c) => c.case_id === selectedCaseId);
    if (!selected) return;
    onSubmit(selected.child, selected.scores);
  };

  if (loadError) {
    return <p className="error-text">{loadError}</p>;
  }

  return (
    <form className="report-form" onSubmit={handleSubmit}>
      <label htmlFor="case-select">더미 데이터로 리포트 생성하기</label>
      <select
        id="case-select"
        value={selectedCaseId}
        onChange={(e) => setSelectedCaseId(e.target.value)}
      >
        {cases.map((c) => (
          <option key={c.case_id} value={c.case_id}>
            {c.label}
          </option>
        ))}
      </select>
      <button type="submit" disabled={loading || !selectedCaseId}>
        {loading ? "리포트 생성 중..." : "리포트 생성"}
      </button>
    </form>
  );
}
