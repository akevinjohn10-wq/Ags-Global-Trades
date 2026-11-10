import { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import Globe from '@/components/ui/Globe';
import SplitText from '@/components/ui/SplitText';
import { onReady } from '@/lib/ready';

/**
 * Dark hero with an interactive 3D globe. Scrolling "dives" towards the planet:
 * the globe grows, the copy fades, and a blue atmosphere rises into the white page below.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const globeRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
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
      const e = p * p * (3 - 2 * p);
      if (globeRef.current) {
        globeRef.current.style.transform = `translate3d(${(-e * 18).toFixed(2)}%, ${(e * 22).toFixed(2)}%, 0) scale(${(1 + e * 1.9).toFixed(4)})`;
      }
      if (copyRef.current) {
        const c = Math.min(1, p / 0.4);
        copyRef.current.style.opacity = String(1 - c);
        copyRef.current.style.transform = `translate3d(0, ${(-c * 60).toFixed(1)}px, 0)`;
        copyRef.current.style.filter = `blur(${(c * 6).toFixed(1)}px)`;
      }
      if (skyRef.current) {
        const s = Math.min(1, Math.max(0, (p - 0.35) / 0.65));
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

  return (
    <section
      id="home"
      ref={sectionRef}
      aria-label="Introduction"
      className={`relative bg-space text-white ${reduce ? '' : 'h-[240vh]'}`}
    >
      <div className={`${reduce ? 'relative' : 'sticky top-0'} h-[100svh] min-h-[640px] overflow-hidden`}>
        {/* Stars */}
        <div aria-hidden="true" className="stars pointer-events-none absolute inset-0 opacity-70" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_75%_55%,rgba(170,176,190,0.12),transparent_70%)]"
        />

        {/* Globe */}
        <div
          className={`absolute bottom-[-30vw] left-1/2 aspect-square w-[150vw] -translate-x-1/2 transition-opacity duration-[1600ms] sm:bottom-[-34vw] sm:w-[118vw] lg:bottom-auto lg:left-auto lg:right-[-14vw] lg:top-[-4vh] lg:w-[min(78vw,1400px)] lg:translate-x-0 ${
            entered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div ref={globeRef} className="h-full w-full origin-center will-change-transform">
            <Globe />
          </div>
        </div>

        {/* Copy */}
        <div ref={copyRef} className="container-x pointer-events-none relative z-10 flex h-full flex-col justify-start pb-10 pt-32 sm:justify-end sm:pb-16 lg:justify-center lg:pb-0 lg:pt-24">
          <div className={`transition-all duration-1000 ease-expo ${entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <p className="eyebrow eyebrow-light">Sourcing &amp; supply</p>
          </div>
          <SplitText
            as="h1"
            play={entered}
            delay={150}
            stagger={110}
            text={'Sourced.\nChecked.\nDelivered.'}
            className="mt-5 text-[15vw] font-medium leading-[0.9] sm:text-[12vw] lg:text-[8.2vw] 2xl:text-[132px] [&_.block:last-child]:text-white/40"
          />
          <div
            className={`mt-7 max-w-md transition-all delay-700 duration-1000 ease-expo ${entered ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
          >
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

        {/* Bottom strip */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden sm:block">
          <div className="container-x flex items-center justify-between pb-6">
            <span className="mono-caps text-white/45">Drag the globe</span>
            <span className="mono-caps flex items-center gap-3 text-white/70">
              Scroll to explore
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
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-full bg-[linear-gradient(to_top,#FFFFFF_0%,#FFFFFF_28%,#E6E8EC_42%,#8D929D_62%,rgba(40,43,50,0.7)_80%,rgba(40,43,50,0)_100%)]"
        />
      </div>
    </section>
  );
}
