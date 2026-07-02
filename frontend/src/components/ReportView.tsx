import type { ReportResponse } from "../lib/types";
import { StepZeroCard } from "./StepZeroCard";
import { StrengthCard } from "./StrengthCard";
import { WeaknessCard } from "./WeaknessCard";

interface ReportViewProps {
  report: ReportResponse;
}

export function ReportView({ report }: ReportViewProps) {
  return (
    <div className="report-view">
      <StepZeroCard message={report.step0.message} />
      <StrengthCard strengths={report.step1.strengths} />
      <WeaknessCard attentionAreas={report.step1.attention_areas} />
      <p className="disclaimer">{report.disclaimer}</p>
    </div>
  );
}
