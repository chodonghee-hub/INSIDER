import { ScreenFooter } from "./layout/ScreenFooter";
import thumbnail from "../assets/img/thumbnail.png";

interface IntroScreenProps {
  onStart: () => void;
}

export function IntroScreen({ onStart }: IntroScreenProps) {
  return (
    <section className="screen intro-screen">
      <div className="illustration-circle illustration-circle--large">
        <img src={thumbnail} alt="" className="illustration-circle__img" />
      </div>
      <h2>아이의 이야기를 들려드릴게요</h2>
      <p className="screen-desc">
        이 리포트는 전문적인 진단이 아닌, 아이를 더 잘 이해하기 위한 따뜻한
        가이드입니다. 곧 전문 상담사가 전화를 통해 상세히 안내해 드릴
        예정이니 안심하세요.
      </p>
      <ScreenFooter>
        <button type="button" className="cta-button" onClick={onStart}>
          리포트 보러가기
        </button>
      </ScreenFooter>
    </section>
  );
}
