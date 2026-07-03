import type { AttentionArea } from "../lib/types";

interface WeaknessCardProps {
  attentionAreas: AttentionArea[];
}

const AREA_ICONS = ["👁️", "🙂", "👥"];

export function WeaknessCard({ attentionAreas }: WeaknessCardProps) {
  return (
    <div className="weakness-block">
      <p className="section-label">💛 지금 관심과 에너지가 필요한 영역</p>
      {attentionAreas.length === 0 && <p>현재 특별히 관심이 필요한 영역은 발견되지 않았어요.</p>}
      <ul className="icon-list">
        {attentionAreas.map((a, index) => (
          <li key={a.scale} className="icon-list-item">
            <span className="icon-list-item__icon">{AREA_ICONS[index % AREA_ICONS.length]}</span>
            <span className="icon-list-item__text">
              <strong>{a.scale}</strong>
              <br />
              {a.description}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
