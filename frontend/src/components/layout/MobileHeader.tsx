interface MobileHeaderProps {
  title?: string;
  onBack?: () => void;
}

export function MobileHeader({ title = "Milestone Path", onBack }: MobileHeaderProps) {
  return (
    <header className="mobile-header">
      <button
        type="button"
        className="mobile-header__icon-btn"
        onClick={onBack}
        disabled={!onBack}
        aria-label="뒤로가기"
      >
        {onBack ? "<" : ""}
      </button>
      <h1 className="mobile-header__title">{title}</h1>
      <span className="mobile-header__icon-btn" aria-hidden="true" />
    </header>
  );
}
