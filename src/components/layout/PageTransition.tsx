import { useEffect, useRef, useState } from 'react';
import DotMap from '@/components/ui/DotMap';
import Logo from '@/components/ui/Logo';
import { allHubs } from '@/data/globe';

type Phase = 'idle' | 'cover' | 'hold' | 'reveal';

const COVER_MS = 600;
const HOLD_MS = 260;
const REVEAL_MS = 700;
const EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';

/**
 * Page transition for long jumps between sections: one dark navy sheet sweeps up over the page,
 * carrying the drifting dotted map and the AGS logo, and keeps moving up to reveal the new section.
 */
export default function PageTransition() {
  const [phase, setPhase] = useState<Phase>('idle');
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
      // Short hops just scroll smoothly; long jumps get the transition
      if (Math.abs(top - window.scrollY) < window.innerHeight * 1.6) return;

      event.preventDefault();
      busy.current = true;
      setPhase('cover');
      window.setTimeout(() => {
        window.scrollTo({ top: id === 'home' ? 0 : top, behavior: 'instant' as ScrollBehavior });
        history.replaceState(null, '', `#${id}`);
        setPhase('hold');
      }, COVER_MS);
      window.setTimeout(() => setPhase('reveal'), COVER_MS + HOLD_MS);
      window.setTimeout(() => {
        setPhase('idle');
        busy.current = false;
      }, COVER_MS + HOLD_MS + REVEAL_MS + 50);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const covered = phase === 'cover' || phase === 'hold';
  const shown = phase !== 'idle';
  const clip = covered ? 'inset(0 0 0 0)' : phase === 'reveal' ? 'inset(0 0 100% 0)' : 'inset(100% 0 0 0)';
  // The map keeps drifting upwards through the whole sweep, so it reads as one movement
  const drift = phase === 'cover' ? '6%' : phase === 'hold' ? '0%' : phase === 'reveal' ? '-6%' : '12%';
  const driftMs = phase === 'cover' ? COVER_MS : phase === 'hold' ? HOLD_MS : REVEAL_MS;

  return (
    <div
      aria-hidden="true"
      className="aurora grain pointer-events-none fixed inset-0 z-[85] isolate overflow-hidden bg-space text-white"
      style={{
        visibility: shown ? 'visible' : 'hidden',
        clipPath: clip,
        transition: phase === 'idle' ? 'none' : `clip-path ${covered ? COVER_MS : REVEAL_MS}ms ${EASE}`,
      }}
    >
      <div
        className="absolute -inset-y-[10%] inset-x-0"
        style={{ transform: `translate3d(0, ${drift}, 0)`, transition: shown ? `transform ${driftMs}ms linear` : 'none', opacity: 0.8 }}
      >
        {shown && <DotMap theme="dark" hubs={allHubs} labels="none" intro={false} fit="cover" density={7.5} />}
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(40%_35%_at_50%_50%,rgba(5,7,15,0.8),rgba(5,7,15,0.15)_70%,transparent)]" />

      <div className="relative flex h-full items-center justify-center">
        <div
          className="transition-[opacity,transform] ease-expo"
          style={{
            opacity: covered ? 1 : 0,
            transform: covered ? 'translateY(0)' : phase === 'reveal' ? 'translateY(-24px)' : 'translateY(24px)',
            transitionDuration: `${covered ? COVER_MS : REVEAL_MS * 0.6}ms`,
          }}
        >
          <Logo height={84} />
        </div>
      </div>
    </div>
  );
}
