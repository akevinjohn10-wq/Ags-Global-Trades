import { useEffect, useRef, useState } from 'react';

type Phase = 'idle' | 'cover' | 'reveal';

const COVER_MS = 520;
const REVEAL_MS = 620;

/**
 * Page transition (unitedcarriers.com style): long jumps between sections are hidden behind
 * a blue curtain that wipes up, then lifts away to reveal the new section.
 */
export default function PageTransition() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [label, setLabel] = useState('');
  const busy = useRef(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const link = (event.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!link || busy.current) return;
      const id = link.getAttribute('href')!.slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY;
      // Short hops just scroll smoothly; long jumps get the curtain
      if (Math.abs(top - window.scrollY) < window.innerHeight * 1.6) return;

      event.preventDefault();
      busy.current = true;
      setLabel(link.textContent?.trim() || id);
      setPhase('cover');
      window.setTimeout(() => {
        window.scrollTo({ top: id === 'home' ? 0 : top, behavior: 'instant' as ScrollBehavior });
        history.replaceState(null, '', `#${id}`);
        setPhase('reveal');
        window.setTimeout(() => {
          setPhase('idle');
          busy.current = false;
        }, REVEAL_MS);
      }, COVER_MS + 120);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const clip =
    phase === 'cover' ? 'inset(0 0 0 0)' : phase === 'reveal' ? 'inset(0 0 100% 0)' : 'inset(100% 0 0 0)';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[85] flex items-center justify-center bg-accent text-white"
      style={{
        clipPath: clip,
        transition: phase === 'idle' ? 'none' : `clip-path ${phase === 'cover' ? COVER_MS : REVEAL_MS}ms cubic-bezier(0.76, 0, 0.24, 1)`,
        visibility: phase === 'idle' ? 'hidden' : 'visible',
      }}
    >
      <div className="flex flex-col items-center gap-5">
        <span className="h-4 w-4 animate-blink bg-white" />
        <p className="font-display text-[44px] font-medium leading-none sm:text-[88px]">{label}</p>
      </div>
    </div>
  );
}
