import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Handshake, Receipt, Truck } from 'lucide-react';
import { services } from '@/data/siteContent';

const VALUES = [
  { title: 'Verified suppliers', text: 'Every maker is checked before we place your order.', icon: BadgeCheck },
  { title: 'One point of contact', text: 'A named manager from enquiry to delivery.', icon: Handshake },
  { title: 'Clear, honest quotes', text: 'Product, packing and shipping in one price.', icon: Receipt },
  { title: 'Shipping handled', text: 'Booked with trusted shipping and courier partners.', icon: Truck },
];

// The sea leg plays from the brand film (public/story/001-097.webp, frames interpolated for a longer, smooth shot)
const FRAME_COUNT = 97;
const frameSrc = (i: number) => `/story/${String(i + 1).padStart(3, '0')}.webp`;
const PART = (n: string) => `/story/parts/${n}.webp`;
// One aerial world for the loading and the road (public/story/parts/world.webp, 3400 x 3500 world px).
// A warehouse and concrete yard sit beside the road; the road runs in from the left at y = W_YH,
// turns a corner of radius W_R round (W_CX - W_R, W_YH + W_R) and runs down the page at x = W_CX.
const W_W = 3400;
const W_H = 3500;
const W_YH = 1250;
const W_R = 300;
const W_CX = 2600;
const W_ROAD = 200;
const LANE = W_ROAD / 4; // traffic keeps left: the truck holds the outer lane through the turn
const A_TRUCK_W = W_ROAD * 0.42;
const A_TRUCK_L = A_TRUCK_W * (686 / 336);
// The truck waits in the yard's loading bay, nose to the east; the forklift comes out of the dock door
const PARK = { x: 1310, y: 1065 };
const DOOR = { x: 830, y: 800 };
const FL_W = 40;
const FL_L = 124;
const FL_CRATE = 38; // crate centre ahead of the forklift's centre
const CRATE = { w: 46, h: 40 };
const PULL_OUT = 460; // yard → lane

// Scroll share of each leg
const P_LOAD = 0.296;
const P_ROAD = 0.591;
// Where the ship leg ends: the last screen of scrolling belongs to the next section rising over the sea
let P_SEA = 0.84;
const LABELS = ['Loaded', 'On the road', 'At sea', 'Delivered'];

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
 * and the road leg is an aerial film of it driving through the forest; the sea leg plays from the brand
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
  const forkRef = useRef<HTMLDivElement>(null);
  const crateRef = useRef<HTMLDivElement>(null);
  // leg 2
  const roadRef = useRef<HTMLDivElement>(null);
  const liftRef = useRef<HTMLDivElement>(null);
  const forestRef = useRef<HTMLDivElement>(null);
  const aerialTruckRef = useRef<HTMLDivElement>(null);
  const fogWrapRef = useRef<HTMLDivElement>(null);
  const hazeRef = useRef<HTMLDivElement>(null);
  const fogARef = useRef<HTMLDivElement>(null);
  const fogBRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const mistRef = useRef<HTMLDivElement>(null);
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
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        loadAll();
      },
      { rootMargin: '120% 0px' },
    );
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
    }

    // ---------- road ----------
    let z = 1; // screen px per world px

    // ---------- layout ----------
    let vw = 1440;
    let vh = 900;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      current = -1;
      vw = window.innerWidth;
      vh = window.innerHeight;
      const mobile = vw < 768;
      z = mobile ? 0.6 : Math.max(vw / W_W, 0.9);
      if (forestRef.current) {
        forestRef.current.style.width = `${W_W * z}px`;
        forestRef.current.style.height = `${W_H * z}px`;
        forestRef.current.style.backgroundImage = `url(${PART(mobile ? 'world-m' : 'world')})`;
      }
      if (aerialTruckRef.current) {
        aerialTruckRef.current.style.width = `${A_TRUCK_W * z}px`;
        aerialTruckRef.current.style.height = `${A_TRUCK_L * z}px`;
      }
      if (forkRef.current) {
        forkRef.current.style.width = `${FL_W * z}px`;
        forkRef.current.style.height = `${FL_L * z}px`;
      }
      if (crateRef.current) {
        crateRef.current.style.width = `${CRATE.w * z}px`;
        crateRef.current.style.height = `${CRATE.h * z}px`;
      }

      // Clouds, painted once for this screen shape
      const aspect = (2.2 * vh) / vw;
      if (cloudsBackRef.current) cloudsBackRef.current.style.backgroundImage = paintClouds(7, 44, 0.5, 10, 30, aspect);
      if (cloudsFrontRef.current) cloudsFrontRef.current.style.backgroundImage = paintClouds(31, 34, 0.8, 12, 36, aspect);
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
      if (span > 0) P_SEA = 1 - window.innerHeight / span;
      const sc = p < P_LOAD ? 0 : p < P_ROAD ? 1 : p < P_SEA ? 2 : 3;
      if (sc !== lastScene) {
        lastScene = sc;
        setScene(sc);
      }

      // ---- Legs 1 and 2: one drone shot over the forest ----
      const mobile = vw < 768;
      const l = seg(p, 0, P_LOAD);
      const r = seg(p, P_LOAD, P_ROAD);
      set(roadRef.current, { visibility: p < P_ROAD + 0.02 ? 'visible' : 'hidden' });
      if (p < P_ROAD + 0.02) {
        const deg = (dx: number, dy: number) => (Math.atan2(dy, dx) * 180) / Math.PI - 90;

        // Loading: the forklift brings the crate out of the dock door and round to the truck's tail
        const rearX = PARK.x - A_TRUCK_L / 2;
        const B0 = DOOR;
        const B1 = { x: DOOR.x, y: PARK.y };
        const B2 = { x: rearX - FL_CRATE - CRATE.h / 2, y: PARK.y };
        const t = ease(seg(l, 0.05, 0.36)) - ease(seg(l, 0.58, 0.88));
        const push = (ease(seg(l, 0.36, 0.46)) - ease(seg(l, 0.5, 0.58))) * 46;
        const q = 1 - t;
        const fx = q * q * B0.x + 2 * q * t * B1.x + t * t * B2.x + push;
        const fy = q * q * B0.y + 2 * q * t * B1.y + t * t * B2.y;
        const tdx = 2 * q * (B1.x - B0.x) + 2 * t * (B2.x - B1.x);
        const tdy = 2 * q * (B1.y - B0.y) + 2 * t * (B2.y - B1.y);
        const frot = deg(tdx || 1e-6, tdy);
        const fa = (frot + 90) * (Math.PI / 180);
        const fOn = clamp(t / 0.06) * (l < 0.9 ? 1 : 0);
        set(forkRef.current, {
          opacity: fOn.toFixed(3),
          transform: `translate3d(${((fx - FL_W / 2) * z).toFixed(1)}px,${((fy - FL_L / 2) * z).toFixed(1)}px,0) rotate(${frot.toFixed(2)}deg)`,
        });
        set(crateRef.current, {
          opacity: l < 0.47 ? fOn.toFixed(3) : '0',
          transform: `translate3d(${((fx + Math.cos(fa) * FL_CRATE - CRATE.w / 2) * z).toFixed(1)}px,${((fy + Math.sin(fa) * FL_CRATE - CRATE.h / 2) * z).toFixed(1)}px,0) rotate(${frot.toFixed(2)}deg)`,
        });

        // Driving: out of the yard into the lane, along to the corner, round it and down the page
        const ax = W_CX - W_R;
        const ay = W_YH + W_R;
        const RL = W_R + LANE;
        const laneY = W_YH - LANE;
        const startX = PARK.x + PULL_OUT;
        const LA = ax - startX;
        const LArc = (Math.PI * RL) / 2;
        const LV = Math.min((vh * 1.3) / z, 1300);
        const u = lerp(0, PULL_OUT + LA + LArc + LV, ease(r) * 0.3 + r * 0.7);
        let x: number;
        let y: number;
        let rot: number;
        if (u <= PULL_OUT) {
          const w = u / PULL_OUT;
          x = PARK.x + u;
          y = lerp(PARK.y, laneY, ease(w));
          rot = deg(1, ((laneY - PARK.y) * 6 * w * (1 - w)) / PULL_OUT);
        } else if (u <= PULL_OUT + LA) {
          x = startX + (u - PULL_OUT);
          y = laneY;
          rot = -90;
        } else if (u <= PULL_OUT + LA + LArc) {
          const th = (u - PULL_OUT - LA) / RL;
          x = ax + RL * Math.sin(th);
          y = ay - RL * Math.cos(th);
          rot = -90 + (th * 180) / Math.PI;
        } else {
          x = W_CX + LANE;
          y = ay + (u - PULL_OUT - LA - LArc);
          rot = 0;
        }

        // Camera: framed on the yard while loading, then it lifts and follows the truck
        const zoom0 = mobile ? 1 : 1.3;
        const s0 = { x: vw * (mobile ? 0.8 : 0.64), y: vh * (mobile ? 0.66 : 0.64) };
        const s1 = { x: vw * 0.5 - LANE * z, y: vh * (mobile ? 0.74 : 0.55) };
        const k = ease(seg(u, 0, PULL_OUT + LA + LArc * 0.7));
        const sx = lerp(s0.x, s1.x, k);
        const sy = lerp(s0.y, s1.y, k);
        const camX = x * z - sx;
        const camY = y * z - sy;
        set(forestRef.current, { transform: `translate3d(${(-camX).toFixed(1)}px,${(-camY).toFixed(1)}px,0)` });
        set(liftRef.current, {
          transformOrigin: `${sx.toFixed(0)}px ${sy.toFixed(0)}px`,
          transform: `scale(${lerp(zoom0, 1, ease(seg(u, 0, PULL_OUT + LA))).toFixed(4)})`,
        });
        set(aerialTruckRef.current, {
          transform: `translate3d(${((x - A_TRUCK_W / 2) * z).toFixed(1)}px,${((y - A_TRUCK_L / 2) * z).toFixed(1)}px,0)`,
        });
        const img = aerialTruckRef.current?.firstElementChild as HTMLElement | null;
        if (img) img.style.transform = `rotate(${rot.toFixed(2)}deg)`;

        // fog drifts across faster than the ground: it hangs between the camera and the trees
        const f = p / P_ROAD;
        set(fogARef.current, { transform: `translate3d(${(-f * 18).toFixed(2)}%,${(-f * 55).toFixed(2)}%,0)` });
        set(fogBRef.current, { transform: `translate3d(${(f * 12).toFixed(2)}%,${(-f * 70).toFixed(2)}%,0)` });
        // the morning fog is thin over the yard and thickens as the truck heads into the trees
        const thick = lerp(0.4, 1, ease(seg(u, 0, PULL_OUT + 200)));
        set(fogWrapRef.current, { opacity: thick.toFixed(3) });
        set(hazeRef.current, { opacity: thick.toFixed(3) });
        // low sun breaks through as the truck takes the corner, then softens
        const glare = 0.6 + 0.4 * window01(u, PULL_OUT + LA - 300, PULL_OUT + LA + LArc + 500, 0.4);
        set(sunRef.current, { opacity: glare.toFixed(3), transform: `translate3d(${(-f * 4).toFixed(2)}%,${(f * 3).toFixed(2)}%,0)` });
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
      set(skyRef.current, { visibility: p > P_SEA - 0.01 ? 'visible' : 'hidden' });
      if (p > P_SEA - 0.01) {
        set(cloudsBackRef.current, { transform: `translate3d(0,${(-55 + u * 70).toFixed(2)}%,0)` });
        set(cloudsFrontRef.current, { transform: `translate3d(0,${(-65 + u * 110).toFixed(2)}%,0)` });
        // the cloud edge rides just ahead of the next section's top edge as it scrolls up
        set(bankRef.current, { transform: `translate3d(0,${(((1.15 - u) / 1.5) * 100).toFixed(2)}%,0)` });
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

  return (
    <section ref={sectionRef} id="services" aria-label="Our services" className="relative h-[460vh] scroll-mt-24 md:h-[680vh] bg-space text-white">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* ---------- Sea film ---------- */}
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,transparent_40%,rgba(5,7,15,0.7))]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[rgba(10,22,64,0.14)]" />

        {/* ---------- Legs 1 and 2: the yard and the road, from the air ---------- */}
        <div ref={roadRef} aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#16201a]" style={{ visibility: 'hidden' }}>
          <div ref={liftRef} className="absolute inset-0 will-change-transform">
          <div ref={forestRef} className="absolute left-0 top-0 will-change-transform" style={{ backgroundSize: '100% 100%' }}>
            <div ref={crateRef} className="absolute left-0 top-0 origin-center will-change-transform [filter:drop-shadow(4px_5px_3px_rgba(0,0,0,0.5))]" style={{ opacity: 0 }}>
              <img src={PART('crate-top')} alt="" draggable={false} className="h-full w-full max-w-none" />
            </div>
            <div ref={forkRef} className="absolute left-0 top-0 origin-center will-change-transform [filter:drop-shadow(5px_6px_3px_rgba(0,0,0,0.5))]" style={{ opacity: 0 }}>
              <img src={PART('fork-top')} alt="" draggable={false} className="h-full w-full max-w-none" />
            </div>
            <div ref={aerialTruckRef} className="absolute left-0 top-0 will-change-transform [filter:drop-shadow(9px_10px_5px_rgba(0,0,0,0.55))]">
              <img src={PART('truck-aerial')} alt="" draggable={false} className="h-full w-full max-w-none origin-center" />
            </div>
          </div>
          </div>
          {/* sun glare, from the upper left where the light falls from */}
          <div ref={sunRef} className="pointer-events-none absolute -inset-[10%] mix-blend-screen will-change-transform" style={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-[radial-gradient(38%_34%_at_14%_10%,rgba(255,228,175,0.95)_0%,rgba(255,206,140,0.45)_35%,rgba(255,190,120,0)_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_14%_10%,rgba(255,214,160,0.3)_0%,rgba(255,214,160,0)_70%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,230,190,0.16)_0%,rgba(255,230,190,0)_34%,rgba(255,230,190,0)_100%)]" />
            <div className="absolute left-[34%] top-[30%] h-16 w-16 rounded-full bg-[radial-gradient(circle,rgba(255,236,200,0.35),rgba(255,236,200,0)_70%)]" />
            <div className="absolute left-[52%] top-[52%] h-28 w-28 rounded-full border border-[rgba(255,230,190,0.12)] bg-[radial-gradient(circle,rgba(255,230,190,0)_55%,rgba(255,230,190,0.10)_70%,rgba(255,230,190,0)_72%)]" />
          </div>
          {/* fog */}
          <div ref={fogWrapRef} className="pointer-events-none absolute inset-0" style={{ maskImage: 'linear-gradient(to right, #000 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.25) 70%, #000 100%)', WebkitMaskImage: 'linear-gradient(to right, #000 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.25) 70%, #000 100%)' }}>
            <div className="absolute -inset-x-[20%] top-0 h-[400%] opacity-70" ref={fogARef} style={{ backgroundImage: `url(${PART('fog-a')})`, backgroundSize: '1100px 1100px' }} />
            <div className="absolute -inset-x-[20%] top-0 h-[400%] opacity-45" ref={fogBRef} style={{ backgroundImage: `url(${PART('fog-b')})`, backgroundSize: '760px 760px' }} />
          </div>
          <div ref={hazeRef} className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(225,230,228,0.55)_0%,rgba(225,230,228,0.12)_28%,rgba(225,230,228,0)_50%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(220,226,224,0.45)_0%,rgba(220,226,224,0)_22%,rgba(220,226,224,0)_78%,rgba(220,226,224,0.45)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_80%_at_50%_45%,transparent_55%,rgba(6,10,8,0.45))]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(6,10,8,0.55),rgba(6,10,8,0))]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[75%] bg-[linear-gradient(to_bottom,rgba(6,10,8,0.6),rgba(6,10,8,0.35)_55%,rgba(6,10,8,0))] lg:hidden" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(6,10,8,0.45)_0%,rgba(6,10,8,0)_30%,rgba(6,10,8,0)_70%,rgba(6,10,8,0.3)_100%)]" />
        </div>

        {/* ---------- Cloud bank between the road and the sea ---------- */}
        <div ref={mistRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[300vh] will-change-transform" style={{ visibility: 'hidden' }}>
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(255,255,255,0.35)_8%,rgba(255,255,255,0.85)_18%,#FFFFFF_28%,#F4F6FB_50%,#FFFFFF_66%,rgba(255,255,255,0.8)_78%,rgba(255,255,255,0.3)_90%,rgba(255,255,255,0)_100%)]" />
        </div>

        {/* ---------- Leg 4: sky ---------- */}
        <div ref={skyRef} className="absolute inset-0 overflow-hidden" style={{ visibility: 'hidden' }}>
          <div ref={skyLightRef} className="absolute inset-0 opacity-0 bg-[linear-gradient(to_bottom,#C9D1E4_0%,#E4E8F1_55%,#FFFFFF_100%)]" />
          <div ref={cloudsBackRef} aria-hidden="true" className="absolute inset-x-0 hidden top-0 h-[220%] will-change-transform" style={{ backgroundSize: '100% 100%' }} />
          <div ref={cloudsFrontRef} aria-hidden="true" className="pointer-events-none hidden absolute inset-x-0 top-0 h-[220%] will-change-transform" style={{ backgroundSize: '100% 100%' }} />
          <div ref={bankRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[150%] will-change-transform" style={{ transform: 'translate3d(0,100%,0)' }}>
            <div ref={bankTopRef} className="absolute inset-x-0 top-0 h-[40%]" style={{ backgroundSize: '100% 100%', WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 45%)', maskImage: 'linear-gradient(to bottom, transparent, #000 45%)' }} />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(244,246,251,0.35)_8%,rgba(255,255,255,0.9)_18%,#FFFFFF_23%)]" />
          </div>
        </div>

        <div ref={dipRef} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-space" style={{ opacity: 0 }} />

        {/* ---------- Copy ---------- */}
        <div ref={copyRefs[0]} className="container-x absolute inset-x-0 top-0 pt-28 text-white sm:pt-32">
          <p className="eyebrow text-white/80">Our services</p>
          <h2 className="mt-5 max-w-3xl text-[36px] font-medium leading-[1.02] sm:text-[56px] lg:text-[64px]">Every order, packed and on its way.</h2>
          <p className="mt-5 max-w-md text-[16px] leading-[1.65] text-white/75 sm:text-[17px]">
            From the supplier&apos;s door to yours, we handle each step and keep you posted along the way.
          </p>
        </div>

        <div ref={copyRefs[1]} className="container-x absolute inset-x-0 top-0 grid gap-6 pt-24 text-white lg:grid-cols-12 lg:items-start lg:pt-36" style={{ opacity: 0 }}>
          <div className="lg:col-span-4">
            <p className="eyebrow text-white/80">What we do</p>
            <h3 className="mt-4 font-display text-[28px] font-medium leading-[1.05] sm:text-[44px]">Six services. One team.</h3>
            <p className="mt-4 max-w-sm text-[16px] lg:text-[17px] leading-[1.65] text-white/75">One partner for the whole journey, so nothing gets lost between suppliers, inspectors and carriers.</p>
          </div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-4 lg:col-span-3 lg:col-start-10 lg:grid-cols-1">
            {services.map((sv, i) => (
              <li
                key={sv.title}
                ref={(el) => {
                  serviceRefs.current[i] = el;
                }}
                className="border-l border-white/25 pl-4"
                style={{ opacity: 0 }}
              >
                <p className="font-display text-[24px] font-medium leading-none tracking-[-0.02em] text-sky sm:text-[30px]">{String(i + 1).padStart(2, '0')}</p>
                <p className="mt-1.5 font-display text-[16px] leading-tight sm:text-[20px]">{sv.title}</p>
                <p className="mt-0.5 hidden text-[14px] lg:text-[15px] text-white/70 sm:block">{sv.short}</p>
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
        <div className="container-x pointer-events-none absolute inset-x-0 bottom-0 hidden pb-6 lg:block [@media(max-height:820px)]:!hidden">
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
                <p className="mt-2 text-[16px] lg:text-[17px] text-white/65">{s.description}</p>
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
