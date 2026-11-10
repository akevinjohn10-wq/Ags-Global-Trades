import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Handshake, Receipt, Truck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Forklift, ShipTop, TruckSide, TruckTop } from '@/components/story/Drawings';
import { services } from '@/data/siteContent';

const VALUES = [
  { title: 'Verified suppliers', text: 'Every maker is checked before we place your order.', icon: BadgeCheck },
  { title: 'One point of contact', text: 'A named manager from enquiry to delivery.', icon: Handshake },
  { title: 'Clear, honest quotes', text: 'Product, packing and shipping in one price.', icon: Receipt },
  { title: 'Shipping handled', text: 'Booked with trusted shipping and courier partners.', icon: Truck },
];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);

/**
 * The scroll story: an order is loaded onto a truck, drives past everything we do,
 * runs down the road to port and sails off — all scrubbed by the visitor's scroll.
 */
export default function Story() {
  const sectionRef = useRef<HTMLElement>(null);
  const r = {
    forklift: useRef<HTMLDivElement>(null),
    truck: useRef<HTMLDivElement>(null),
    ground: useRef<HTMLDivElement>(null),
    giant: useRef<HTMLParagraphElement>(null),
    bandCopy: useRef<HTMLDivElement>(null),
    strip: useRef<HTMLDivElement>(null),
    stripWrap: useRef<HTMLDivElement>(null),
    loadCopy: useRef<HTMLDivElement>(null),
    road: useRef<HTMLDivElement>(null),
    truckTop: useRef<HTMLDivElement>(null),
    roadCopy: useRef<HTMLDivElement>(null),
    sea: useRef<HTMLDivElement>(null),
    ship: useRef<HTMLDivElement>(null),
    seaTitle: useRef<HTMLDivElement>(null),
    values: useRef<HTMLUListElement>(null),
    clouds: useRef<HTMLDivElement>(null),
  };
  const [reduce] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const set = (el: HTMLElement | null, css: Partial<CSSStyleDeclaration>) => {
      if (el) Object.assign(el.style, css);
    };

    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = span > 0 ? clamp(-rect.top / span) : 0;
      const W = window.innerWidth;
      const mobile = W < 768;

      // ---- Scene A: loading (0 → 0.2) -------------------------------------------
      const approach = ease(seg(p, 0, 0.09));
      const raise = ease(seg(p, 0.08, 0.13));
      const placed = seg(p, 0.13, 0.16);
      const leave = ease(seg(p, 0.15, 0.2));
      const fx = -40 + approach * (mobile ? 30 : 55) - leave * 70; // vw
      set(r.forklift.current, { transform: `translate3d(${fx}vw, 0, 0)` });
      const carriage = r.forklift.current?.querySelector('[data-carriage]');
      carriage?.setAttribute('transform', `translate(0 ${(-raise * 70).toFixed(1)})`);
      const crate = r.forklift.current?.querySelector<SVGGElement>('[data-crate]');
      if (crate) crate.style.opacity = String(1 - placed);
      set(r.loadCopy.current, { opacity: String(1 - seg(p, 0.16, 0.22)) });

      // ---- Scene B: services band (0.2 → 0.5) --------------------------------------
      const bandUp = ease(seg(p, 0.18, 0.26));
      const groundH = 22 + bandUp * (mobile ? 46 : 36); // % of viewport height
      set(r.ground.current, { height: `${groundH}%` });
      const drive = seg(p, 0.24, 0.5);
      const parked = mobile ? 4 : 30;
      const tx = parked + drive * drive * (mobile ? 110 : 90); // vw
      set(r.truck.current, { transform: `translate3d(${tx}vw, 0, 0)`, bottom: `${groundH}%` });
      set(r.forklift.current, { bottom: `${groundH}%` });
      set(r.giant.current, {
        transform: `translate3d(${(30 - seg(p, 0.16, 0.5) * 120).toFixed(2)}vw, 0, 0)`,
        bottom: `${groundH}%`,
        opacity: String(seg(p, 0.16, 0.2)),
      });
      const bandIn = seg(p, 0.24, 0.29);
      set(r.bandCopy.current, { opacity: String(bandIn), transform: `translate3d(0, ${(1 - bandIn) * 30}px, 0)` });
      const strip = r.strip.current;
      const wrap = r.stripWrap.current;
      if (strip && wrap) {
        const travel = Math.max(0, strip.scrollWidth - wrap.clientWidth);
        const s = ease(seg(p, 0.28, 0.49));
        strip.style.transform = `translate3d(${(-s * travel).toFixed(1)}px, 0, 0)`;
        wrap.style.opacity = String(bandIn);
      }

      // ---- Scene C: top-down road (0.5 → 0.7) -------------------------------------
      const roadIn = seg(p, 0.49, 0.53);
      set(r.road.current, { opacity: String(roadIn), visibility: roadIn > 0 ? 'visible' : 'hidden' });
      const down = seg(p, 0.52, 0.72);
      set(r.truckTop.current, { transform: `translate3d(-50%, ${(-40 + down * 160).toFixed(2)}vh, 0)` });
      const rc = seg(p, 0.54, 0.58) * (1 - seg(p, 0.68, 0.71));
      set(r.roadCopy.current, { opacity: String(rc), transform: `translate3d(0, ${(1 - rc) * 24}px, 0)` });

      // ---- Scene D: open sea (0.7 → 1) --------------------------------------------
      const seaIn = ease(seg(p, 0.68, 0.74));
      set(r.sea.current, { clipPath: `inset(${((1 - seaIn) * 100).toFixed(2)}% 0 0 0)`, visibility: seaIn > 0 ? 'visible' : 'hidden' });
      const sail = seg(p, 0.71, 1);
      set(r.ship.current, { transform: `translate3d(-50%, ${(70 - sail * 150).toFixed(2)}vh, 0)` });
      const st = seg(p, 0.74, 0.8) * (1 - seg(p, 0.93, 0.97));
      set(r.seaTitle.current, { opacity: String(st), transform: `translate3d(0, ${(1 - st) * 30}px, 0) scale(${(0.96 + st * 0.04).toFixed(3)})` });
      const items = r.values.current?.children;
      if (items) {
        Array.from(items).forEach((item, i) => {
          const v = seg(p, 0.8 + i * 0.025, 0.84 + i * 0.025) * (1 - seg(p, 0.94, 0.98));
          (item as HTMLElement).style.opacity = String(v);
          (item as HTMLElement).style.transform = `translate3d(0, ${((1 - v) * 20).toFixed(1)}px, 0)`;
        });
      }
      set(r.clouds.current, { opacity: String(ease(seg(p, 0.92, 1))) });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  if (reduce) return <StoryStatic />;

  return (
    <section ref={sectionRef} id="services" aria-label="Our services" className="relative h-[820vh] scroll-mt-0 bg-paper">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* ---------- Scene A + B (side view) ---------- */}
        <div className="absolute inset-0">
          <div ref={r.loadCopy} className="container-x relative z-10 pt-28 sm:pt-32">
            <p className="eyebrow">Our services</p>
            <p className="mt-4 max-w-xl font-display text-[30px] font-semibold uppercase leading-none text-ink sm:text-[48px]">
              Every order, packed and on its way.
            </p>
          </div>

          {/* giant outline title behind the truck */}
          <p
            ref={r.giant}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 whitespace-nowrap font-display text-[26vw] font-semibold uppercase leading-[0.78] text-transparent [-webkit-text-stroke:2px_#DCE1EB] sm:text-[18vw]"
          >
            Our services
          </p>

          <div ref={r.forklift} className="absolute left-0 z-20 w-[46vw] max-w-[300px] sm:w-[24vw]" style={{ bottom: '22%' }}>
            <Forklift className="block h-auto w-full" />
          </div>
          <div ref={r.truck} className="absolute left-0 z-10 w-[92vw] max-w-[640px] sm:w-[48vw]" style={{ bottom: '22%' }}>
            <TruckSide className="block h-auto w-full" />
          </div>

          {/* the road / dark band */}
          <div ref={r.ground} className="absolute inset-x-0 bottom-0 z-[5] overflow-hidden bg-ink text-white" style={{ height: '22%' }}>
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.5)_0_40px,transparent_40px_80px)]" />
            <div className="container-x flex h-full flex-col gap-6 pb-8 pt-8 lg:flex-row lg:items-start lg:gap-12 lg:pt-12">
              <div ref={r.bandCopy} className="shrink-0 lg:w-[34%]" style={{ opacity: 0 }}>
                <h2 className="text-[26px] font-semibold leading-[0.98] text-white sm:text-[44px]">
                  Everything your order needs.
                  <span className="block text-white/40">Under one roof.</span>
                </h2>
                <p className="mt-4 hidden max-w-sm text-[15px] leading-[1.65] text-white/60 sm:block">
                  From finding the maker to the day it arrives, one accountable team handles every step of your order.
                </p>
                <div className="mt-6 hidden sm:block">
                  <Button href="#contact" variant="outline-light">
                    Request a quote
                  </Button>
                </div>
              </div>
              <div ref={r.stripWrap} className="min-w-0 flex-1 overflow-hidden" style={{ opacity: 0 }}>
                <div ref={r.strip} className="flex w-max gap-4 will-change-transform">
                  {services.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <article key={s.title} className="w-[72vw] max-w-[300px] shrink-0 border-l border-white/15 pl-5 sm:w-[260px]">
                        <div className="flex items-center gap-3">
                          <Icon size={22} strokeWidth={1.5} aria-hidden="true" className="text-sky" />
                          <span className="mono-caps text-white/40">{String(i + 1).padStart(2, '0')}</span>
                        </div>
                        <h3 className="mt-4 font-display text-[22px] uppercase leading-tight">{s.title}</h3>
                        <p className="mt-2 text-[14px] leading-[1.6] text-white/60">{s.description}</p>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Scene C (road from above) ---------- */}
        <div ref={r.road} className="absolute inset-0 z-20 bg-paper" style={{ opacity: 0, visibility: 'hidden' }}>
          <div className="absolute inset-y-0 left-[82%] w-[84px] -translate-x-1/2 bg-ink sm:left-1/2 sm:w-[160px]">
            <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.6)_0_36px,transparent_36px_72px)]" />
          </div>
          <div ref={r.truckTop} className="absolute left-[82%] top-0 w-[44px] sm:left-1/2 sm:w-[68px]" style={{ transform: 'translate3d(-50%, -40vh, 0)' }}>
            <TruckTop className="block h-auto w-full" />
          </div>
          <div ref={r.roadCopy} className="container-x pointer-events-none relative grid h-full items-center gap-6 sm:grid-cols-2" style={{ opacity: 0 }}>
            <div className="self-start pr-[30%] pt-28 sm:self-center sm:pr-[110px] sm:pt-0">
              <p className="eyebrow">On the road</p>
              <p className="mt-4 font-display text-[34px] font-semibold uppercase leading-[0.95] text-ink sm:text-[56px]">
                Reliable at <span className="text-soft">every step.</span>
              </p>
            </div>
            <div className="self-end pb-16 pr-[30%] sm:self-center sm:justify-self-end sm:pb-0 sm:pl-[110px] sm:pr-0">
              <p className="mono-caps text-accent">Tracking shared</p>
              <p className="mt-3 max-w-xs text-[16px] leading-[1.65] text-muted">
                From the supplier&rsquo;s door to yours, you get updates at every milestone.
              </p>
            </div>
          </div>
        </div>

        {/* ---------- Scene D (open sea) ---------- */}
        <div ref={r.sea} className="sea absolute inset-0 z-30" style={{ clipPath: 'inset(100% 0 0 0)', visibility: 'hidden' }}>
          <div ref={r.ship} className="absolute left-1/2 top-0 w-[110px] sm:w-[150px]" style={{ transform: 'translate3d(-50%, 70vh, 0)' }}>
            <div aria-hidden="true" className="absolute left-1/2 top-[96%] h-[60vh] w-[60%] -translate-x-1/2 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.55),transparent)] blur-md" />
            <ShipTop className="relative block h-auto w-full" />
          </div>

          <div className="container-x relative flex h-full flex-col items-center justify-between py-28 text-center text-white sm:py-24">
            <div ref={r.seaTitle} style={{ opacity: 0 }}>
              <p className="eyebrow eyebrow-light justify-center [&::before]:bg-white">Why AGS Trade</p>
              <h2 className="mx-auto mt-4 max-w-3xl text-[34px] font-semibold leading-[0.95] sm:text-[60px] lg:text-[76px]">
                Sourcing that works as hard as you do.
              </h2>
            </div>
            <ul ref={r.values} className="grid w-full max-w-5xl grid-cols-2 gap-x-6 gap-y-6 sm:gap-x-[260px] lg:gap-x-[320px]">
              {VALUES.map((v, i) => {
                const Icon = v.icon;
                return (
                  <li key={v.title} className={`text-left ${i % 2 ? 'sm:text-left' : 'sm:text-right'}`} style={{ opacity: 0 }}>
                    <Icon size={22} strokeWidth={1.5} aria-hidden="true" className={`text-sky ${i % 2 ? '' : 'sm:ml-auto'}`} />
                    <p className="mt-3 font-display text-[16px] uppercase leading-tight sm:text-[20px]">{v.title}</p>
                    <p className="mt-1.5 text-[13px] leading-[1.55] text-white/70 sm:text-[15px]">{v.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
          <div ref={r.clouds} aria-hidden="true" className="clouds pointer-events-none absolute inset-0" style={{ opacity: 0 }} />
        </div>
      </div>
    </section>
  );
}

/** Same content without motion, for visitors who prefer reduced motion. */
function StoryStatic() {
  return (
    <section id="services" aria-label="Our services" className="scroll-mt-24">
      <div className="bg-ink py-20 text-white">
        <div className="container-x">
          <p className="eyebrow eyebrow-light">Our services</p>
          <h2 className="mt-4 text-[32px] font-semibold leading-none sm:text-[48px]">Everything your order needs. Under one roof.</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <article key={s.title} className="border-l border-white/15 pl-5">
                <h3 className="font-display text-[22px] uppercase">{s.title}</h3>
                <p className="mt-2 text-[15px] text-white/65">{s.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-accent py-20 text-white">
        <div className="container-x">
          <h2 className="text-[32px] font-semibold leading-none sm:text-[48px]">Sourcing that works as hard as you do.</h2>
          <ul className="mt-10 grid gap-8 sm:grid-cols-2">
            {VALUES.map((v) => (
              <li key={v.title}>
                <p className="font-display text-[20px] uppercase">{v.title}</p>
                <p className="mt-1 text-white/75">{v.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
