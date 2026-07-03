import type { AttentionArea } from "../lib/types";
import { ScreenFooter } from "./layout/ScreenFooter";

interface HomeCareScreenProps {
  attentionAreas: AttentionArea[];
  disclaimer: string;
  onFinish: () => void;
}

const CARE_ICONS = ["💬", "🏠", "🌿"];
const FALLBACK_TIP = "매일 같은 시간에 아이와 눈을 맞추고 짧게라도 이야기를 나눠보세요.";

export function HomeCareScreen({ attentionAreas, disclaimer, onFinish }: HomeCareScreenProps) {
  const tips = attentionAreas.slice(0, 3);

  return (
    <section className="screen care-screen">
      <h2>집에서 이렇게 도와주세요</h2>
      <p className="screen-desc">
        아이와 함께하는 작은 걸음이 모여 큰 변화를 만듭니다. 따뜻한 격려로
        아이의 마음을 채워주세요.
      </p>

      <ul className="care-list">
        {(tips.length > 0
          ? tips
          : [{ scale: "따뜻한 대화", description: "", home_tip: FALLBACK_TIP }]
        ).map((tip, index) => (
          <li key={tip.scale} className="care-list-item">
            <span className="icon-list-item__icon">{CARE_ICONS[index % CARE_ICONS.length]}</span>
            <span className="icon-list-item__text">
              <strong>{tip.scale}</strong>
              <br />
              {tip.home_tip}
            </span>
          </li>
        ))}
      </ul>

      <div className="illustration-placeholder">
        <span className="illustration-circle illustration-circle--accent">❤️</span>
        <span className="badge">Together with Care</span>
      </div>

      <div className="info-note">{disclaimer}</div>

      <ScreenFooter>
        <button type="button" className="cta-button" onClick={onFinish}>
          상담 예약 확인하기 →
        </button>
      </ScreenFooter>
    </section>
  );
}
