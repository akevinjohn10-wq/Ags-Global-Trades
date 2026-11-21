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
// Road leg: an aerial forest tile (1600 x 2400, road down the middle) that scrolls under the truck
// World (public/story/parts/world.webp) is 2600 x 3800 world px: the road runs in from the left at
// y = W_YH, turns a corner of radius W_R round (W_CX - W_R, W_YH + W_R) and runs down at x = W_CX.
const W_W = 2600;
const W_H = 3800;
const W_YH = 1500;
const W_R = 300;
const W_CX = 1800;
const W_ROAD = 200;
const LANE = W_ROAD / 4; // traffic keeps left: the truck holds the outer lane through the turn
const A_TRUCK_W = W_ROAD * 0.42;
const A_TRUCK_L = A_TRUCK_W * (686 / 336);

// Scroll share of each leg
const P_LOAD = 0.296;
const P_ROAD = 0.591;
// Where the ship leg ends: the last screen of scrolling belongs to the next section rising over the sea
let P_SEA = 0.84;
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
  const loadRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLDivElement>(null);
  const laneRef = useRef<HTMLDivElement>(null);
  const truckRef = useRef<HTMLDivElement>(null);
  const forkRef = useRef<HTMLDivElement>(null);
  const carriageRef = useRef<HTMLImageElement>(null);
  const crateRef = useRef<HTMLImageElement>(null);
  // leg 2
  const roadRef = useRef<HTMLDivElement>(null);
  const liftRef = useRef<HTMLDivElement>(null);
  const bayRef = useRef<HTMLDivElement>(null);
  const bayFogRef = useRef<HTMLDivElement>(null);
  const bayFogTexRef = useRef<HTMLDivElement>(null);
  const treesRef = useRef<HTMLDivElement>(null);
  const treeLayerRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const forestRef = useRef<HTMLDivElement>(null);
  const aerialTruckRef = useRef<HTMLDivElement>(null);
  const fogARef = useRef<HTMLDivElement>(null);
  const fogBRef = useRef<HTMLDivElement>(null);
  const driveVeilRef = useRef<HTMLDivElement>(null);
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
  const statementRef = useRef<HTMLParagraphElement>(null);
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
    let H = 200; // side-view truck height
    let T = 600; // side-view truck rear x
    let vw = 1440;
    let vh = 900;
    let Wr = 200; // road width
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
      if (treesRef.current) treesRef.current.style.bottom = `${Wr - 2}px`;
      if (truckRef.current?.parentElement) truckRef.current.parentElement.style.bottom = `${Wr}px`;

      z = mobile ? 0.6 : Math.max(vw / W_W, 0.9);
      if (forestRef.current) {
        forestRef.current.style.width = `${W_W * z}px`;
        forestRef.current.style.height = `${W_H * z}px`;
        forestRef.current.style.backgroundImage = `url(${PART(mobile ? 'world-m-v3' : 'world-v3')})`;
      }
      if (aerialTruckRef.current) {
        aerialTruckRef.current.style.width = `${A_TRUCK_W * z}px`;
        aerialTruckRef.current.style.height = `${A_TRUCK_L * z}px`;
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

      // ---- Leg 1: loading (side view) ----
      const l = seg(p, 0, P_LOAD);
      const startX = -FORK_W * H - CRATE_W * H - 40;
      const readyX = T - (CRATE_OFFSET + CRATE_W + 0.04) * H;
      const pushedX = T - (CRATE_OFFSET - 0.06) * H;
      let forkX = lerp(startX, readyX, easeOut(seg(l, 0, 0.3)));
      forkX = lerp(forkX, pushedX, ease(seg(l, 0.45, 0.62)));
      forkX = lerp(forkX, startX, easeIn(seg(l, 0.68, 0.88)));
      const lift = (ease(seg(l, 0.3, 0.44)) - ease(seg(l, 0.63, 0.72))) * LIFT * H;
      // the truck only starts to roll: the drone lift takes it from here into the aerial view
      const truckX = T + easeIn(seg(l, 0.8, 1)) * vw * 0.06;
      set(forkRef.current, { transform: `translate3d(${forkX.toFixed(1)}px,0,0)` });
      set(carriageRef.current, { transform: `translate3d(0,${(-lift).toFixed(1)}px,0)` });
      set(crateRef.current, {
        transform: `translate3d(${(forkX + CRATE_OFFSET * H).toFixed(1)}px,${(-(FORK_TOP * H) - lift).toFixed(1)}px,0)`,
        opacity: l > 0.63 ? '0' : '1',
      });
      set(truckRef.current, { transform: `translate3d(${truckX.toFixed(1)}px,0,0)` });
      set(laneRef.current, { backgroundPositionX: `${(-easeIn(seg(l, 0.8, 1)) * vw * 0.06).toFixed(0)}px` });

      // ---- Into the forest: mist rolls in over the yard until it is all fog, then the fog clears
      // from the edges inward onto the forest from above. The road strip sits where the forest road
      // will be, and the truck swaps to the view from above while the fog is thickest.
      const lt = seg(p, P_LOAD - 0.06, P_LOAD + 0.06);
      const c1x = T + vw * 0.06 + (TRUCK_W * H) / 2;
      const bandY = vh - Wr / 2;
      set(loadRef.current, { visibility: p < P_LOAD + 0.06 ? 'visible' : 'hidden' });
      // the mist drifts at three depths as the scene plays
      const drift = l + lt * 0.6;
      [60, 140, 260].forEach((d, i) => set(treeLayerRefs[i].current, { backgroundPositionX: `${(-drift * d).toFixed(1)}px` }));
      const fogIn = ease(seg(lt, 0, 0.45));
      const clear = ease(seg(lt, 0.5, 1));
      if (clear > 0 && clear < 1) {
        const rx = lerp(230, 0, clear);
        const m = `radial-gradient(ellipse ${rx.toFixed(1)}% ${(rx * 0.85).toFixed(1)}% at ${c1x.toFixed(0)}px ${bandY.toFixed(0)}px, #000 0%, #000 45%, transparent 100%)`;
        set(bayFogRef.current, { maskImage: m, webkitMaskImage: m } as Partial<CSSStyleDeclaration>);
      } else {
        set(bayFogRef.current, { maskImage: 'none', webkitMaskImage: 'none' } as Partial<CSSStyleDeclaration>);
      }
      set(bayFogRef.current, { opacity: String(clear >= 1 ? 0 : fogIn * (1 - ease(seg(clear, 0.65, 1)))) });
      set(bayFogTexRef.current, { transform: `translate3d(${(-lt * 6).toFixed(2)}%,${(-lt * 10).toFixed(2)}%,0)` });
      set(bayRef.current, { opacity: String(1 - seg(lt, 0.4, 0.5)) });
      set(groundRef.current, { opacity: String(1 - seg(lt, 0.4, 0.5)) });
      set(truckRef.current?.parentElement ?? null, { opacity: String(1 - seg(lt, 0.4, 0.5)) });

      // ---- Leg 2: the road from the air, through forest and fog ----
      const r = seg(p, P_LOAD, P_ROAD);
      set(roadRef.current, {
        visibility: p >= P_LOAD - 0.05 && p < P_ROAD + 0.02 ? 'visible' : 'hidden',
      });
      if (p >= P_LOAD - 0.06 && p < P_ROAD + 0.02) {
        const mobile = vw < 768;
        // horizontal: where the camera keeps the corner on screen (phones see little of the straight)
        const ax = W_CX - W_R;
        const ay = W_YH + W_R;
        const RL = W_R + LANE;
        // the top-view truck takes over exactly where the side-view truck stood
        const c1 = c1x;
        const anchor0 = (c1 + (mobile ? 150 : 260) + W_R * z) / vw;
        const camX0 = W_CX * z - anchor0 * vw;
        // where the road sits on screen as the drone levels out: high enough to see the truck clearly
        const roadY0 = vh - Wr / 2; // exactly where the loading bay's road strip was
        const startX = (c1 + camX0) / z;
        const LA = ax - startX;
        const LArc = (Math.PI * RL) / 2;
        const LV = Math.min((vh * 1.3) / z, 1300);
        const u = lerp(0, LA + LArc + LV, ease(r) * 0.25 + r * 0.75);
        let x: number;
        let y: number;
        let rot: number;
        if (u <= LA) {
          x = startX + u;
          y = W_YH - LANE;
          rot = -90;
        } else if (u <= LA + LArc) {
          const th = (u - LA) / RL;
          x = ax + RL * Math.sin(th);
          y = ay - RL * Math.cos(th);
          rot = -90 + (th * 180) / Math.PI;
        } else {
          x = W_CX + LANE;
          y = ay + (u - LA - LArc);
          rot = 0;
        }
        // camera: road along the bottom of the screen (where the loading bay's road was), then it
        // follows the truck down the page once it has turned
        const k = ease(seg(u, LA - 120, LA + LArc + vh * 0.4 / z));
        const screenY = lerp(roadY0, vh * (mobile ? 0.74 : 0.55), k);
        const camY = Math.max(W_YH * z - (roadY0), y * z - screenY);
        // the camera holds the truck where the side-view truck stood until the corner pans into view
        const camX = Math.max(W_CX * z - lerp(anchor0, 0.5, k) * vw, x * z - c1);
        set(forestRef.current, { transform: `translate3d(${(-camX).toFixed(1)}px,${(-camY).toFixed(1)}px,0)` });
        set(aerialTruckRef.current, {
          opacity: String(seg(lt, 0.46, 0.52)),
          transform: `translate3d(${((x - A_TRUCK_W / 2) * z).toFixed(1)}px,${((y - A_TRUCK_L / 2) * z).toFixed(1)}px,0)`,
        });
        const [shadow, img] = Array.from(aerialTruckRef.current?.children ?? []) as HTMLElement[];
        if (img) img.style.transform = `rotate(${rot.toFixed(2)}deg)`;
        // the sun is fixed, so the shadow keeps falling the same way as the truck turns
        if (shadow) shadow.style.transform = `translate(${(9 * z).toFixed(1)}px,${(10 * z).toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`;
        // fog drifts across faster than the ground: it hangs between the camera and the trees
        set(fogARef.current, { transform: `translate3d(${(-r * 18).toFixed(2)}%,${(-r * 55).toFixed(2)}%,0)` });
        set(fogBRef.current, { transform: `translate3d(${(r * 12).toFixed(2)}%,${(-r * 70).toFixed(2)}%,0)` });
        set(driveVeilRef.current, { opacity: '0' });
        // the climb: the forest starts close and falls away beneath the camera
        set(liftRef.current, {
          transformOrigin: `${c1.toFixed(0)}px ${(roadY0).toFixed(0)}px`,
          transform: `scale(${lerp(1.15, 1, clear).toFixed(4)})`,
        });
        // low sun breaks through as the truck takes the corner, then softens
        const glare = 0.6 + 0.4 * window01(u, LA - 300, LA + LArc + 500, 0.4);
        set(sunRef.current, { opacity: glare.toFixed(3), transform: `translate3d(${(-r * 4).toFixed(2)}%,${(r * 3).toFixed(2)}%,0)` });
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
      // the statement fills in white word by word as the truck drives, like the reference
      if (statementRef.current) {
        const fill = (seg(p, P_LOAD + 0.03, P_LOAD + (P_ROAD - P_LOAD) * 0.6) * 100).toFixed(1);
        statementRef.current.style.backgroundImage = `linear-gradient(180deg, #fff 0%, #fff ${fill}%, rgba(255,255,255,0.32) ${fill}%)`;
      }
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
    <section ref={sectionRef} id="services" aria-label="Our services" className="relative h-[460vh] scroll-mt-24 md:h-[680vh] bg-space text-white">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* ---------- Sea film ---------- */}
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,transparent_40%,rgba(5,7,15,0.7))]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[rgba(10,22,64,0.14)]" />

        {/* ---------- Leg 1: loading, on white ---------- */}
        <div ref={loadRef} className="absolute inset-0 z-[1] text-ink" style={{ ['--h' as string]: '200px' }}>
          {/* a foggy morning behind the yard */}
          <div ref={bayRef} aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_bottom,#C9D0D2_0%,#DCE1E2_40%,#EDEFEE_80%,#F4F5F4_100%)]">
            {/* drifting morning mist, thickest along the horizon */}
            <div ref={treesRef} className="absolute inset-x-0 top-0" style={{ bottom: '22%' }}>
              <div ref={treeLayerRefs[0]} className="absolute -inset-x-[30%] inset-y-0 opacity-50" style={{ backgroundImage: `url(${PART('fog-a')})`, backgroundSize: '1400px 1400px' }} />
              <div ref={treeLayerRefs[1]} className="absolute -inset-x-[30%] inset-y-0 opacity-40" style={{ backgroundImage: `url(${PART('fog-b')})`, backgroundSize: '900px 900px', backgroundPosition: '300px 200px' }} />
              <div ref={treeLayerRefs[2]} className="absolute -inset-x-[30%] bottom-0 h-[45%] opacity-70" style={{ backgroundImage: `url(${PART('fog-a')})`, backgroundSize: '700px 700px', backgroundPosition: '0 100%', maskImage: 'linear-gradient(to top, #000 30%, transparent)', WebkitMaskImage: 'linear-gradient(to top, #000 30%, transparent)' }} />
              <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[linear-gradient(to_top,rgba(246,247,246,0.95),rgba(246,247,246,0))]" />
            </div>
          </div>
          <div ref={groundRef} className="absolute inset-x-0 bottom-0 bg-[#2a2c2f] bg-repeat-x" style={{ height: '22%', backgroundImage: `url(${PART('ground-side')})`, backgroundSize: 'auto 100%' }}>
            <div
              ref={laneRef}
              aria-hidden="true"
              className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2"
              style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.55) 0 50%, transparent 50% 100%)', backgroundSize: '54px 3px' }}
            />
          </div>
          <div aria-hidden="true" className="absolute inset-x-0" style={{ bottom: '22%' }}>
            <div ref={forkRef} className="absolute bottom-0 left-0" style={{ width: unit(FORK_W), height: unit(FORK_H) }}>
              <div aria-hidden="true" className="absolute -bottom-[5%] left-[2%] right-[10%] h-[11%] rounded-[50%] bg-black/40 blur-[5px]" />
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
              <div aria-hidden="true" className="absolute -bottom-[4%] left-[1%] right-[3%] h-[9%] rounded-[50%] bg-black/45 blur-[6px]" />
              <img src={PART('truck')} alt="" className="absolute inset-0 h-full w-full" draggable={false} />
            </div>
          </div>
          <div ref={bayFogRef} aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-[#E4E9E7]" />
            <div ref={bayFogTexRef} className="absolute -inset-[20%] will-change-transform" style={{ backgroundImage: `url(${PART('fog-a')}), url(${PART('fog-b')})`, backgroundSize: '1000px 1000px, 700px 700px' }} />
          </div>
        </div>

        {/* ---------- Leg 2: the road from the air ---------- */}
        <div ref={roadRef} aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#16201a]" style={{ visibility: 'hidden' }}>
          <div ref={liftRef} className="absolute inset-0 will-change-transform">
          <div ref={forestRef} className="absolute left-0 top-0 will-change-transform" style={{ backgroundSize: '100% 100%' }}>
            <div ref={aerialTruckRef} className="absolute left-0 top-0 will-change-transform">
              <div className="absolute inset-[4%] rounded-[12%] bg-black/55 blur-[5px] will-change-transform" />
              <img src={PART('truck-aerial-v2')} alt="" draggable={false} className="relative h-full w-full max-w-none origin-center will-change-transform" />
            </div>
          </div>
          </div>
          {/* sun glare, from the upper left where the light falls from */}
          <div ref={sunRef} className="pointer-events-none absolute -inset-[10%] mix-blend-screen will-change-transform" style={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-[radial-gradient(38%_34%_at_14%_10%,rgba(214,226,255,0.95)_0%,rgba(176,196,245,0.45)_35%,rgba(150,175,235,0)_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_14%_10%,rgba(190,206,250,0.3)_0%,rgba(190,206,250,0)_70%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(205,218,252,0.16)_0%,rgba(205,218,252,0)_34%,rgba(205,218,252,0)_100%)]" />
            <div className="absolute left-[34%] top-[30%] h-16 w-16 rounded-full bg-[radial-gradient(circle,rgba(220,230,255,0.35),rgba(220,230,255,0)_70%)]" />
            <div className="absolute left-[52%] top-[52%] h-28 w-28 rounded-full border border-[rgba(205,218,252,0.12)] bg-[radial-gradient(circle,rgba(205,218,252,0)_55%,rgba(205,218,252,0.10)_70%,rgba(205,218,252,0)_72%)]" />
          </div>
          {/* fog */}
          <div className="pointer-events-none absolute inset-0" style={{ maskImage: 'linear-gradient(to right, #000 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.25) 70%, #000 100%)', WebkitMaskImage: 'linear-gradient(to right, #000 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.25) 70%, #000 100%)' }}>
            <div className="absolute -inset-x-[20%] top-0 h-[400%] opacity-70" ref={fogARef} style={{ backgroundImage: `url(${PART('fog-a')})`, backgroundSize: '1100px 1100px' }} />
            <div className="absolute -inset-x-[20%] top-0 h-[400%] opacity-45" ref={fogBRef} style={{ backgroundImage: `url(${PART('fog-b')})`, backgroundSize: '760px 760px' }} />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(214,224,242,0.55)_0%,rgba(214,224,242,0.12)_28%,rgba(214,224,242,0)_50%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(206,218,240,0.45)_0%,rgba(206,218,240,0)_22%,rgba(206,218,240,0)_78%,rgba(206,218,240,0.45)_100%)]" />
          {/* brand grade: pulls the forest toward the site's blue without losing the photo's light */}
          <div className="pointer-events-none absolute inset-0 bg-[#23408E] opacity-[0.2] mix-blend-color" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,22,64,0.18),rgba(10,22,64,0.04)_45%,rgba(10,22,64,0.22))] mix-blend-multiply" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_80%_at_50%_45%,transparent_55%,rgba(10,22,64,0.45))]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(10,22,64,0.55),rgba(10,22,64,0))]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[75%] bg-[linear-gradient(to_bottom,rgba(10,22,64,0.6),rgba(10,22,64,0.35)_55%,rgba(10,22,64,0))] lg:hidden" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(10,22,64,0.45)_0%,rgba(10,22,64,0)_30%,rgba(10,22,64,0)_70%,rgba(10,22,64,0.3)_100%)]" />
          <div ref={driveVeilRef} className="pointer-events-none absolute inset-0 bg-paper" />
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
        <div ref={copyRefs[0]} className="container-x absolute inset-x-0 top-0 z-[2] pt-28 text-ink sm:pt-32">
          <p className="eyebrow">Our services</p>
          <h2 className="mt-5 max-w-3xl text-[36px] font-medium leading-[1.02] sm:text-[56px] lg:text-[64px]">Every order, packed and on its way.</h2>
          <p className="mt-5 max-w-md text-[16px] leading-[1.65] text-muted sm:text-[17px]">
            From the supplier&apos;s door to yours, we handle each step and keep you posted along the way.
          </p>
        </div>

        {/* United Carriers–style hero over the forest: a huge squared uppercase word low on the left,
            one big statement on the right that fills in white as you scroll, small mono labels */}
        <div ref={copyRefs[1]} className="absolute inset-0 z-[2] text-white" style={{ opacity: 0 }}>
          <div className="absolute right-5 top-24 w-[min(88vw,560px)] sm:top-28 lg:right-[3.2vw] lg:top-[24%] lg:w-[29vw]">
            <p className="font-['Share_Tech_Mono',ui-monospace,monospace] text-[12px] uppercase tracking-[0.08em] text-white/70 sm:text-[13px]">What we do · Six services</p>
            <p
              ref={statementRef}
              className="mt-3 bg-clip-text font-['Helvetica_Neue',Helvetica,Arial,sans-serif] text-[26px] font-medium leading-[1.04] tracking-[-0.02em] text-transparent sm:text-[34px] lg:text-[2.3vw]"
              style={{ backgroundImage: 'linear-gradient(180deg, #fff 0%, #fff 0%, rgba(255,255,255,0.32) 0%)', WebkitBackgroundClip: 'text' }}
            >
              One partner for the whole journey, so nothing gets lost between suppliers, inspectors and carriers.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-2.5 sm:mt-8">
              {services.map((sv, i) => (
                <li
                  key={sv.title}
                  ref={(el) => {
                    serviceRefs.current[i] = el;
                  }}
                  className="flex items-baseline gap-2 border-t border-white/20 pt-2"
                  style={{ opacity: 0 }}
                >
                  <span className="font-['Share_Tech_Mono',ui-monospace,monospace] text-[11px] text-white/55 sm:text-[12px]">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-['Share_Tech_Mono',ui-monospace,monospace] text-[12px] uppercase leading-tight tracking-[0.04em] sm:text-[13px]">{sv.title}</span>
                </li>
              ))}
            </ul>
          </div>
          <h3 className="absolute bottom-24 left-5 font-['Russo_One',sans-serif] text-[17vw] uppercase leading-[0.86] tracking-[-0.01em] sm:bottom-20 lg:bottom-[9vh] lg:left-[2.6vw] lg:text-[7vw]">
            Services
          </h3>
        </div>

        <div ref={copyRefs[2]} className="container-x absolute inset-0 z-[2] flex flex-col justify-between py-28 sm:py-24" style={{ opacity: 0 }}>
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
        <div className="container-x pointer-events-none absolute inset-x-0 bottom-0 z-[2] hidden pb-6 lg:block [@media(max-height:820px)]:!hidden">
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
