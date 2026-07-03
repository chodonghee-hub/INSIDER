import type { ChildInfo } from "../lib/types";
import { ScreenFooter } from "./layout/ScreenFooter";

interface StepZeroCardProps {
  child: ChildInfo;
  message: string;
  onNext: () => void;
}

const FEATURE_ICONS = ["🌱", "🌙", "🤝"];

function splitHighlights(message: string): string[] {
  return message
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function StepZeroCard({ child, message, onNext }: StepZeroCardProps) {
  const genderLabel = child.gender === "male" ? "남아" : "여아";
  const highlights = splitHighlights(message);

  return (
    <section className="screen features-screen">
      <span className="badge">
        만 {child.age}세 {genderLabel}
      </span>
      <h2>
        이 시기 아이들은 이런
        <br />
        특징을 보여요
      </h2>
      <p className="screen-desc">{message}</p>

      <div className="illustration-placeholder">
        <span className="illustration-circle">🐿️</span>
      </div>

      <ul className="icon-list">
        {highlights.map((text, index) => (
          <li key={text} className="icon-list-item">
            <span className="icon-list-item__icon">{FEATURE_ICONS[index % FEATURE_ICONS.length]}</span>
            <span className="icon-list-item__text">{text}</span>
          </li>
        ))}
      </ul>

      <ScreenFooter>
        <button type="button" className="cta-button" onClick={onNext}>
          다음 →
        </button>
      </ScreenFooter>
    </section>
  );
}
