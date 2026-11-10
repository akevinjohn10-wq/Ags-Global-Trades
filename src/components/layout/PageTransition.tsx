import { useEffect, useRef, useState } from 'react';
import DotMap from '@/components/ui/DotMap';
import Logo from '@/components/ui/Logo';
import { allHubs } from '@/data/globe';

type Phase = 'idle' | 'cover' | 'hold' | 'reveal';

const COVER_MS = 650;
const HOLD_MS = 950;
const REVEAL_MS = 750;
const EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';

/**
 * Page transition for long jumps between sections: a blue sheet and a dark navy sheet wipe up,
 * the dotted map fades in while the trade routes draw out from New Delhi, the AGS logo and the
 * destination appear, then everything lifts away to reveal the new section.
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
      // Short hops just scroll smoothly; long jumps get the transition
      if (Math.abs(top - window.scrollY) < window.innerHeight * 1.6) return;

      event.preventDefault();
      busy.current = true;
      setLabel(link.textContent?.trim() || id);
      setPhase('cover');
      window.setTimeout(() => {
        window.scrollTo({ top: id === 'home' ? 0 : top, behavior: 'instant' as ScrollBehavior });
        history.replaceState(null, '', `#${id}`);
        setPhase('hold');
      }, COVER_MS + 100);
      window.setTimeout(() => setPhase('reveal'), COVER_MS + 100 + HOLD_MS);
      window.setTimeout(() => {
        setPhase('idle');
        busy.current = false;
      }, COVER_MS + 100 + HOLD_MS + REVEAL_MS + 150);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const covered = phase === 'cover' || phase === 'hold';
  const shown = phase !== 'idle';
  const clip = covered ? 'inset(0 0 0 0)' : phase === 'reveal' ? 'inset(0 0 100% 0)' : 'inset(100% 0 0 0)';
  const sheet = (delayIn: number, delayOut: number) => ({
    clipPath: clip,
    transition:
      phase === 'idle'
        ? 'none'
        : `clip-path ${covered ? COVER_MS : REVEAL_MS}ms ${EASE} ${covered ? delayIn : delayOut}ms`,
  });
  // Inner content appears once the sheet is up and leaves just before it lifts
  const content = phase === 'hold';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[85]"
      style={{ visibility: shown ? 'visible' : 'hidden' }}
    >
      {/* Leading blue sheet */}
      <div className="absolute inset-0 bg-accent" style={sheet(0, 140)} />

      {/* Dark navy sheet with the map */}
      <div className="aurora grain absolute inset-0 isolate overflow-hidden bg-space text-white" style={sheet(110, 0)}>
        <div
          className="absolute inset-0 transition-[opacity,transform] duration-[1200ms] ease-expo"
          style={{ opacity: content ? 0.85 : 0, transform: content ? 'scale(1)' : 'scale(1.08)' }}
        >
          {shown && <DotMap theme="dark" hubs={allHubs} labels="none" intro={false} fit="cover" density={7.5} />}
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(45%_40%_at_50%_50%,rgba(5,7,15,0.85),rgba(5,7,15,0.2)_70%,transparent)]" />

        <div className="relative flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
          <div
            className="transition-[opacity,transform,filter] duration-500 ease-expo"
            style={{
              opacity: content ? 1 : 0,
              transform: content ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.94)',
              filter: content ? 'blur(0)' : 'blur(6px)',
            }}
          >
            <Logo height={84} />
          </div>
          <div
            className="flex flex-col items-center gap-3 transition-[opacity,transform] delay-100 duration-500 ease-expo"
            style={{ opacity: content ? 1 : 0, transform: content ? 'translateY(0)' : 'translateY(16px)' }}
          >
            <span className="mono-caps text-sky/80">Heading to</span>
            <p className="font-display text-[40px] font-medium leading-none tracking-display sm:text-[64px]">{label}</p>
          </div>
          {/* Progress line */}
          <span className="mt-2 block h-px w-40 overflow-hidden bg-white/15">
            <span
              className="block h-full origin-left bg-white"
              style={{
                transform: `scaleX(${content || phase === 'reveal' ? 1 : 0})`,
                transition: content ? `transform ${HOLD_MS}ms linear` : 'none',
              }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
