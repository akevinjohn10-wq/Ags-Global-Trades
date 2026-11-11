import { useEffect, useRef, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Globe from '@/components/ui/Globe';
import SplitText from '@/components/ui/SplitText';
import { corridors, globeRegions, homeHub, type Hub } from '@/data/globe';
import type { GlobeHandle } from '@/lib/globeEngine';
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
  const [pinned, setPinned] = useState<Hub | null>(null);
  const controls = useRef<GlobeHandle | null>(null);
  const pinnedRegion = pinned ? (pinned.name === homeHub.name ? 'Home base' : 'Sourcing & delivery') : '';

  const closePin = () => {
    setPinned(null);
    controls.current?.reset();
  };
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
      // 1) the globe turns and flies in to New Delhi (inside the WebGL scene, so it stays sharp)
      const z = Math.min(1, d / 0.7);
      controls.current?.setDive(z * z * (3 - 2 * z));
      if (copyRef.current) {
        const c = Math.min(1, d / 0.6);
        copyRef.current.style.opacity = String(1 - c);
        copyRef.current.style.transform = `translate3d(0, ${(-c * 60).toFixed(1)}px, 0)`;
      }
      // 2) after the zoom settles, a glow opens out from Delhi into the white page below
      if (skyRef.current) {
        const g = Math.min(1, Math.max(0, (d - 0.66) / 0.34));
        const k = g * g * (3 - 2 * g);
        skyRef.current.style.opacity = String(Math.min(1, k * 1.6));
        skyRef.current.style.transform = `translate(-50%, -50%) scale(${(0.02 + k * 1.2).toFixed(4)})`;
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


  return (
    <section id="home" ref={sectionRef} aria-label="Introduction" className={`relative bg-space text-white ${reduce ? '' : 'h-[280vh]'}`}>
      <div className={`${reduce ? 'relative' : 'sticky top-0'} aurora grain isolate h-[100svh] min-h-[640px] overflow-hidden`}>
        {/* Interactive globe */}
        <div
          className={`absolute inset-0 transition-opacity duration-[1400ms] ${entered ? 'opacity-100' : 'opacity-0'} ${wide ? '' : 'pointer-events-none'}`}
        >
          <div ref={mapRef} className="h-full w-full origin-[66%_50%] will-change-transform">
            {entered && (
              <Globe
                home={homeHub}
                hubs={globeRegions}
                interactive={wide}
                reduce={reduce}
                centerX={0.66}
                controlsRef={controls}
                onSelect={(h) => setPinned(h as Hub | null)}
                label="Interactive globe with routes from New Delhi to Asia, Europe, Africa and the Americas"
              />
            )}
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 hidden w-[44%] bg-gradient-to-r from-space via-space/70 to-transparent lg:block" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-space via-space/70 to-transparent lg:hidden" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-space to-transparent" />

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
              Drag the globe · click a pin
              <span aria-hidden="true" className="relative block h-5 w-px overflow-hidden bg-white/20">
                <span className="absolute inset-0 animate-scrollcue bg-white" />
              </span>
            </span>
          </div>
        </div>

        {/* Map controls */}
        <div
          className={`absolute bottom-5 right-4 z-[15] hidden lg:flex flex-col overflow-hidden rounded-md border border-white/15 bg-space/70 backdrop-blur transition-opacity duration-700 lg:bottom-24 lg:right-8 ${
            entered ? 'opacity-100' : 'opacity-0'
          } ${pinned ? 'max-lg:hidden' : ''}`}
        >
          {[
            { label: 'Centre on New Delhi', Icon: RotateCcw, run: closePin },
          ].map(({ label, Icon, run }, i) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              title={label}
              onClick={run}
              className={`flex h-9 w-9 items-center justify-center text-white/80 transition-colors hover:bg-white hover:text-ink ${i ? 'border-t border-white/15' : ''}`}
            >
              <Icon size={16} strokeWidth={1.75} />
            </button>
          ))}
        </div>

        {/* Pinned city card */}
        {pinned && (
          <div
            key={pinned.name}
            role="dialog"
            aria-label={`${pinned.name} details`}
            className="absolute inset-x-4 bottom-4 z-[15] animate-panelin rounded-lg border border-white/15 bg-space/80 p-5 backdrop-blur-md sm:inset-x-auto sm:right-6 sm:w-[320px] lg:bottom-auto lg:right-8 lg:top-28"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mono-caps text-sky">{pinnedRegion}</p>
                <p className="mt-2 font-display text-[26px] font-medium leading-none">{pinned.name}</p>
                {pinned.country && <p className="mt-1.5 text-[15px] lg:text-[16px] text-white/60">{pinned.country}</p>}
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={closePin}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/15 text-white/70 transition-colors hover:bg-white hover:text-ink"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
            {pinned.note && <p className="mt-4 text-[16px] lg:text-[17px] leading-[1.6] text-white/80">{pinned.note}</p>}
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <span className="mono-caps text-white/50">
                {pinned.name === homeHub.name ? 'AGS Trade HQ' : `Route from ${homeHub.name}`}
              </span>
              <a href="#contact" className="mono-caps text-white underline-offset-4 hover:underline">
                Enquire →
              </a>
            </div>
          </div>
        )}

        {/* Glow that opens out from New Delhi into the page below */}
        <div
          ref={skyRef}
          aria-hidden="true"
          style={{ opacity: 0, transform: 'translate(-50%, -50%) scale(0.02)' }}
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[260vmax] w-[260vmax] rounded-full will-change-transform bg-[radial-gradient(circle,#FFFFFF_0%,#FFFFFF_34%,#FFF3E4_40%,#D3DAEE_46%,rgba(93,120,194,0.55)_56%,rgba(35,64,142,0)_68%)]"
        />
      </div>
    </section>
  );
}
