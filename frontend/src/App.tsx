import { useState } from "react";
import { createReport } from "./api/reportApi";
import { ReportForm } from "./components/ReportForm";
import { ReportView } from "./components/ReportView";
import type { ChildInfo, ReportResponse } from "./lib/types";
import "./App.css";

function App() {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (child: ChildInfo, scores: Record<string, number>) => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const result = await createReport(child, scores);
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app">
      <header>
        <h1>K-CBCL 사전 안내 리포트</h1>
        <p>검사 직후부터 상담 전까지, 우리 아이를 더 따뜻한 시선으로 이해해보세요.</p>
      </header>

      <ReportForm onSubmit={handleSubmit} loading={loading} />

      {error && <p className="error-text">{error}</p>}
      {report && <ReportView report={report} />}
    </main>
  );
}

export default App;
