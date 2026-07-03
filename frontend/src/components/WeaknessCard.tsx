import type { AttentionArea } from "../lib/types";

interface WeaknessCardProps {
  attentionAreas: AttentionArea[];
}

export function WeaknessCard({ attentionAreas }: WeaknessCardProps) {
  return (
    <section className="card weakness-card">
      <h2>지금 관심과 에너지가 필요한 영역</h2>
      {attentionAreas.length === 0 && <p>현재 특별히 관심이 필요한 영역은 발견되지 않았어요.</p>}
      <ul>
        {attentionAreas.map((a) => (
          <li key={a.scale}>
            <h3>{a.scale}</h3>
            <p>{a.description}</p>
            <p className="tip">가정에서 해볼 수 있는 것: {a.home_tip}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
