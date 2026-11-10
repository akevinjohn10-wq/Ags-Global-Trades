import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import DotMap from '@/components/ui/DotMap';
import SplitText from '@/components/ui/SplitText';
import { allHubs, corridors } from '@/data/globe';
import { heroStatements } from '@/data/siteContent';
import { onReady } from '@/lib/ready';

// Which corridors light up for each statement as the visitor scrolls through the hero
const STAGES = [['middle-east', 'europe'], ['southeast-asia', 'east-asia', 'africa'], corridors.map((c) => c.id)];

/**
 * Pinned hero: giant headline over a live dotted world map. Scrolling steps through
 * three statements while new trade corridors light up (unitedcarriers.com-style pinned intro).
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [stage, setStage] = useState(0);
  const [reduce] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => onReady(() => setEntered(true)), []);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;
      setStage(Math.min(STAGES.length - 1, Math.floor(p * STAGES.length * 0.999)));
      if (titleRef.current) titleRef.current.style.transform = `translate3d(0, ${(-p * 70).toFixed(1)}px, 0)`;
      if (mapRef.current) mapRef.current.style.transform = `scale(${(1 + p * 0.08).toFixed(4)})`;
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
  }, [reduce]);

  const activeHubs = useMemo(
    () => corridors.filter((c) => STAGES[stage].includes(c.id)).flatMap((c) => c.hubs.map((h) => h.name)),
    [stage],
  );

  return (
    <section
      id="home"
      ref={sectionRef}
      aria-label="Introduction"
      className={`relative bg-paper ${reduce ? '' : 'h-[260vh]'}`}
    >
      <div className={`${reduce ? 'relative' : 'sticky top-0'} flex h-[100svh] min-h-[620px] flex-col overflow-hidden`}>
        {/* Live map */}
        <div
          ref={mapRef}
          className={`absolute inset-x-0 bottom-0 top-[42%] origin-[60%_40%] transition-opacity duration-1000 sm:top-[38%] lg:top-[30%] ${entered ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="mx-auto h-full w-full max-w-[1700px]">
            {entered && (
              <DotMap
                hubs={allHubs}
                activeHubs={activeHubs}
                interactive
                fit="cover"
                focusX={0.62}
                density={7.5}
                label="Dotted world map with trade routes from New Delhi to ports in the Middle East, Europe, Asia, Africa and the Americas"
              />
            )}
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-paper via-paper/80 to-transparent" />

        {/* Headline */}
        <div ref={titleRef} className="container-x relative z-10 pt-[132px] sm:pt-[150px]">
          <div
            className={`flex flex-wrap items-center justify-between gap-3 transition-opacity duration-700 ${entered ? 'opacity-100' : 'opacity-0'}`}
          >
            <p className="eyebrow">Import-export trading</p>
            <p className="mono-caps hidden text-soft sm:block">New Delhi · 28.61°N 77.21°E</p>
          </div>
          <SplitText
            as="h1"
            play={entered}
            delay={100}
            stagger={90}
            text={'Connecting markets.\nDelivering globally.'}
            className="mt-5 text-[11vw] font-semibold leading-[0.95] text-ink sm:text-[8.4vw] xl:text-[7.6vw] 2xl:text-[124px]"
          />
        </div>

        {/* Bottom bar: statements, actions, scroll cue */}
        <div className="container-x relative z-10 mt-auto pb-7 sm:pb-9">
          <div className="grid items-end gap-6 lg:grid-cols-12">
            <div
              className={`rounded-lg bg-paper/90 p-4 shadow-[0_10px_40px_-20px_rgba(27,30,36,0.25)] transition-all duration-1000 ease-expo sm:p-5 lg:col-span-5 ${
                entered ? 'translate-y-0 opacity-100 delay-500' : 'translate-y-6 opacity-0'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="mono-caps text-ink">{String(stage + 1).padStart(2, '0')}</span>
                <div className="flex flex-1 gap-1.5" aria-hidden="true">
                  {heroStatements.map((_, i) => (
                    <span key={i} className="h-[2px] flex-1 overflow-hidden bg-ink/10">
                      <span
                        className={`block h-full origin-left bg-accent transition-transform duration-700 ease-expo ${i <= stage ? 'scale-x-100' : 'scale-x-0'}`}
                      />
                    </span>
                  ))}
                </div>
                <span className="mono-caps text-soft">{String(heroStatements.length).padStart(2, '0')}</span>
              </div>
              <div className="relative mt-4 h-[84px] sm:h-[64px]" aria-live="polite">
                {heroStatements.map((line, i) => (
                  <p
                    key={line}
                    className={`absolute inset-0 text-[18px] font-medium leading-snug text-ink transition-all duration-700 ease-expo sm:text-[21px] ${
                      i === stage ? 'translate-y-0 opacity-100 blur-0' : i < stage ? '-translate-y-4 opacity-0 blur-sm' : 'translate-y-4 opacity-0 blur-sm'
                    }`}
                    aria-hidden={i !== stage}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <div
              className={`flex flex-wrap gap-3 transition-all duration-1000 ease-expo lg:col-span-4 lg:col-start-9 lg:justify-end ${
                entered ? 'translate-y-0 opacity-100 delay-700' : 'translate-y-6 opacity-0'
              }`}
            >
              <Button href="#contact" variant="accent">
                Get a quote
              </Button>
              <Button href="#services" variant="outline" className="bg-paper">
                Our services
              </Button>
            </div>
          </div>

          <div className="mt-6 hidden items-center justify-between border-t border-ink/10 pt-4 sm:flex">
            <span className="mono-caps text-soft">Hover a port to see the route</span>
            <a href="#about" className="mono-caps group flex items-center gap-3 text-ink">
              Scroll to explore
              <span aria-hidden="true" className="relative block h-5 w-px overflow-hidden bg-ink/15">
                <span className="absolute inset-0 animate-scrollcue bg-accent" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
