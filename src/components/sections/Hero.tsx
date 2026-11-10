import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import DotMap from '@/components/ui/DotMap';
import Particles from '@/components/ui/Particles';
import SplitText from '@/components/ui/SplitText';
import { allHubs, corridors } from '@/data/globe';
import { onReady } from '@/lib/ready';

// Which regions light up as the visitor scrolls through the hero
const STAGES = [['east-asia', 'asia-pacific'], ['europe', 'africa'], corridors.map((c) => c.id)];
const STAGE_LABELS = ['Sourcing across Asia-Pacific', 'Supplying Europe & Africa', 'Delivering worldwide'];

/**
 * Dark hero over an interactive dotted world map. Scrolling lights up new sourcing routes,
 * then zooms towards New Delhi while a blue atmosphere rises into the white page below.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [stage, setStage] = useState(0);
  // Whole world on wide screens; cropped around New Delhi on narrow ones
  const [wide] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
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
      // first 60%: step through the route stages; last 40%: dive into the page
      setStage(Math.min(STAGES.length - 1, Math.floor((p / 0.6) * STAGES.length)));
      const d = Math.min(1, Math.max(0, (p - 0.6) / 0.4));
      const e = d * d * (3 - 2 * d);
      const base = window.innerWidth >= 1024 ? 1.12 : 1;
      if (mapRef.current) mapRef.current.style.transform = `scale(${(base + e * 1.4).toFixed(4)})`;
      if (copyRef.current) {
        const c = Math.min(1, d / 0.6);
        copyRef.current.style.opacity = String(1 - c);
        copyRef.current.style.transform = `translate3d(0, ${(-c * 60).toFixed(1)}px, 0)`;
        copyRef.current.style.filter = `blur(${(c * 6).toFixed(1)}px)`;
      }
      if (skyRef.current) {
        const s = Math.min(1, Math.max(0, (d - 0.25) / 0.75));
        skyRef.current.style.transform = `translate3d(0, ${((1 - s) * 100).toFixed(2)}%, 0)`;
      }
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

  // Every route stays lit, like a live network
  const activeHubs = useMemo(() => allHubs.map((h) => h.name), []);

  return (
    <section id="home" ref={sectionRef} aria-label="Introduction" className={`relative bg-space text-white ${reduce ? '' : 'h-[280vh]'}`}>
      <div className={`${reduce ? 'relative' : 'sticky top-0'} aurora grain isolate h-[100svh] min-h-[640px] overflow-hidden`}>
        <Particles />
        <div aria-hidden="true" className="stars pointer-events-none absolute inset-0 opacity-50" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_68%_48%,rgba(35,64,142,0.32),transparent_70%)]"
        />

        {/* Interactive map */}
        <div
          className={`absolute inset-x-0 bottom-0 top-[46%] transition-opacity duration-[1400ms] sm:top-[34%] lg:inset-y-0 lg:left-[26%] lg:right-[-2%] ${
            entered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div ref={mapRef} className="h-full w-full origin-[62%_45%] will-change-transform">
            {entered && (
              <DotMap
                theme="dark"
                hubs={allHubs}
                activeHubs={activeHubs}
                interactive
                fit={wide ? 'width' : 'cover'}
                focusX={0.6}
                density={wide ? 6.5 : 7.5}
                label="Interactive dotted world map with routes from New Delhi to sourcing and delivery cities"
              />
            )}
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 hidden w-[55%] bg-gradient-to-r from-space via-space/80 to-transparent lg:block" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-space to-transparent" />

        {/* Copy */}
        <div
          ref={copyRef}
          className="container-x pointer-events-none relative z-10 flex h-full flex-col justify-start pb-10 pt-32 lg:justify-center lg:pb-0 lg:pt-24"
        >
          <div className={`transition-all duration-1000 ease-expo ${entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <p className="eyebrow eyebrow-light">Sourcing &amp; supply</p>
          </div>
          <SplitText
            as="h1"
            play={entered}
            delay={150}
            stagger={110}
            text={'Sourced.\nChecked.\nDelivered.'}
            className="sheen mt-5 text-[15vw] font-medium leading-[0.92] sm:text-[11vw] lg:text-[7.6vw] 2xl:text-[124px] [&_.block:last-child]:text-sky"
          />
          <div className={`mt-7 max-w-md transition-all delay-700 duration-1000 ease-expo ${entered ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            <p className="text-[16px] leading-[1.65] text-white/75 sm:text-[18px]">
              Tell us the product and the quantity. We find verified suppliers, check the goods and ship them to your door.
            </p>
            <div className="pointer-events-auto mt-8 flex flex-wrap gap-3">
              <Button href="#contact" variant="light">
                Request a quote
              </Button>
              <Button href="#catalogue" variant="outline-light">
                What we source
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom strip: current route stage */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden lg:block [@media(max-height:860px)]:!hidden">
          <div className="container-x flex items-center justify-between gap-6 pb-6">
            <div className="flex items-center gap-4">
              <span className="mono-caps text-white/80">{String(stage + 1).padStart(2, '0')}</span>
              <span className="flex gap-1.5" aria-hidden="true">
                {STAGES.map((_, i) => (
                  <span key={i} className="h-[2px] w-10 overflow-hidden bg-white/15">
                    <span className={`block h-full origin-left bg-white transition-transform duration-700 ease-expo ${i <= stage ? 'scale-x-100' : 'scale-x-0'}`} />
                  </span>
                ))}
              </span>
              <span key={stage} className="mono-caps animate-panelin text-white/60" aria-live="polite">
                {STAGE_LABELS[stage]}
              </span>
            </div>
            <span className="mono-caps hidden items-center gap-3 text-white/60 md:flex">
              Hover a city · scroll to explore
              <span aria-hidden="true" className="relative block h-5 w-px overflow-hidden bg-white/20">
                <span className="absolute inset-0 animate-scrollcue bg-white" />
              </span>
            </span>
          </div>
        </div>

        {/* Atmosphere that rises as you dive in */}
        <div
          ref={skyRef}
          aria-hidden="true"
          style={{ transform: 'translate3d(0, 100%, 0)' }}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-full bg-[linear-gradient(to_top,#FFFFFF_0%,#FFFFFF_28%,#D3DAEE_42%,#5D78C2_62%,rgba(35,64,142,0.65)_80%,rgba(35,64,142,0)_100%)]"
        />
      </div>
    </section>
  );
}
