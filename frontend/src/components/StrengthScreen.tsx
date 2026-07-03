import type { AttentionArea, Strength } from "../lib/types";
import { StrengthCard } from "./StrengthCard";
import { WeaknessCard } from "./WeaknessCard";
import { ScreenFooter } from "./layout/ScreenFooter";

interface StrengthScreenProps {
  strengths: Strength[];
  attentionAreas: AttentionArea[];
  onNext: () => void;
}

export function StrengthScreen({ strengths, attentionAreas, onNext }: StrengthScreenProps) {
  return (
    <section className="screen strength-screen">
      <h2>우리 아이의 숨겨진 강점</h2>
      <StrengthCard strengths={strengths} />
      <WeaknessCard attentionAreas={attentionAreas} />

      <div className="info-note">
        이 분석은 아이의 현재 행동 패턴을 기반으로 한 것으로, 아이의 무한한
        가능성 중 일부분을 보여줍니다.
      </div>

      <ScreenFooter>
        <button type="button" className="cta-button" onClick={onNext}>
          다음
        </button>
      </ScreenFooter>
    </section>
  );
}
