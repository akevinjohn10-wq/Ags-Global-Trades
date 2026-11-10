import { useEffect, useRef, useState } from 'react';
import DotMap from '@/components/ui/DotMap';
import { allHubs } from '@/data/globe';

type Phase = 'idle' | 'cover' | 'hold' | 'reveal';

const COVER_MS = 650;
const HOLD_MS = 220;
const REVEAL_MS = 750;
const EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';

/**
 * Page transition for long jumps between sections: a translucent, blurred navy band carrying the
 * dotted map sweeps up through the screen; the page changes underneath while it passes.
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

  const shown = phase !== 'idle';
  // A tall band with feathered edges travels from below the screen to above it.
  // Its solid middle covers the viewport during 'hold', while the page jumps underneath.
  const y = phase === 'cover' ? '-40vh' : phase === 'hold' ? '-48vh' : phase === 'reveal' ? '-190vh' : '100vh';
  const ms = phase === 'cover' ? COVER_MS : phase === 'hold' ? HOLD_MS : REVEAL_MS;
  const ease = phase === 'hold' ? 'linear' : EASE;
  const feather = 'linear-gradient(to bottom, transparent 0%, #000 22%, #000 78%, transparent 100%)';

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[85] overflow-hidden" style={{ visibility: shown ? 'visible' : 'hidden' }}>
      <div
        className="absolute inset-x-0 top-0 text-white"
        style={{
          height: "190vh",
          transform: `translate3d(0, ${y}, 0)`,
          transition: shown ? `transform ${ms}ms ${ease}` : 'none',
          background: 'rgba(10, 22, 64, 0.8)',
          backdropFilter: 'blur(16px) saturate(120%)',
          WebkitBackdropFilter: 'blur(16px) saturate(120%)',
          WebkitMaskImage: feather,
          maskImage: feather,
        }}
      >
        <div className="absolute inset-0 opacity-45">
          {shown && <DotMap theme="dark" hubs={allHubs} labels="none" intro={false} fit="cover" density={7.5} />}
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(60%_30%_at_50%_50%,rgba(35,64,142,0.35),transparent_70%)]" />
      </div>
    </div>
  );
}
