import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Handshake, Receipt, Truck } from 'lucide-react';
import { services } from '@/data/siteContent';

const VALUES = [
  { title: 'Verified suppliers', text: 'Every maker is checked before we place your order.', icon: BadgeCheck },
  { title: 'One point of contact', text: 'A named manager from enquiry to delivery.', icon: Handshake },
  { title: 'Clear, honest quotes', text: 'Product, packing and shipping in one price.', icon: Receipt },
  { title: 'Shipping handled', text: 'Booked with trusted shipping and courier partners.', icon: Truck },
];

// The sea leg plays from the brand film (public/story/001-060.webp, 24 fps)
const FRAME_COUNT = 60;
const frameSrc = (i: number) => `/story/${String(i + 1).padStart(3, '0')}.webp`;
const PART = (n: string) => `/story/parts/${n}.webp`;

// Scroll share of each leg
const P_LOAD = 0.3;
const P_ROAD = 0.6;
const P_SEA = 0.88;
const LABELS = ['Loaded', 'On the road', 'At sea', 'Delivered'];

// Side-view sprite geometry, in units of the truck's height (H), measured from the cut-outs
const TRUCK_W = 1188 / 556;
const FORK_H = 0.66;
const FORK_W = FORK_H * (963 / 577);
const SF = FORK_H / 577;
const CARRIAGE = { left: 668 * SF, top: 222 * SF, w: 295 * SF, h: 326 * SF };
const FORK_TOP = (577 - 512) * SF;
const CRATE_W = 0.44;
const CRATE_H = CRATE_W * (498 / 900);
const CRATE_OFFSET = 690 * SF;
const TRUCK_FLOOR = 0.28;
const LIFT = TRUCK_FLOOR - FORK_TOP + 0.012;
// Top-view truck (width / length)
const TOP_RATIO = 336 / 686;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const window01 = (p: number, a: number, b: number, edge = 0.25) => {
  const t = seg(p, a, b);
  return ease(Math.min(clamp(t / edge), clamp((1 - t) / edge)));
};

/**
 * Paints soft clouds once into a small bitmap. Moving a pre-drawn image is cheap; blurring a
 * tall layer on every frame is what made the cloud transition stutter.
 */
function paintClouds(seed: number, count: number, alpha: number, minW: number, maxW: number, aspect: number) {
  const w = 360;
  const h = Math.max(1, Math.round(w * aspect));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (!g) return '';
  let x = seed;
  const rnd = () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
  for (let i = 0; i < count; i++) {
    const cx = (rnd() * 1.2 - 0.1) * w;
    const cy = rnd() * h;
    const rx = ((minW + rnd() * (maxW - minW)) / 100) * w * 0.5;
    const ry = rx * (0.45 + rnd() * 0.3);
    const a = alpha * (0.6 + rnd() * 0.4);
    g.save();
    g.translate(cx, cy);
    g.scale(1, ry / rx);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    grad.addColorStop(0, `rgba(255,255,255,${a})`);
    grad.addColorStop(0.4, `rgba(255,255,255,${a * 0.55})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(0, 0, rx, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  return `url(${c.toDataURL('image/png')})`;
}

/**
 * The scroll story. On a white page the forklift loads the crate into the truck, which drives off
 * and reappears from above on a road that turns down the page; the sea leg plays from the brand
 * film; then the sky clears and the clouds close over the screen into the product section below.
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
  // leg 1
  const loadRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLDivElement>(null);
  const laneRef = useRef<HTMLDivElement>(null);
  const truckRef = useRef<HTMLDivElement>(null);
  const forkRef = useRef<HTMLDivElement>(null);
  const carriageRef = useRef<HTMLImageElement>(null);
  const crateRef = useRef<HTMLImageElement>(null);
  // leg 2
  const roadRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const roadSvgRef = useRef<SVGSVGElement>(null);
  const roadPathRef = useRef<SVGPathElement>(null);
  const lanePathRef = useRef<SVGPathElement>(null);
  const topTruckRef = useRef<HTMLImageElement>(null);
  const mistRef = useRef<HTMLDivElement>(null);
  const mistTopRef = useRef<HTMLDivElement>(null);
  // leg 4
  const skyRef = useRef<HTMLDivElement>(null);
  const skyLightRef = useRef<HTMLDivElement>(null);
  const cloudsBackRef = useRef<HTMLDivElement>(null);
  const cloudsFrontRef = useRef<HTMLDivElement>(null);
  const bankRef = useRef<HTMLDivElement>(null);
  const bankTopRef = useRef<HTMLDivElement>(null);
  const copyRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const serviceRefs = useRef<(HTMLLIElement | null)[]>([]);
  const valueRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ---------- sea film ----------
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
      for (const step of [10, 5, 2, 1]) for (let i = 0; i < FRAME_COUNT; i += step) load(i);
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
      ctx!.drawImage(img, (cw - iw * cover) / 2, (ch - ih * cover) / 2, iw * cover, ih * cover);
      if (cw / ch < 1) {
        ctx!.fillStyle = 'rgba(5,7,15,0.55)';
        ctx!.fillRect(0, 0, cw, ch);
        const fit = (cw / iw) * 1.55;
        ctx!.drawImage(img, (cw - iw * fit) / 2, (ch - ih * fit) / 2, iw * fit, ih * fit);
      }
    }

    // ---------- layout ----------
    let H = 200; // side-view truck height
    let T = 600; // side-view truck rear x
    let vw = 1440;
    let vh = 900;
    let Wr = 200; // road width
    let road = { Y0: 0, R: 0, cx: 0, LA: 0, LArc: 0, tw: 0, tl: 0, len: 0 };
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      current = -1;
      vw = window.innerWidth;
      vh = window.innerHeight;
      const mobile = vw < 768;
      H = mobile ? vw * 0.24 : Math.min(vh * 0.26, vw * 0.15);
      T = vw * (mobile ? 0.38 : 0.5);
      Wr = mobile ? Math.min(vh * 0.2, vw * 0.36) : vh * 0.22;
      loadRef.current?.style.setProperty('--h', `${H}px`);
      if (groundRef.current) groundRef.current.style.height = `${Wr}px`;
      if (truckRef.current?.parentElement) truckRef.current.parentElement.style.bottom = `${Wr}px`;

      // Road: along the bottom, round a corner, then straight down the middle
      const Y0 = vh - Wr / 2;
      const R = Wr * 1.1;
      const cx = vw * 0.5;
      const tw = Wr * 0.48;
      const tl = tw / TOP_RATIO;
      const len = vh * 4;
      const d = `M ${-Wr * 2} ${Y0} H ${cx - R} A ${R} ${R} 0 0 1 ${cx} ${Y0 + R} V ${Y0 + R + len}`;
      roadPathRef.current?.setAttribute('d', d);
      lanePathRef.current?.setAttribute('d', d);
      roadPathRef.current?.setAttribute('stroke-width', String(Wr));
      if (roadSvgRef.current) {
        roadSvgRef.current.setAttribute('width', String(vw));
        roadSvgRef.current.setAttribute('height', String(Y0 + R + len + Wr));
      }
      if (topTruckRef.current) {
        topTruckRef.current.style.width = `${tw}px`;
        topTruckRef.current.style.height = `${tl}px`;
      }
      road = { Y0, R, cx, LA: cx - R + Wr * 2, LArc: (Math.PI * R) / 2, tw, tl, len };

      // Clouds, painted once for this screen shape
      const aspect = (2.2 * vh) / vw;
      if (cloudsBackRef.current) cloudsBackRef.current.style.backgroundImage = paintClouds(7, 44, 0.5, 10, 30, aspect);
      if (cloudsFrontRef.current) cloudsFrontRef.current.style.backgroundImage = paintClouds(31, 34, 0.8, 12, 36, aspect);
      const edge = paintClouds(53, 18, 1, 22, 42, (0.75 * vh) / vw);
      if (mistTopRef.current) mistTopRef.current.style.backgroundImage = edge;
      if (bankTopRef.current) bankTopRef.current.style.backgroundImage = paintClouds(91, 16, 1, 24, 44, (0.6 * vh) / vw);

      draw(true);
      update();
    };

    const set = (el: Element | null, css: Partial<CSSStyleDeclaration>) => {
      if (el) Object.assign((el as HTMLElement).style, css);
    };

    let raf = 0;
    let lastScene = -1;
    function update() {
      raf = 0;
      const rect = section!.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = span > 0 ? clamp(-rect.top / span) : 0;
      const sc = p < P_LOAD ? 0 : p < P_ROAD ? 1 : p < P_SEA ? 2 : 3;
      if (sc !== lastScene) {
        lastScene = sc;
        setScene(sc);
      }

      // ---- Leg 1: loading (side view) ----
      const l = seg(p, 0, P_LOAD);
      const startX = -FORK_W * H - CRATE_W * H - 40;
      const readyX = T - (CRATE_OFFSET + CRATE_W + 0.04) * H;
      const pushedX = T - (CRATE_OFFSET - 0.06) * H;
      let forkX = lerp(startX, readyX, easeOut(seg(l, 0, 0.3)));
      forkX = lerp(forkX, pushedX, ease(seg(l, 0.45, 0.62)));
      forkX = lerp(forkX, startX, easeIn(seg(l, 0.68, 0.88)));
      const lift = (ease(seg(l, 0.3, 0.44)) - ease(seg(l, 0.63, 0.72))) * LIFT * H;
      const truckX = T + easeIn(seg(l, 0.72, 1)) * (vw - T + 40);
      set(forkRef.current, { transform: `translate3d(${forkX.toFixed(1)}px,0,0)` });
      set(carriageRef.current, { transform: `translate3d(0,${(-lift).toFixed(1)}px,0)` });
      set(crateRef.current, {
        transform: `translate3d(${(forkX + CRATE_OFFSET * H).toFixed(1)}px,${(-(FORK_TOP * H) - lift).toFixed(1)}px,0)`,
        opacity: l > 0.63 ? '0' : '1',
      });
      set(truckRef.current, { transform: `translate3d(${truckX.toFixed(1)}px,0,0)` });
      set(laneRef.current, { backgroundPositionX: `${(-easeIn(seg(l, 0.72, 1)) * 600).toFixed(0)}px` });
      set(loadRef.current, { visibility: p < P_LOAD ? 'visible' : 'hidden' });

      // ---- Leg 2: the road, seen from above ----
      const r = seg(p, P_LOAD, P_ROAD);
      set(roadRef.current, {
        visibility: p >= P_LOAD && p < P_ROAD ? 'visible' : 'hidden',
      });
      if (p >= P_LOAD - 0.01 && p < P_ROAD + 0.02) {
        const { Y0, R, cx, LA, LArc, tw, tl } = road;
        const sEnd = LA + LArc + vh * 1.3;
        const s = lerp(-tl, sEnd, ease(r) * 0.25 + r * 0.75);
        let x: number;
        let y: number;
        let rot: number;
        if (s <= LA) {
          x = -Wr * 2 + s;
          y = Y0;
          rot = 90;
        } else if (s <= LA + LArc) {
          const th = -Math.PI / 2 + (s - LA) / R;
          x = cx - R + R * Math.cos(th);
          y = Y0 + R + R * Math.sin(th);
          rot = (th * 180) / Math.PI + 180;
        } else {
          x = cx;
          y = Y0 + R + (s - LA - LArc);
          rot = 180;
        }
        // Camera follows the truck down the page once it has turned
        const screenY = lerp(Y0, vh * 0.55, ease(seg(s, LA, LA + LArc + vh * 0.5)));
        const cam = Math.max(0, y - screenY);
        set(worldRef.current, { transform: `translate3d(0,${(-cam).toFixed(1)}px,0)` });
        set(topTruckRef.current, {
          transform: `translate3d(${(x - tw / 2).toFixed(1)}px,${(y - tl / 2).toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg)`,
        });
      }

      // ---- Road → sea: a bank of cloud rolls over the screen and lifts off the ship ----
      const m = seg(p, P_ROAD - 0.07, P_ROAD + 0.07);
      set(mistRef.current, {
        visibility: m > 0 && m < 1 ? 'visible' : 'hidden',
        transform: `translate3d(0,${lerp(100, -300, m).toFixed(2)}vh,0)`,
      });

      // ---- Leg 3: sea (film) ----
      if (p >= P_ROAD - 0.01 && p < P_SEA + 0.02) {
        wanted = Math.round(seg(p, P_ROAD, P_SEA) * (FRAME_COUNT - 1));
        draw();
      }
      let dip = 0;
      for (const b of [] as number[]) dip = Math.max(dip, 1 - Math.abs(p - b) / 0.02);
      set(dipRef.current, { opacity: String(clamp(dip) * 0.9) });

      // ---- Leg 4: through the clouds into the page below ----
      const u = seg(p, P_SEA, 1);
      set(skyRef.current, { visibility: p > P_SEA - 0.01 ? 'visible' : 'hidden', opacity: String(ease(seg(p, P_SEA - 0.01, P_SEA + 0.03))) });
      if (p > P_SEA - 0.01) {
        set(cloudsBackRef.current, { transform: `translate3d(0,${(-55 + u * 70).toFixed(2)}%,0)` });
        set(cloudsFrontRef.current, { transform: `translate3d(0,${(-65 + u * 110).toFixed(2)}%,0)` });
        set(bankRef.current, { transform: `translate3d(0,${(100 - easeOut(seg(u, 0.5, 1)) * 100).toFixed(2)}%,0)` });
      }

      // ---- Copy ----
      const ranges: [number, number][] = [
        [-1, P_LOAD - 0.06],
        [P_LOAD + 0.02, P_LOAD + (P_ROAD - P_LOAD) * 0.72],
        [P_ROAD + 0.05, P_SEA - 0.02],
      ];
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
        const t = ease(seg(p, P_LOAD + 0.04 + k * 0.022, P_LOAD + 0.07 + k * 0.022));
        li.style.opacity = String(t);
        li.style.transform = `translate3d(0, ${((1 - t) * 18).toFixed(1)}px, 0)`;
      });
      valueRefs.current.forEach((li, k) => {
        if (!li) return;
        const t = ease(seg(p, P_ROAD + 0.05 + k * 0.03, P_ROAD + 0.09 + k * 0.03));
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
    <section ref={sectionRef} id="services" aria-label="Our services" className="relative h-[640vh] scroll-mt-24 bg-space text-white">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* ---------- Sea film ---------- */}
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,transparent_40%,rgba(5,7,15,0.7))]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[rgba(10,22,64,0.18)] mix-blend-multiply" />

        {/* ---------- Leg 1: loading, on white ---------- */}
        <div ref={loadRef} className="absolute inset-0 bg-paper text-ink" style={{ ['--h' as string]: '200px' }}>
          <div ref={groundRef} className="absolute inset-x-0 bottom-0 bg-ink" style={{ height: '22%' }}>
            <div
              ref={laneRef}
              aria-hidden="true"
              className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2"
              style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.55) 0 50%, transparent 50% 100%)', backgroundSize: '54px 3px' }}
            />
          </div>
          <div aria-hidden="true" className="absolute inset-x-0" style={{ bottom: '22%' }}>
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
            <img ref={crateRef} src={PART('crate')} alt="" draggable={false} className="absolute bottom-0 left-0" style={{ width: unit(CRATE_W), height: unit(CRATE_H) }} />
            <div ref={truckRef} className="absolute bottom-0 left-0" style={{ width: unit(TRUCK_W), height: unit(1) }}>
              <img src={PART('truck')} alt="" className="absolute inset-0 h-full w-full" draggable={false} />
            </div>
          </div>
        </div>

        {/* ---------- Leg 2: road from above, on white ---------- */}
        <div ref={roadRef} aria-hidden="true" className="absolute inset-0 overflow-hidden bg-paper" style={{ visibility: 'hidden' }}>
          <div ref={worldRef} className="absolute inset-x-0 top-0 will-change-transform">
            <svg ref={roadSvgRef} className="absolute left-0 top-0 overflow-visible" fill="none">
              <path ref={roadPathRef} stroke="#1B1E24" strokeLinejoin="round" />
              <path ref={lanePathRef} stroke="rgba(255,255,255,0.55)" strokeWidth={3} strokeDasharray="28 26" />
            </svg>
            <img ref={topTruckRef} src={PART('truck-top')} alt="" draggable={false} className="absolute left-0 top-0 max-w-none origin-center will-change-transform" />
          </div>
        </div>

        {/* ---------- Cloud bank between the road and the sea ---------- */}
        <div ref={mistRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[300vh] will-change-transform" style={{ visibility: 'hidden' }}>
          <div
            ref={mistTopRef}
            className="absolute inset-x-0 top-0 h-1/4"
            style={{ backgroundSize: '100% 100%', WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 55%)', maskImage: 'linear-gradient(to bottom, transparent, #000 55%)' }}
          />
          <div className="absolute inset-x-0 bottom-0 top-[18%] bg-[linear-gradient(to_bottom,rgba(255,255,255,0),#FFFFFF_12%,#F3F5FA_42%,#FFFFFF_62%,rgba(255,255,255,0.55)_80%,rgba(255,255,255,0))]" />
        </div>

        {/* ---------- Leg 4: sky ---------- */}
        <div ref={skyRef} className="absolute inset-0 overflow-hidden" style={{ visibility: 'hidden' }}>
          <div ref={skyLightRef} className="absolute inset-0 bg-[linear-gradient(to_bottom,#C9D1E4_0%,#E4E8F1_55%,#FFFFFF_100%)]" />
          <div ref={cloudsBackRef} aria-hidden="true" className="absolute inset-x-0 top-0 h-[220%] will-change-transform" style={{ backgroundSize: '100% 100%' }} />
          <div ref={cloudsFrontRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[220%] will-change-transform" style={{ backgroundSize: '100% 100%' }} />
          <div ref={bankRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[150%] will-change-transform" style={{ transform: 'translate3d(0,100%,0)' }}>
            <div ref={bankTopRef} className="absolute inset-x-0 top-0 h-[40%]" style={{ backgroundSize: '100% 100%', WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 45%)', maskImage: 'linear-gradient(to bottom, transparent, #000 45%)' }} />
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

        <div ref={copyRefs[1]} className="container-x absolute inset-x-0 top-0 grid gap-6 pt-24 text-ink lg:grid-cols-12 lg:items-start lg:pt-36" style={{ opacity: 0 }}>
          <div className="max-lg:rounded-lg max-lg:bg-paper/90 max-lg:p-4 max-lg:backdrop-blur-sm lg:col-span-4">
            <p className="eyebrow">What we do</p>
            <h3 className="mt-4 font-display text-[28px] font-medium leading-[1.05] sm:text-[44px]">Six services. One team.</h3>
            <p className="mt-4 max-w-sm text-[15px] leading-[1.65] text-muted">One partner for the whole journey, so nothing gets lost between suppliers, inspectors and carriers.</p>
          </div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-4 max-lg:rounded-lg max-lg:bg-paper/90 max-lg:p-4 max-lg:backdrop-blur-sm lg:col-span-3 lg:col-start-10 lg:grid-cols-1">
            {services.map((sv, i) => (
              <li
                key={sv.title}
                ref={(el) => {
                  serviceRefs.current[i] = el;
                }}
                className="border-l border-ink/15 pl-4"
                style={{ opacity: 0 }}
              >
                <p className="mono-caps text-accent">{String(i + 1).padStart(2, '0')}</p>
                <p className="mt-1 font-display text-[15px] leading-tight sm:text-[18px]">{sv.title}</p>
                <p className="mt-0.5 hidden text-[13px] text-muted sm:block">{sv.short}</p>
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

        {/* Journey indicator */}
        <div className="container-x pointer-events-none absolute inset-x-0 bottom-0 hidden pb-6 mix-blend-difference lg:block [@media(max-height:820px)]:!hidden">
          <div className={`flex items-center gap-4 transition-opacity duration-300 ${scene === 3 ? 'opacity-0' : ''}`}>
            <span className="mono-caps text-white/80">{String(scene + 1).padStart(2, '0')}</span>
            <span className="flex gap-1.5" aria-hidden="true">
              {LABELS.map((_, i) => (
                <span key={i} className="h-[2px] w-10 overflow-hidden bg-white/25">
                  <span className={`block h-full origin-left bg-white transition-transform duration-700 ease-expo ${i <= scene ? 'scale-x-100' : 'scale-x-0'}`} />
                </span>
              ))}
            </span>
            <span key={scene} className="mono-caps animate-panelin text-white/70">
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
