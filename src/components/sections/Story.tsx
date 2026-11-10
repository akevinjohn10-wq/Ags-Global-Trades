import { useEffect, useMemo, useRef, useState } from 'react';
import { BadgeCheck, Handshake, Receipt, Truck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { services } from '@/data/siteContent';

const VALUES = [
  { title: 'Verified suppliers', text: 'Every maker is checked before we place your order.', icon: BadgeCheck },
  { title: 'One point of contact', text: 'A named manager from enquiry to delivery.', icon: Handshake },
  { title: 'Clear, honest quotes', text: 'Product, packing and shipping in one price.', icon: Receipt },
  { title: 'Shipping handled', text: 'Booked with trusted shipping and courier partners.', icon: Truck },
];

// Road and sea legs come from the AGS brand film (public/story/001-120.webp, 24 fps)
const FRAME_COUNT = 120;
const ROAD = [0, 59];
const SEA = [60, 119];
const frameSrc = (i: number) => `/story/${String(i + 1).padStart(3, '0')}.webp`;
const PART = (n: string) => `/story/parts/${n}.webp`;

// Scroll share of each leg
const P_LOAD = 0.3;
const P_ROAD = 0.52;
const P_SEA = 0.74;
const LABELS = ['Loaded', 'On the road', 'At sea', 'By air'];

// Sprite geometry, in units of the truck's height (H). Measured from the cut-out renders.
const TRUCK_W = 1188 / 556; // truck width
const FORK_H = 0.66; // forklift height
const FORK_W = FORK_H * (963 / 577);
const SF = FORK_H / 577; // forklift pixel → H
const CARRIAGE = { left: 668 * SF, top: 222 * SF, w: 295 * SF, h: 326 * SF };
const FORK_TOP = (577 - 512) * SF; // top of the forks above the ground
const CRATE_W = 0.44;
const CRATE_H = CRATE_W * (498 / 900);
const CRATE_OFFSET = 690 * SF; // crate's left edge relative to the forklift's left edge
const TRUCK_FLOOR = 0.28; // cargo floor above the ground
const LIFT = TRUCK_FLOOR - FORK_TOP + 0.012;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0 → 1 → 0 over [a, b], holding at 1 in the middle */
const window01 = (p: number, a: number, b: number, edge = 0.25) => {
  const t = seg(p, a, b);
  return ease(Math.min(clamp(t / edge), clamp((1 - t) / edge)));
};

/** Soft cloud layer: many blurred white ellipses painted as one background. */
function cloudLayer(seed: number, count: number, alpha: number, minW: number, maxW: number) {
  let x = seed;
  const rnd = () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const cx = (rnd() * 120 - 10).toFixed(1);
    const cy = (rnd() * 100).toFixed(1);
    const w = (minW + rnd() * (maxW - minW)).toFixed(1);
    const h = (Number(w) * (0.45 + rnd() * 0.3)).toFixed(1);
    const a = (alpha * (0.6 + rnd() * 0.4)).toFixed(2);
    parts.push(`radial-gradient(${w}vw ${h}vw at ${cx}% ${cy}%, rgba(255,255,255,${a}) 0%, rgba(255,255,255,${(Number(a) * 0.55).toFixed(2)}) 38%, rgba(255,255,255,0) 70%)`);
  }
  return parts.join(',');
}

/**
 * The scroll story. On a white page the forklift loads the crate into the AGS truck and the truck
 * drives off; the road and sea legs play from the brand film; then the AGS plane climbs through
 * the clouds, which close over the screen and open onto the white product section below.
 */
export default function Story() {
  const [reduce] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (reduce) return <StoryStatic />;
  return <StoryFilm />;
}

function StoryFilm() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dipRef = useRef<HTMLDivElement>(null);
  // loading scene
  const loadRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLDivElement>(null);
  const laneRef = useRef<HTMLDivElement>(null);
  const truckRef = useRef<HTMLDivElement>(null);
  const forkRef = useRef<HTMLDivElement>(null);
  const carriageRef = useRef<HTMLImageElement>(null);
  const crateRef = useRef<HTMLImageElement>(null);
  // sky scene
  const skyRef = useRef<HTMLDivElement>(null);
  const skyLightRef = useRef<HTMLDivElement>(null);
  const cloudsBackRef = useRef<HTMLDivElement>(null);
  const cloudsFrontRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const bankRef = useRef<HTMLDivElement>(null);
  const copyRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const serviceRefs = useRef<(HTMLLIElement | null)[]>([]);
  const valueRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [scene, setScene] = useState(0);

  const clouds = useMemo(
    () => ({
      back: cloudLayer(7, 44, 0.5, 10, 30),
      front: cloudLayer(31, 34, 0.8, 12, 36),
    }),
    [],
  );

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ---------- film frames ----------
    const images: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
    const loaded = new Array(FRAME_COUNT).fill(false);
    let current = -1;
    let wanted = 0;
    let started = false;
    const load = (i: number) => {
      if (images[i]) return;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        loaded[i] = true;
        if (Math.abs(i - wanted) < 6) draw(true);
      };
      img.src = frameSrc(i);
      images[i] = img;
    };
    const loadAll = () => {
      if (started) return;
      started = true;
      for (const step of [12, 6, 3, 1]) for (let i = 0; i < FRAME_COUNT; i += step) load(i);
    };
    const io = new IntersectionObserver(([e]) => e.isIntersecting && loadAll(), { rootMargin: '120% 0px' });
    io.observe(section);

    function nearestLoaded(i: number) {
      for (let d = 0; d < FRAME_COUNT; d++) {
        if (i - d >= 0 && loaded[i - d]) return i - d;
        if (i + d < FRAME_COUNT && loaded[i + d]) return i + d;
      }
      return -1;
    }
    function draw(force = false) {
      const i = nearestLoaded(wanted);
      if (i < 0 || (i === current && !force)) return;
      current = i;
      const img = images[i]!;
      const cw = canvas!.width;
      const ch = canvas!.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const cover = Math.max(cw / iw, ch / ih);
      const w = iw * cover;
      const h = ih * cover;
      ctx!.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      if (cw / ch < 1) {
        // Portrait: dim the full-bleed copy and lay a larger, centred film over it
        ctx!.fillStyle = 'rgba(5,7,15,0.55)';
        ctx!.fillRect(0, 0, cw, ch);
        const fit = (cw / iw) * 1.55;
        ctx!.drawImage(img, (cw - iw * fit) / 2, (ch - ih * fit) / 2, iw * fit, ih * fit);
      }
    }

    // ---------- layout ----------
    let H = 200;
    let T = 600;
    let vw = 1440;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      current = -1;
      vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw < 768;
      H = mobile ? vw * 0.24 : Math.min(vh * 0.26, vw * 0.15);
      T = vw * (mobile ? 0.38 : 0.5);
      const stage = loadRef.current;
      if (stage) stage.style.setProperty('--h', `${H}px`);
      draw(true);
      update();
    };

    const set = (el: HTMLElement | null, css: Partial<CSSStyleDeclaration>) => {
      if (el) Object.assign(el.style, css);
    };

    let raf = 0;
    function update() {
      raf = 0;
      const rect = section!.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = span > 0 ? clamp(-rect.top / span) : 0;
      setScene(p < P_LOAD ? 0 : p < P_ROAD ? 1 : p < P_SEA ? 2 : 3);

      // ---- Leg 1: loading on the white page ----
      const l = seg(p, 0, P_LOAD);
      const startX = -FORK_W * H - CRATE_W * H - 40;
      const readyX = T - (CRATE_OFFSET + CRATE_W + 0.04) * H;
      const pushedX = T - (CRATE_OFFSET - 0.06) * H;
      let forkX = lerp(startX, readyX, easeOut(seg(l, 0, 0.3)));
      forkX = lerp(forkX, pushedX, ease(seg(l, 0.45, 0.62)));
      forkX = lerp(forkX, startX, easeIn(seg(l, 0.68, 0.86)));
      const lift = (ease(seg(l, 0.3, 0.44)) - ease(seg(l, 0.63, 0.72))) * LIFT * H;
      const truckX = T + easeIn(seg(l, 0.74, 0.95)) * (vw - T + 40);
      const crateIn = l > 0.63;
      set(forkRef.current, { transform: `translate3d(${forkX.toFixed(1)}px,0,0)` });
      set(carriageRef.current, { transform: `translate3d(0,${(-lift).toFixed(1)}px,0)` });
      set(crateRef.current, {
        transform: `translate3d(${(forkX + CRATE_OFFSET * H).toFixed(1)}px,${(-(FORK_TOP * H) - lift).toFixed(1)}px,0)`,
        opacity: crateIn ? '0' : '1',
      });
      set(truckRef.current, { transform: `translate3d(${truckX.toFixed(1)}px,0,0)` });
      // lane dashes slide as the truck pulls away, then the road rises to fill the screen
      set(laneRef.current, { backgroundPositionX: `${(-easeIn(seg(l, 0.74, 1)) * 600).toFixed(0)}px` });
      set(groundRef.current, { height: `${(22 + ease(seg(l, 0.86, 1)) * 78).toFixed(2)}%` });
      set(loadRef.current, { visibility: p < P_LOAD + 0.005 ? 'visible' : 'hidden' });

      // ---- Legs 2 and 3: film ----
      if (p >= P_LOAD && p < P_SEA) {
        const road = p < P_ROAD;
        const t = road ? seg(p, P_LOAD, P_ROAD) : seg(p, P_ROAD, P_SEA);
        const [a, b] = road ? ROAD : SEA;
        wanted = Math.round(a + t * (b - a));
        draw();
      }
      let dip = 0;
      for (const b of [P_LOAD, P_ROAD, P_SEA]) dip = Math.max(dip, 1 - Math.abs(p - b) / 0.02);
      set(dipRef.current, { opacity: String(clamp(dip) * 0.9) });

      // ---- Leg 4: the plane climbs through the clouds into the page below ----
      const u = seg(p, P_SEA, 1);
      set(skyRef.current, { visibility: p > P_SEA - 0.005 ? 'visible' : 'hidden' });
      set(skyLightRef.current, { opacity: String(ease(seg(u, 0.25, 0.85))) });
      set(cloudsBackRef.current, { transform: `translate3d(0,${(-60 + u * 90).toFixed(2)}%,0)` });
      set(cloudsFrontRef.current, { transform: `translate3d(0,${(-70 + u * 130).toFixed(2)}%,0)` });
      const rise = lerp(75, 2, easeOut(seg(u, 0, 0.4))) - easeIn(seg(u, 0.62, 0.95)) * 125;
      const sway = Math.sin(u * Math.PI * 2.2) * 3;
      set(planeRef.current, {
        transform: `translate3d(-50%,${rise.toFixed(2)}vh,0) rotate(${sway.toFixed(2)}deg) scale(${(0.92 + u * 0.3).toFixed(3)})`,
      });
      set(bankRef.current, { transform: `translate3d(0,${(100 - ease(seg(u, 0.7, 1)) * 100).toFixed(2)}%,0)` });

      // ---- Copy ----
      const ranges: [number, number][] = [[-1, 0.24], [0.31, 0.51], [0.53, 0.73], [0.77, 0.9]];
      ranges.forEach(([a, b], k) => {
        const el = copyRefs[k].current;
        if (!el) return;
        const o = k === 0 ? clamp((b - p) / 0.05) : window01(p, a, b, 0.22);
        el.style.opacity = String(o);
        el.style.transform = `translate3d(0, ${((1 - o) * 30).toFixed(1)}px, 0)`;
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      });
      serviceRefs.current.forEach((li, k) => {
        if (!li) return;
        const t = ease(seg(p, 0.33 + k * 0.02, 0.36 + k * 0.02));
        li.style.opacity = String(t);
        li.style.transform = `translate3d(0, ${((1 - t) * 18).toFixed(1)}px, 0)`;
      });
      valueRefs.current.forEach((li, k) => {
        if (!li) return;
        const t = ease(seg(p, 0.57 + k * 0.03, 0.61 + k * 0.03));
        li.style.opacity = String(t);
        li.style.transform = `translate3d(${((1 - t) * (k % 2 ? 24 : -24)).toFixed(1)}px, 0, 0)`;
      });
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unit = (n: number) => `calc(var(--h) * ${n.toFixed(4)})`;

  return (
    <section ref={sectionRef} id="services" aria-label="Our services" className="relative h-[760vh] scroll-mt-24 bg-space text-white">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* ---------- Film (road and sea) ---------- */}
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,transparent_40%,rgba(5,7,15,0.7))]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[rgba(10,22,64,0.18)] mix-blend-multiply" />

        {/* ---------- Leg 1: loading, on white ---------- */}
        <div ref={loadRef} className="absolute inset-0 bg-paper text-ink" style={{ ['--h' as string]: '200px' }}>
          <div ref={groundRef} className="absolute inset-x-0 bottom-0 bg-ink" style={{ height: '22%' }}>
            <div
              ref={laneRef}
              aria-hidden="true"
              className="absolute inset-x-0 top-[38px] h-[3px] sm:top-[52px]"
              style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.35) 0 60%, transparent 60% 100%)', backgroundSize: '120px 3px' }}
            />
          </div>
          <div aria-hidden="true" className="absolute inset-x-0 bottom-[22%]">
            {/* forklift (behind the crate and truck) */}
            <div ref={forkRef} className="absolute bottom-0 left-0" style={{ width: unit(FORK_W), height: unit(FORK_H) }}>
              <img src={PART('forklift')} alt="" className="absolute inset-0 h-full w-full" draggable={false} />
              <img
                ref={carriageRef}
                src={PART('carriage')}
                alt=""
                draggable={false}
                className="absolute"
                style={{ left: unit(CARRIAGE.left), top: unit(CARRIAGE.top), width: unit(CARRIAGE.w), height: unit(CARRIAGE.h) }}
              />
            </div>
            <img
              ref={crateRef}
              src={PART('crate')}
              alt=""
              draggable={false}
              className="absolute bottom-0 left-0"
              style={{ width: unit(CRATE_W), height: unit(CRATE_H) }}
            />
            {/* truck, with the real AGS logo on the cargo box */}
            <div ref={truckRef} className="absolute bottom-0 left-0" style={{ width: unit(TRUCK_W), height: unit(1) }}>
              <img src={PART('truck')} alt="" className="absolute inset-0 h-full w-full" draggable={false} />
              <img src="/images/logo.png" alt="" draggable={false} className="absolute" style={{ left: '19%', top: '10%', width: '35%' }} />
            </div>
          </div>
        </div>

        {/* ---------- Leg 4: sky ---------- */}
        <div ref={skyRef} className="absolute inset-0 overflow-hidden" style={{ visibility: 'hidden' }}>
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#0B1430_0%,#1C2D63_55%,#3E5BB0_100%)]" />
          <div ref={skyLightRef} className="absolute inset-0 bg-[linear-gradient(to_bottom,#AEBBDF_0%,#DCE3F3_55%,#FFFFFF_100%)]" style={{ opacity: 0 }} />
          <div
            ref={cloudsBackRef}
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[260%] blur-[6px]"
            style={{ backgroundImage: clouds.back }}
          />
          <div
            ref={planeRef}
            aria-hidden="true"
            className="absolute left-1/2 top-[18%] w-[min(58vw,62vh)] will-change-transform"
            style={{ filter: 'drop-shadow(40px 60px 40px rgba(10,22,64,0.35))' }}
          >
            <img src={PART('plane')} alt="" draggable={false} className="block w-full" />
            <img
              src="/images/logo.png"
              alt=""
              draggable={false}
              className="absolute left-1/2 top-[27%] w-[15%] -translate-x-1/2 -rotate-90"
            />
          </div>
          <div
            ref={cloudsFrontRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[260%] blur-[10px]"
            style={{ backgroundImage: clouds.front }}
          />
          {/* the cloud bank that closes over the screen and becomes the page below */}
          <div ref={bankRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[150%]" style={{ transform: 'translate3d(0,100%,0)' }}>
            <div
              className="absolute inset-x-0 top-0 h-[40%] blur-[14px]"
              style={{ backgroundImage: cloudLayer(91, 16, 1, 24, 44) }}
            />
            <div className="absolute inset-x-0 bottom-0 top-[22%] bg-[linear-gradient(to_bottom,rgba(255,255,255,0),#FFFFFF_25%)]" />
          </div>
        </div>

        <div ref={dipRef} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-space" style={{ opacity: 0 }} />

        {/* ---------- Copy ---------- */}
        <div ref={copyRefs[0]} className="container-x absolute inset-x-0 top-0 pt-28 text-ink sm:pt-32">
          <p className="eyebrow">Our services</p>
          <h2 className="mt-5 max-w-3xl text-[36px] font-medium leading-[1.02] sm:text-[56px] lg:text-[64px]">Every order, packed and on its way.</h2>
          <p className="mt-5 max-w-md text-[16px] leading-[1.65] text-muted sm:text-[17px]">
            From the supplier&apos;s door to yours, we handle each step and keep you posted along the way.
          </p>
        </div>

        <div ref={copyRefs[1]} className="container-x absolute inset-0 grid items-center gap-8 py-28 lg:grid-cols-12" style={{ opacity: 0 }}>
          <div className="lg:col-span-4">
            <p className="eyebrow eyebrow-light">What we do</p>
            <h3 className="mt-4 font-display text-[30px] font-medium leading-[1.05] sm:text-[44px]">Six services. One team.</h3>
            <p className="mt-4 max-w-sm text-[15px] leading-[1.65] text-white/65">One partner for the whole journey, so nothing gets lost between suppliers, inspectors and carriers.</p>
          </div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-5 lg:col-span-4 lg:col-start-9 lg:grid-cols-1 lg:gap-y-4">
            {services.map((sv, i) => (
              <li
                key={sv.title}
                ref={(el) => {
                  serviceRefs.current[i] = el;
                }}
                className="border-l border-white/20 pl-4"
                style={{ opacity: 0 }}
              >
                <p className="mono-caps text-sky/80">{String(i + 1).padStart(2, '0')}</p>
                <p className="mt-1 font-display text-[16px] leading-tight sm:text-[19px]">{sv.title}</p>
                <p className="mt-0.5 hidden text-[13px] text-white/55 sm:block">{sv.short}</p>
              </li>
            ))}
          </ul>
        </div>

        <div ref={copyRefs[2]} className="container-x absolute inset-0 flex flex-col justify-between py-28 sm:py-24" style={{ opacity: 0 }}>
          <div className="text-center">
            <p className="eyebrow eyebrow-light justify-center">Why AGS Trade</p>
            <h3 className="mx-auto mt-4 max-w-3xl font-display text-[30px] font-medium leading-[1.02] sm:text-[52px]">Sourcing that works as hard as you do.</h3>
          </div>
          <ul className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-x-6 gap-y-6 sm:gap-x-[300px] lg:gap-x-[380px]">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <li
                  key={v.title}
                  ref={(el) => {
                    valueRefs.current[i] = el;
                  }}
                  className={i % 2 ? 'text-left' : 'text-left sm:text-right'}
                  style={{ opacity: 0 }}
                >
                  <Icon size={20} strokeWidth={1.5} aria-hidden="true" className={`text-sky ${i % 2 ? '' : 'sm:ml-auto'}`} />
                  <p className="mt-2.5 font-display text-[16px] leading-tight sm:text-[19px]">{v.title}</p>
                  <p className="mt-1 text-[13px] leading-[1.55] text-white/65 sm:text-[14px]">{v.text}</p>
                </li>
              );
            })}
          </ul>
        </div>

        <div ref={copyRefs[3]} className="container-x absolute inset-x-0 top-0 flex flex-col gap-6 pt-28 sm:pt-32" style={{ opacity: 0 }}>
          <div>
            <p className="eyebrow eyebrow-light">Urgent orders</p>
            <h3 className="mt-4 max-w-xl font-display text-[30px] font-medium leading-[1.05] sm:text-[48px]">When it can&apos;t wait, it flies.</h3>
            <p className="mt-3 max-w-md text-[15px] leading-[1.65] text-white/75">Sea for volume, air for speed. We pick the route that fits your deadline and budget.</p>
          </div>
          <Button href="#contact" variant="light" className="pointer-events-auto self-start">
            Request a quote
          </Button>
        </div>

        {/* Journey indicator */}
        <div className="container-x pointer-events-none absolute inset-x-0 bottom-0 hidden pb-6 lg:block [@media(max-height:820px)]:!hidden">
          <div className={`flex items-center gap-4 transition-opacity duration-300 ${scene === 3 ? 'opacity-0' : ''}`}>
            <span className="mono-caps text-white/80">{String(scene + 1).padStart(2, '0')}</span>
            <span className="flex gap-1.5" aria-hidden="true">
              {LABELS.map((_, i) => (
                <span key={i} className="h-[2px] w-10 overflow-hidden bg-white/15">
                  <span className={`block h-full origin-left bg-white transition-transform duration-700 ease-expo ${i <= scene ? 'scale-x-100' : 'scale-x-0'}`} />
                </span>
              ))}
            </span>
            <span key={scene} className="mono-caps animate-panelin text-white/60">
              {LABELS[scene]}
            </span>
          </div>
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
          <h2 className="mt-4 text-[32px] font-medium leading-none sm:text-[48px]">Everything your order needs. Under one roof.</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <article key={s.title} className="border-l border-white/15 pl-5">
                <h3 className="font-display text-[22px]">{s.title}</h3>
                <p className="mt-2 text-[15px] text-white/65">{s.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-accent py-20 text-white">
        <div className="container-x">
          <h2 className="text-[32px] font-medium leading-none sm:text-[48px]">Sourcing that works as hard as you do.</h2>
          <ul className="mt-10 grid gap-8 sm:grid-cols-2">
            {VALUES.map((v) => (
              <li key={v.title}>
                <p className="font-display text-[20px]">{v.title}</p>
                <p className="mt-1 text-white/75">{v.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
