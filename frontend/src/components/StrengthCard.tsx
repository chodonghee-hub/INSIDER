import type { Strength } from "../lib/types";

interface StrengthCardProps {
  strengths: Strength[];
}

export function StrengthCard({ strengths }: StrengthCardProps) {
  return (
    <section className="card strength-card">
      <h2>아이의 숨겨진 강점과 기질</h2>
      {strengths.length === 0 && <p>아직 뚜렷하게 드러난 강점 영역이 없어요.</p>}
      <ul>
        {strengths.map((s) => (
          <li key={s.scale}>
            <h3>{s.trait_theme}</h3>
            <p>{s.description}</p>
            <p className="tip">함께 해보면 좋은 활동: {s.activity_suggestion}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
