import { useEffect, useRef } from 'react';

interface ScrubTextProps {
  text: string;
  className?: string;
  /** Words to keep in the accent colour once revealed */
  highlight?: string[];
}

/**
 * Large statement whose words light up one by one as it scrolls through the screen
 * (the bluesqx.com mission-statement effect).
 */
export default function ScrubText({ text, className = '', highlight = [] }: ScrubTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(' ');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const spans = Array.from(el.querySelectorAll<HTMLSpanElement>('[data-w]'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      spans.forEach((s) => (s.style.opacity = '1'));
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // starts when the top reaches 85% of the screen, finishes when the bottom reaches 55%
      const start = vh * 0.85;
      const end = vh * 0.55 - rect.height;
      const p = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
      const lit = p * spans.length;
      spans.forEach((s, i) => {
        const o = Math.min(1, Math.max(0, lit - i));
        s.style.opacity = (0.16 + o * 0.84).toFixed(3);
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [text]);

  const clean = (w: string) => w.replace(/[^\w-]/g, '').toLowerCase();
  const marks = highlight.map((h) => h.toLowerCase());

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`}>
          <span data-w className={`transition-opacity duration-150 ${marks.includes(clean(word)) ? 'text-accent' : ''}`} style={{ opacity: 0.16 }}>
            {word}
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  );
}
