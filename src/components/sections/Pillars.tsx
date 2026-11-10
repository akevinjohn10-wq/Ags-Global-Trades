import { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Reveal from '@/components/ui/Reveal';
import SplitText from '@/components/ui/SplitText';
import { pillars } from '@/data/siteContent';

// Where each card starts (scattered) and where it settles, bluesqx-style
const START = [
  { x: -60, y: 220, r: -14 },
  { x: -20, y: 320, r: 9 },
  { x: 30, y: 260, r: -8 },
  { x: 70, y: 340, r: 12 },
];
const END = [
  { x: 0, y: 0, r: -1.5 },
  { x: 0, y: 26, r: 2 },
  { x: 0, y: -10, r: -2.5 },
  { x: 0, y: 14, r: 1.5 },
];

/** "Source + Supply": four dark cards that fly in and settle at slight angles as you scroll. */
export default function Pillars() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const desktop = window.innerWidth >= 1024;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const base = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.9)));
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        if (!desktop || reduce) {
          card.style.transform = '';
          return;
        }
        // stagger each card a little
        const local = Math.min(1, Math.max(0, (base - i * 0.07) / 0.72));
        const e = 1 - Math.pow(1 - local, 3);
        const s = START[i % START.length];
        const t = END[i % END.length];
        const x = s.x + (t.x - s.x) * e;
        const y = s.y + (t.y - s.y) * e;
        const r = s.r + (t.r - s.r) * e;
        card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${r.toFixed(2)}deg)`;
        card.style.opacity = String(Math.min(1, 0.2 + e));
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
  }, []);

  return (
    <section ref={sectionRef} aria-label="What we do" className="section-y overflow-hidden bg-paper pt-0 sm:pt-0 lg:pt-0">
      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow">What we do</p>
          </Reveal>
          <SplitText
            as="h2"
            text="Source + Supply"
            className="mt-5 text-[40px] font-semibold leading-none text-ink sm:text-[64px] lg:text-[88px]"
          />
          <Reveal delay={150}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-[1.7] text-muted sm:text-lg">
              We find, check, buy and ship the products your business needs, so you deal with one partner instead of many.
            </p>
          </Reveal>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-5">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <li
                key={pillar.title}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="will-change-transform"
              >
                <a
                  href="#services"
                  className="group relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-lg bg-ink p-7 text-white shadow-[0_30px_60px_-30px_rgba(27,30,36,0.6)] transition-colors duration-500 hover:bg-accent sm:p-8"
                >
                  <span aria-hidden="true" className="bg-dots-light pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-md bg-white/10 transition-transform duration-500 ease-expo group-hover:-rotate-6 group-hover:scale-110">
                      <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <span className="mono-caps text-white/40">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="relative mt-auto pt-16 font-display text-[34px] uppercase leading-none">{pillar.title}</h3>
                  <p className="relative mt-3 text-[15px] leading-[1.65] text-white/70 group-hover:text-white/85">{pillar.text}</p>
                  <span className="relative mt-6 flex items-center gap-2 text-[14px] font-medium">
                    Explore
                    <span className="flex h-7 w-7 items-center justify-center rounded bg-white/10 transition-transform duration-500 ease-expo group-hover:translate-x-1">
                      <ArrowUpRight size={15} strokeWidth={1.75} aria-hidden="true" />
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
