import { useEffect, useState } from 'react';
import DotMap from '@/components/ui/DotMap';
import Logo from '@/components/ui/Logo';
import { tickerItems } from '@/data/siteContent';
import { markReady } from '@/lib/ready';
import { allHubs } from '@/data/globe';

const regions = allHubs.map((h) => h.name);

const DURATION = 2100;
const SESSION_KEY = 'ags-intro-seen';

function shouldPlay() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return window.sessionStorage.getItem(SESSION_KEY) !== '1';
  } catch {
    return true;
  }
}

/** Intro screen: the dotted world map draws in while a counter runs to 100. Plays once per visit. */
export default function Preloader() {
  const [play] = useState(shouldPlay);
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'leaving' | 'done'>(play ? 'loading' : 'done');

  useEffect(() => {
    if (!play) {
      markReady();
      return;
    }
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        setPhase('leaving');
        markReady();
        try {
          window.sessionStorage.setItem(SESSION_KEY, '1');
        } catch {
          /* storage unavailable: the intro simply plays again next time */
        }
        window.setTimeout(() => {
          setPhase('done');
          document.documentElement.style.overflow = prevOverflow;
        }, 1000);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [play]);

  if (phase === 'done') return null;

  const regionIndex = Math.min(regions.length - 1, Math.floor((count / 101) * regions.length));
  const word = tickerItems[Math.min(tickerItems.length - 1, Math.floor((count / 101) * tickerItems.length))];

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[90] flex flex-col bg-space text-white transition-[clip-path] duration-[1000ms] ease-expo ${
        phase === 'leaving' ? '[clip-path:inset(0_0_100%_0)]' : '[clip-path:inset(0_0_0_0)]'
      }`}
    >
      <div className="container-x flex items-start justify-between pt-6 sm:pt-8">
        <Logo height={46} />
        <ul className="hidden text-right font-mono text-[12px] uppercase tracking-eyebrow sm:block">
          {tickerItems.map((item) => (
            <li key={item} className={`transition-colors duration-300 ${item === word ? 'text-white' : 'text-white/30'}`}>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex-1">
        <div className="absolute inset-x-0 top-1/2 mx-auto aspect-[2.6/1] w-full max-w-[1300px] -translate-y-1/2 px-5">
          <DotMap theme="dark" labels="none" animated={false} density={8} label="Loading" />
        </div>
        <ul className="absolute left-5 top-1/2 hidden -translate-y-1/2 font-mono text-[11px] uppercase tracking-eyebrow sm:left-8 lg:left-12 lg:block">
          {regions.map((name, i) => (
            <li key={name} className={`transition-colors duration-300 ${i === regionIndex ? 'text-white' : 'text-white/25'}`}>
              {name}
            </li>
          ))}
        </ul>
      </div>

      <div className="container-x flex items-end justify-between pb-6 sm:pb-8">
        <div className="font-mono text-[12px] uppercase tracking-eyebrow text-white/60">
          <span className="mr-2 inline-block h-2 w-2 animate-blink bg-accent2" />
          <span className="sm:hidden">{word}</span>
          <span className="hidden sm:inline">You name it · We source it</span>
        </div>
        <p className="font-display text-[64px] font-medium leading-none tabular-nums sm:text-[96px]">
          {String(count).padStart(3, '0')}
        </p>
      </div>
      <div className="h-[3px] w-full bg-white/10">
        <div className="h-full origin-left bg-accent2" style={{ transform: `scaleX(${count / 100})` }} />
      </div>
    </div>
  );
}
