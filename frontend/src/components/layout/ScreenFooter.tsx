import { useEffect, useState, type ReactNode } from "react";

interface ScreenFooterProps {
  children: ReactNode;
}

const FADE_THRESHOLD_PX = 8;

export function ScreenFooter({ children }: ScreenFooterProps) {
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setHasMore(scrollable - window.scrollY > FADE_THRESHOLD_PX);
    };

    checkScroll();
    window.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      window.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  return (
    <div className={`screen-footer${hasMore ? " screen-footer--fade" : ""}`}>
      {children}
    </div>
  );
}
