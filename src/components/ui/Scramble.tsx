import { useEffect, useRef } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>?';

type Props = {
  text: string;
  className?: string;
  /** how long the scramble runs, in ms */
  duration?: number;
};

/**
 * Menu / option label that breaks up and resolves when its link or button is hovered or focused:
 * letters flicker through random characters with a slight horizontal tear, then settle left to right.
 * The real text keeps the width (so nothing around it shifts) and stays readable to screen readers.
 */
export default function Scramble({ text, className = '', duration = 520 }: Props) {
  const wrap = useRef<HTMLSpanElement>(null);
  const fx = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const out = fx.current;
    if (!el || !out) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const host = (el.closest('a,button,[data-scramble-host]') as HTMLElement | null) ?? el;
    let raf = 0;
    let start = 0;
    let last = 0;

    const tick = (now: number) => {
      if (!start) start = now;
      const t = (now - start) / duration;
      if (now - last > 38 || t >= 1) {
        last = now;
        let s = '';
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          // each letter settles a little after the one before it
          const settleAt = 0.25 + (i / Math.max(1, text.length)) * 0.65;
          s += ch === ' ' || t >= settleAt ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        out.textContent = s;
        const k = Math.max(0, 1 - t);
        out.style.transform = t < 1 ? `translateX(${((Math.random() - 0.5) * 4 * k).toFixed(2)}px) skewX(${((Math.random() - 0.5) * 10 * k).toFixed(1)}deg)` : '';
        out.style.textShadow = t < 1 ? `${(2.5 * k).toFixed(1)}px 0 rgba(120,150,255,${(0.55 * k).toFixed(2)}), ${(-2.5 * k).toFixed(1)}px 0 rgba(255,90,90,${(0.4 * k).toFixed(2)})` : '';
      }
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    const run = () => {
      cancelAnimationFrame(raf);
      start = 0;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    host.addEventListener('mouseenter', run);
    host.addEventListener('focus', run);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('mouseenter', run);
      host.removeEventListener('focus', run);
    };
  }, [text, duration]);

  return (
    <span ref={wrap} className={`relative inline-block whitespace-nowrap ${className}`}>
      <span className="opacity-0">{text}</span>
      <span ref={fx} aria-hidden="true" className="absolute left-0 top-0 will-change-transform">
        {text}
      </span>
    </span>
  );
}
