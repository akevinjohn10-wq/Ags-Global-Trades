import { useEffect, useRef } from 'react';

type Props = {
  text: string;
  className?: string;
  /** total length of the effect, in ms */
  duration?: number;
};

/**
 * Menu label that dissolves on hover/focus: each letter briefly fades and softens, then comes back,
 * in a quick left-to-right wave. Letters never change, move or resize, so nothing around it shifts.
 */
export default function Scramble({ text, className = '', duration = 520 }: Props) {
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const host = (el.closest('a,button,[data-scramble-host]') as HTMLElement | null) ?? el;
    const chars = Array.from(el.querySelectorAll<HTMLSpanElement>('[data-ch]'));
    let raf = 0;
    let start = 0;

    const tick = (now: number) => {
      if (!start) start = now;
      const t = (now - start) / duration;
      const n = Math.max(1, chars.length);
      chars.forEach((c, i) => {
        // each letter dips and returns, a little after the one before it, with a touch of noise
        const local = (t - (i / n) * 0.45) / 0.55;
        const dip = local <= 0 || local >= 1 ? 0 : Math.sin(Math.PI * local) * (0.75 + 0.25 * Math.random());
        c.style.opacity = dip ? String(1 - 0.7 * dip) : '';
        c.style.filter = dip ? `blur(${(1.4 * dip).toFixed(2)}px)` : '';
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    const run = () => {
      cancelAnimationFrame(raf);
      start = 0;
      raf = requestAnimationFrame(tick);
    };
    host.addEventListener('mouseenter', run);
    host.addEventListener('focus', run);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('mouseenter', run);
      host.removeEventListener('focus', run);
      chars.forEach((c) => {
        c.style.opacity = '';
        c.style.filter = '';
      });
    };
  }, [text, duration]);

  return (
    <span ref={wrap} aria-label={text} className={`inline-block whitespace-nowrap ${className}`}>
      {Array.from(text).map((ch, i) => (
        <span key={i} data-ch aria-hidden="true">
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}
