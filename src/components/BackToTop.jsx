import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * 手机端「回到顶部」浮钮：下滑超过一屏多一点才出现，停在安全区上方。
 * 桌面端屏幕高、滚动条可见，不出现，避免多一个常驻控件。
 */
export default function BackToTop() {
  const [shown, setShown] = useState(() => (typeof window === 'undefined' ? false : window.scrollY > 480));

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 480);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => {
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="回到顶部"
      title="回到顶部"
      className={`no-print fixed right-4 z-40 flex h-11 w-11 items-center justify-center border border-ink/25 bg-paper-raised/95 text-ink-soft shadow-[0_14px_28px_-18px_rgba(0,0,0,0.75)] backdrop-blur transition-all duration-300 ease-[var(--ease-soft)] hover:border-vermilion/70 hover:text-vermilion lg:hidden ${
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
      style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2} />
    </button>
  );
}