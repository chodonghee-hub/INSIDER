import { useState } from "react";
import { createReport } from "./api/reportApi";
import { ReportForm } from "./components/ReportForm";
import { IntroScreen } from "./components/IntroScreen";
import { StepZeroCard } from "./components/StepZeroCard";
import { StrengthScreen } from "./components/StrengthScreen";
import { HomeCareScreen } from "./components/HomeCareScreen";
import { MobileHeader } from "./components/layout/MobileHeader";
import type { ChildInfo, ReportResponse } from "./lib/types";
import "./App.css";

type Step = "form" | "intro" | "features" | "strength" | "care";

function App() {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("form");

  const handleSubmit = async (child: ChildInfo, scores: Record<string, number>) => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const result = await createReport(child, scores);
      setReport(result);
      setStep("intro");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setReport(null);
    setStep("form");
  };

  const handleBack = () => {
    if (step === "intro") setStep("form");
    else if (step === "features") setStep("intro");
    else if (step === "strength") setStep("features");
    else if (step === "care") setStep("strength");
  };

  return (
    <div className="mobile-shell">
      <MobileHeader onBack={step === "form" ? undefined : handleBack} />

      <main className="app">
        {step === "form" && (
          <section className="screen form-screen">
            <h2>K-CBCL 사전 안내 리포트</h2>
            <p className="screen-desc">
              검사 직후부터 상담 전까지, 우리 아이를 더 따뜻한 시선으로
              이해해보세요.
            </p>
            <ReportForm onSubmit={handleSubmit} loading={loading} />
            {error && <p className="error-text">{error}</p>}
          </section>
        )}

        {report && step === "intro" && <IntroScreen onStart={() => setStep("features")} />}

        {report && step === "features" && (
          <StepZeroCard
            child={report.child}
            message={report.step0.message}
            onNext={() => setStep("strength")}
          />
        )}

        {report && step === "strength" && (
          <StrengthScreen
            strengths={report.step1.strengths}
            attentionAreas={report.step1.attention_areas}
            onNext={() => setStep("care")}
          />
        )}

        {report && step === "care" && (
          <HomeCareScreen
            attentionAreas={report.step1.attention_areas}
            disclaimer={report.disclaimer}
            onFinish={handleFinish}
          />
        )}
      </main>
    </div>
  );
}

export default App;
