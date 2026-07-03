import type { Strength } from "../lib/types";

interface StrengthCardProps {
  strengths: Strength[];
}

export function StrengthCard({ strengths }: StrengthCardProps) {
  if (strengths.length === 0) {
    return (
      <div className="strength-block">
        <p>아직 뚜렷하게 드러난 강점 영역이 없어요.</p>
      </div>
    );
  }

  return (
    <div className="strength-block">
      <div className="illustration-placeholder">
        <span className="illustration-circle">🐻</span>
      </div>

      {strengths.map((s) => (
        <div key={s.scale} className="strength-item">
          <span className="badge badge--accent">{s.trait_theme}</span>
          <p className="screen-desc">{s.description}</p>
          <p className="activity-label">아이의 강점을 키워줄 놀이</p>
          <span className="chip">{s.activity_suggestion}</span>
        </div>
      ))}
    </div>
  );
}
