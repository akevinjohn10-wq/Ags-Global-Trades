import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Handshake, Receipt, Truck } from 'lucide-react';
import { services } from '@/data/siteContent';

/**
 * Services scroll story, frame by frame:
 *  1. The reach stacker drives in from the left to the stack and locks onto the grey container
 *  2. It lifts it and turns to face us                                    (119 video frames)
 *  3. The empty truck slides in, the container is lowered onto it, the spreader lifts away
 *  4. The truck pulls out: the frame zooms out, a black panel rises with the services
 *  5. The camera rises over the truck to top-down; the road slides in under it (119 frames)
 *  6. The truck drives the road through a junction and down between the services
 *  7. Fog rolls over, then the ship sails on, held for a while with "Why AGS Trade"
 *  8. Clouds and a huge plane sweep across into the next section
 *
 * Scenes 1-6 are drawn on one 2D canvas in "stage" units (the 1280 x 720 video frame).
 * The ship scene, fog, sky and text are DOM layers on top.
 */

const V = (n: string) => `/story/v3/${n}`;
const FRAMES = 119;

const VALUES = [
  { title: 'Verified suppliers', text: 'Every maker is checked before we place your order.', icon: BadgeCheck },
  { title: 'One point of contact', text: 'A named manager from enquiry to delivery.', icon: Handshake },
  { title: 'Clear, honest quotes', text: 'Product, packing and shipping in one price.', icon: Receipt },
  { title: 'Shipping handled', text: 'Booked with trusted shipping and courier partners.', icon: Truck },
];

// ---------- stage geometry ----------
const BG = '#fbfbfb';
const ROAD = '#0d0f13';
const GROUND1 = 679;
const TS = 1.125;
const TRUCK = { x: 90.25, y: 174.4, w: 1280 * TS, h: 714 * TS };
const GROUND2 = TRUCK.y + 544 * TS;
const LOWER = 90;
const SPLIT_SPREAD = 300;
const SPLIT_BOX = 567;
const TRUCK_C = { x: TRUCK.x + 639.5 * TS, y: TRUCK.y + 360 * TS };
const RISE = { x: TRUCK.x, y: TRUCK.y, w: 1280 * TS, h: 720 * TS };
const LIFT = 23; // grey box rests this much lower on the stack before it is locked on

// ---------- world (top view) ----------
const TL = 1155 * TS;
const WR = 700;
const A = 2600;
const R = 900;
const B = 7000;
const ARC = (Math.PI / 2) * R;
const XS = A + R;
const S_END = A + ARC + B;
const BOX = { x: (56 - 639.5) * TS, y: (234 - 360) * TS, w: 856 * TS, h: 262 * TS };

// ---------- timeline ----------
const T = {
  intro: [0, 0.04],
  driveIn: [0.004, 0.055],
  lock: [0.055, 0.068],
  turn: [0.068, 0.23],
  truckIn: [0.23, 0.27],
  lower: [0.27, 0.295],
  swap: [0.292, 0.3],
  release: [0.3, 0.325],
  shrink: [0.325, 0.38],
  services: [0.36, 0.47],
  rise: [0.47, 0.55],
  road: [0.55, 0.72],
  fog: [0.69, 0.775],
  ship: [0.725, 0.88],
  sky: [0.86, 1],
} as const;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, r: readonly [number, number]) => clamp((p - r[0]) / (r[1] - r[0]));
const ease = (t: number) => t * t * (3 - 2 * t);
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const win = (p: number, a: number, b: number, edge = 0.25) => {
  const t = clamp((p - a) / (b - a));
  return ease(Math.min(clamp(t / edge), clamp((1 - t) / edge)));
};

/** Position and heading (radians, 0 = east, +PI/2 = south) along the road. */
function path(s: number): [number, number, number] {
  if (s <= A) return [s, 0, 0];
  if (s <= A + ARC) {
    const a = (s - A) / R;
    return [A + R * Math.sin(a), R - R * Math.cos(a), a];
  }
  return [XS, R + (s - A - ARC), Math.PI / 2];
}

const FADE_MASK = 'linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)';

export default function StoryV3() {
  const [reduce] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  return reduce ? <StoryStatic /> : <StoryFilm />;
}

function StoryFilm() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seaRef = useRef<HTMLVideoElement>(null);
  const wakeRef = useRef<HTMLVideoElement>(null);
  const q = useRef<Record<string, HTMLElement | null>>({});
  const r = (k: string) => (el: HTMLElement | null) => {
    q.current[k] = el;
  };
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const roadRefs = useRef<(HTMLLIElement | null)[]>([]);
  const valueRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const g = canvas?.getContext('2d');
    if (!section || !canvas || !g) return;
    const $ = (k: string) => q.current[k] ?? null;
    const set = (el: HTMLElement | null, css: Partial<CSSStyleDeclaration>) => {
      if (el) Object.assign(el.style, css);
    };
    const show = (k: string, v: number, extra: Partial<CSSStyleDeclaration> = {}) =>
      set($(k), { opacity: v.toFixed(3), visibility: v < 0.01 ? 'hidden' : 'visible', ...extra });

    let vw = 1440;
    let vh = 900;
    let dpr = 1;
    let mobile = false;
    let p = 0;
    let raf = 0;

    // ---------- images ----------
    const img = (src: string) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => onScroll();
      im.src = src;
      return im;
    };
    const ready = (im?: HTMLImageElement | null) => !!im && im.complete && im.naturalWidth > 0;
    const one: Record<string, HTMLImageElement> = {};
    const turn: (HTMLImageElement | null)[] = new Array(FRAMES).fill(null);
    const riseCut: (HTMLImageElement | null)[] = new Array(FRAMES).fill(null);
    let loading = false;
    const startLoading = () => {
      if (loading) return;
      loading = true;
      const dir = mobile ? '-m' : '';
      for (const n of ['f0-machine', 'f0-grey', 'f0-stack', 'f118', 'truck-empty', 'truck-loaded', 'truck-top-cab', 'truck-top-box']) one[n] = img(V(`${n}.webp`));
      const order: number[] = [];
      for (let s = 4; s >= 1; s = s >> 1) for (let i = 0; i < FRAMES; i += s) if (!order.includes(i)) order.push(i);
      order.forEach((i, k) =>
        setTimeout(() => {
          const n = String(i).padStart(3, '0');
          turn[i] = img(V(`turn${dir}/${n}.webp`));
          riseCut[i] = img(V(`risecut${dir}/${n}.webp`));
        }, k * 12),
      );
    };
    const frame = (arr: (HTMLImageElement | null)[], i: number, lo = 0, hi = FRAMES - 1) => {
      for (let d = 0; d < FRAMES; d++) {
        const a = i - d >= lo ? arr[i - d] : null;
        if (ready(a)) return a;
        const b = i + d <= hi ? arr[i + d] : null;
        if (ready(b)) return b;
      }
      return null;
    };

    const size = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      mobile = vw < 768;
      dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      update();
    };

    // ---------- sea and wake play only while the ship is on screen ----------
    let seaOn = false;
    const setSea = (on: boolean) => {
      if (on === seaOn) return;
      seaOn = on;
      for (const [el, src] of [
        [seaRef.current, V('sea.mp4')],
        [wakeRef.current, V('wake.mp4')],
      ] as const) {
        if (!el) continue;
        if (on) {
          if (!el.src) {
            el.muted = true;
            el.src = src;
          }
          el.play().catch(() => {});
        } else el.pause();
      }
    };

    function drawImg(im: HTMLImageElement | null | undefined, x: number, y: number, w: number, h: number, alpha = 1) {
      if (!ready(im) || alpha <= 0.002) return;
      g!.globalAlpha = alpha;
      g!.drawImage(im!, x, y, w, h);
      g!.globalAlpha = 1;
    }
    function drawRows(im: HTMLImageElement | null | undefined, rect: { x: number; y: number; w: number; h: number }, sy0: number, sy1: number, dy: number, alpha = 1) {
      if (!ready(im) || alpha <= 0.002) return;
      const sy = im!.naturalHeight / 720;
      const ky = rect.h / 720;
      g!.globalAlpha = alpha;
      g!.drawImage(im!, 0, sy0 * sy, im!.naturalWidth, (sy1 - sy0) * sy, rect.x, rect.y + sy0 * ky + dy, rect.w, (sy1 - sy0) * ky);
      g!.globalAlpha = 1;
    }
    /** Lane dashes running along a horizontal band, offset by distance travelled. */
    function dashes(y: number, scale: number, travelled: number, alpha: number) {
      if (alpha <= 0.01) return;
      const dl = 120 * scale;
      const gap = 140 * scale;
      g!.fillStyle = `rgba(255,255,255,${(0.55 * alpha).toFixed(3)})`;
      const off = travelled % (dl + gap);
      for (let x = -off - (dl + gap); x < vw + dl; x += dl + gap) g!.fillRect(x, y - 7 * scale, dl, 14 * scale);
    }

    function update() {
      raf = 0;
      const rect = section!.getBoundingClientRect();
      const span = rect.height - vh;
      p = span > 0 ? clamp(-rect.top / span) : 0;
      if (rect.top < vh * 2.5) startLoading();

      g!.setTransform(dpr, 0, 0, dpr, 0, 0);
      g!.clearRect(0, 0, vw, vh);

      // camera for the stage scenes
      const K1 = mobile ? (vw * 1.3) / 1280 : Math.min((vw * 0.85) / 1280, (vh * 0.68) / 720);
      const K3 = mobile ? (vw * 0.92) / 1302 : K1 * 0.55;
      const shrink = easeIO(seg(p, T.shrink));
      const K = lerp(K1, K3, shrink);
      const startX = mobile ? 640 : lerp(540, 640, ease(seg(p, [T.turn[0] + 0.04, T.turn[1]])));
      const sx0 = lerp(startX, TRUCK_C.x, shrink);
      const sy0 = lerp(GROUND1, TRUCK_C.y, shrink);
      const ay = lerp(vh * (mobile ? 0.66 : 0.8), vh * (mobile ? 0.2 : 0.25), shrink);
      const OX = vw / 2 - sx0 * K;
      const OY = ay - sy0 * K;
      const toY = (y: number) => OY + y * K;
      const R_ = (b: { x: number; y: number; w: number; h: number }) => [OX + b.x * K, OY + b.y * K, b.w * K, b.h * K] as const;
      const FULL = { x: 0, y: 0, w: 1280, h: 720 };

      const truckIn = easeOut(seg(p, T.truckIn));
      const groundStage = lerp(GROUND1, GROUND2, truckIn);
      const riseT = seg(p, T.rise);
      const riseI = Math.round(riseT * (FRAMES - 1));
      // the truck stays on the road while the camera rises: the band grows from under the wheels to the full road
      const toRoad = easeIO(clamp(riseT / 0.95));
      const travelled = (p - T.release[1]) * vw * 9;

      // ===================== stage scenes (1-5) =====================
      if (p < T.road[0]) {
        g!.fillStyle = BG;
        g!.fillRect(0, 0, vw, vh);

        // "OUR SERVICES" drifting behind the truck while it drives
        const mq = win(p, T.shrink[0] + 0.02, T.rise[0] + 0.03, 0.15);
        if (mq > 0.01) {
          const ty = toY(TRUCK_C.y);
          const fs = Math.min(vh * 0.26, vw * 0.2);
          g!.font = `700 ${fs}px Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif`;
          g!.textBaseline = 'middle';
          g!.fillStyle = `rgba(20,24,32,${(0.07 * mq).toFixed(3)})`;
          g!.fillText('OUR SERVICES  OUR SERVICES', vw * 0.55 - seg(p, [T.shrink[0], T.rise[0] + 0.03]) * vw * 1.6, ty);
        }

        // ground strip -> services panel -> road band
        let top = toY(groundStage + 2);
        let bottom = vh;
        if (p > T.rise[0]) {
          top = lerp(top, toY(TRUCK_C.y - WR / 2), toRoad);
          bottom = lerp(vh, toY(TRUCK_C.y + WR / 2), toRoad);
        }
        g!.fillStyle = ROAD;
        g!.fillRect(0, top, vw, Math.max(0, bottom - top));
        // the road under the wheels: dashes on the strip while the truck drives, then on the road band
        if (p > T.release[1]) dashes(toRoad > 0 ? (top + bottom) / 2 : top + 70 * K, K, travelled, toRoad > 0 ? toRoad : 0.5 * win(p, T.release[1], T.rise[0] + 0.03, 0.08));
        set($('panel'), { top: `${top.toFixed(1)}px` });

        const clipTop = (fn: () => void) => {
          g!.save();
          g!.beginPath();
          g!.rect(0, 0, vw, top);
          g!.clip();
          fn();
          g!.restore();
        };

        if (p < T.turn[0]) {
          // 1. drive in from the left, lock onto the grey box
          const drive = easeOut(seg(p, T.driveIn));
          const lock = ease(seg(p, T.lock));
          const [fx, fy, fw, fh] = R_(FULL);
          clipTop(() => {
            drawImg(one['f0-stack'], fx, fy, fw, fh);
            drawImg(one['f0-grey'], fx, fy + LIFT * (1 - lock) * K, fw, fh);
            drawImg(one['f0-machine'], fx - (1 - drive) * 1700 * K, fy, fw, fh);
          });
        } else if (p < T.truckIn[0]) {
          // 2. lift and turn, frame by frame
          const fr = frame(turn, Math.round(seg(p, T.turn) * (FRAMES - 1)));
          if (fr) clipTop(() => g!.drawImage(fr, ...R_(FULL)));
        } else if (p < T.rise[0]) {
          // 3. truck in, container lowered, spreader released; 4. pull out
          const lower = ease(seg(p, T.lower)) * LOWER;
          const swap = ease(seg(p, T.swap));
          const release = ease(seg(p, T.release));
          const L = R_(FULL);
          const L2 = { x: L[0], y: L[1], w: L[2], h: L[3] };
          drawRows(one.f118, L2, SPLIT_BOX, GROUND1 + 2, 0, 1 - swap);
          const [ex, ey, ew, eh] = R_({ ...TRUCK, x: TRUCK.x + (1 - truckIn) * 1700 });
          drawImg(one['truck-empty'], ex, ey, ew, eh, 1 - swap);
          drawImg(one['truck-loaded'], ex, ey, ew, eh, swap);
          drawRows(one.f118, L2, SPLIT_SPREAD, SPLIT_BOX, lower * K, 1 - swap);
          drawRows(one.f118, L2, 0, SPLIT_SPREAD, (lower - release * 420) * K, 1 - release);
        } else {
          // 5. the camera rises over the truck, which stays on the road (frames are cut out)
          const fr = frame(riseCut, riseI);
          if (fr) g!.drawImage(fr, ...R_(RISE));
        }
      }

      // ===================== 6. the road, top-down =====================
      if (p >= T.road[0] && p < T.fog[1]) {
        const s = S_END * easeIO(seg(p, T.road)) * 0.97;
        const [px, py, hd] = path(s);
        const hx = OX + TRUCK_C.x * K;
        const hy = OY + TRUCK_C.y * K;
        const zRoad = (vh * (mobile ? 0.3 : 0.34)) / TL;
        const settle = easeIO(clamp(seg(p, T.road) / 0.22));
        const z = lerp(K, zRoad, settle);
        const sxA = lerp(hx, vw / 2, settle);
        const syA = lerp(hy, vh * (mobile ? 0.42 : 0.4), settle);

        g!.save();
        g!.translate(sxA, syA);
        g!.scale(z, z);
        g!.translate(-px, -py);
        g!.fillStyle = BG;
        g!.fillRect(px - 40000, py - 40000, 80000, 80000);
        g!.strokeStyle = ROAD;
        g!.lineWidth = WR;
        g!.beginPath();
        g!.moveTo(-14000, 0);
        g!.lineTo(A + R + 5000, 0);
        g!.stroke();
        g!.beginPath();
        g!.moveTo(A - 2, 0);
        g!.arc(A, R, R, -Math.PI / 2, 0);
        g!.lineTo(XS, S_END + 6000);
        g!.stroke();
        g!.fillStyle = ROAD;
        g!.fillRect(XS - WR / 2, -WR / 2, WR, WR + 2);
        g!.strokeStyle = 'rgba(255,255,255,0.55)';
        g!.lineWidth = 14;
        g!.setLineDash([120, 140]);
        g!.lineDashOffset = 0;
        g!.beginPath();
        g!.moveTo(-14000, 0);
        g!.lineTo(A - WR / 2 - 60, 0);
        g!.moveTo(XS, WR / 2 + 60);
        g!.lineTo(XS, S_END + 6000);
        g!.moveTo(XS + WR / 2 + 60, 0);
        g!.lineTo(A + R + 5000, 0);
        g!.stroke();
        g!.setLineDash([]);
        g!.fillStyle = 'rgba(255,255,255,0.6)';
        for (let i = -WR / 2 + 30; i < WR / 2 - 20; i += 70) {
          g!.fillRect(XS - WR / 2 - 160, i, 110, 34);
          g!.fillRect(XS + i, WR / 2 + 50, 34, 110);
        }
        // the truck
        g!.translate(px, py);
        g!.rotate(hd);
        g!.fillStyle = '#2a2d33';
        g!.fillRect(BOX.x + 30, -60, BOX.w - 60, 34);
        g!.fillRect(BOX.x + 30, 26, BOX.w - 60, 34);
        if (ready(one['truck-top-cab'])) g!.drawImage(one['truck-top-cab'], -639.5 * TS, -360 * TS, 1280 * TS, 714 * TS);
        if (ready(one['truck-top-box'])) g!.drawImage(one['truck-top-box'], BOX.x, BOX.y, BOX.w, BOX.h);
        g!.restore();
      }

      // ===================== 7. fog, then the ship at sea =====================
      const fog = seg(p, T.fog);
      set($('fog'), { display: fog > 0 && fog < 1 ? '' : 'none' });
      if (fog > 0 && fog < 1) {
        set($('fogA'), { transform: `translate3d(0,${lerp(120, -140, fog).toFixed(2)}%,0) scale(1.6)` });
        set($('fogB'), { transform: `translate3d(0,${lerp(150, -170, fog).toFixed(2)}%,0) scale(2)` });
        set($('fogWash'), { opacity: win(fog, 0.18, 0.82, 0.35).toFixed(3) });
      }
      const shipOn = p > (T.fog[0] + T.fog[1]) / 2 && rect.bottom > 0;
      set($('shipScene'), { display: shipOn ? '' : 'none' });
      set(canvas, { visibility: shipOn ? 'hidden' : 'visible' });
      setSea(shipOn);
      if (shipOn) {
        // the ship drifts slowly down the screen while you scroll, on top of its own bobbing
        // starts close on the ship and pulls back as you scroll
        const sp = seg(p, T.ship);
        const zo = easeIO(clamp(sp / 0.92));
        const H = lerp(mobile ? 150 : 175, mobile ? 34 : 44, zo); // ship length in vh
        const top = lerp(mobile ? 6 : -10, mobile ? 25 : 32, zo) + sp * 2;
        const w = (H * 760) / 2643;
        const ww = w * 2.95;
        const wh = (ww * 9) / 16;
        set($('shipBox'), { height: `${H.toFixed(2)}vh`, top: `${top.toFixed(2)}vh` });
        if (wakeRef.current)
          set(wakeRef.current, { width: `${ww.toFixed(2)}vh`, height: `${wh.toFixed(2)}vh`, marginLeft: `${(-ww / 2).toFixed(2)}vh`, top: `${(top - wh * 0.89).toFixed(2)}vh` });
      }

      // ===================== 8. sky: clouds and a plane =====================
      // runs on past the end of the section: the cloud wall wipes the sea away, the next section
      // slides in underneath it, and the plane carries on across the top of that section
      const skyA = T.sky[0] * span;
      const skyB = span + vh * 0.9;
      const u = clamp((-rect.top - skyA) / (skyB - skyA));
      const skyOn = -rect.top > skyA - 10 && -rect.top < skyB;
      set($('sky'), { display: skyOn ? '' : 'none' });
      if (skyOn) {
        set($('bank'), { transform: `translate3d(0,${(vh - 5 * vh * u).toFixed(1)}px,0)` });
        set($('cloudA'), { transform: `translate3d(0,${lerp(110, -260, u).toFixed(2)}%,0) scale(1.5)`, opacity: String(Math.min(1, u * 6)) });
        set($('cloudB'), { transform: `translate3d(0,${lerp(160, -230, u).toFixed(2)}%,0) scale(1.9)` });
        // the whole aircraft crosses the page, lingering through the middle
        const t = clamp((u - 0.06) / 0.9);
        const glide = 0.5 + 4 * Math.pow(t - 0.5, 3);
        const pw = Math.min(vw * (mobile ? 0.98 : 0.9), vh * 1.18 * (1369 / 1087));
        set($('plane'), { width: `${pw.toFixed(0)}px`, transform: `translate3d(${lerp(-pw - 40, vw + 40, glide).toFixed(1)}px,-50%,0)` });
      }

      // ===================== copy =====================
      const c0 = clamp((T.intro[1] - p) / 0.03);
      show('copy0', c0, { transform: `translate3d(0,${((1 - c0) * -20).toFixed(1)}px,0)` });
      show('panelCopy', win(p, T.shrink[0] + 0.015, T.rise[0] + 0.015, 0.12));
      const row = $('row');
      if (row) row.style.transform = `translate3d(${lerp(vw * 0.25, -Math.max(0, row.scrollWidth - vw * 0.7), seg(p, T.services)).toFixed(1)}px,0,0)`;
      rowRefs.current.forEach((li, i) => {
        if (li) li.style.opacity = String(ease(clamp((p - T.services[0] - i * 0.008) / 0.03)));
      });
      const roadT = seg(p, T.road);
      show('copy1', win(roadT, 0.42, 1.06, 0.12) * (1 - ease(seg(p, [T.fog[0], T.fog[0] + 0.03]))));
      roadRefs.current.forEach((li, i) => {
        if (!li) return;
        const t = ease(clamp((roadT - 0.46 - i * 0.06) / 0.08));
        li.style.opacity = String(t);
        li.style.transform = `translate3d(0,${((1 - t) * 20).toFixed(1)}px,0)`;
      });
      const shipT = seg(p, T.ship);
      show('copy2', win(shipT, 0.3, 1.04, 0.14));
      valueRefs.current.forEach((li, i) => {
        if (!li) return;
        const t = ease(clamp((shipT - 0.45 - i * 0.07) / 0.12));
        li.style.opacity = String(t);
        li.style.transform = `translate3d(${((1 - t) * (i % 2 ? 24 : -24)).toFixed(1)}px,0,0)`;
      });

      // speed while the truck is moving
      let kmh = 0;
      if (p > T.release[1] && p < T.fog[0] + 0.02) {
        kmh = 64 * easeOut(seg(p, [T.release[1], T.shrink[1]]));
        if (p > T.road[0]) kmh = 64 - 36 * Math.exp(-Math.pow((roadT - A / S_END) / 0.05, 2));
      }
      const spd = $('kmh');
      if (spd) spd.textContent = String(Math.max(0, Math.round(kmh))).padStart(2, '0');
      show('speed', win(p, T.release[1], T.fog[0] + 0.03, 0.06));
    }

    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }

    size();
    const ro = new ResizeObserver(size);
    ro.observe(section);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', size);
    return () => {
      cancelAnimationFrame(raf);
      setSea(false);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', size);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={sectionRef} id="services" aria-label="Our services" className="relative h-[1350vh] scroll-mt-24 bg-[#fbfbfb] md:h-[1650vh]">
      <style>{`
        @keyframes ags-bob { 0%,100% { transform: translate3d(0,0,0) rotate(-0.35deg); } 50% { transform: translate3d(0,0.7%,0) rotate(0.35deg); } }
        @keyframes ags-hum { 0%,100% { transform: translate3d(0,0,0); } 25% { transform: translate3d(0.4px,-0.3px,0); } 50% { transform: translate3d(-0.3px,0.4px,0); } 75% { transform: translate3d(0.3px,0.2px,0); } }
      `}</style>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />

        {/* 7. the ship at sea */}
        <div ref={r('shipScene')} aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#0b2a45]" style={{ display: 'none' }}>
          <video ref={seaRef} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover" />
          <div ref={r('shipMove')} className="absolute inset-0">
            {/* wake behind the stern (kept outside any transform so it blends with the sea) */}
            <video ref={wakeRef} muted loop playsInline preload="none" className="absolute left-1/2 object-cover mix-blend-screen" style={{ opacity: 0.9 }} />
            <div ref={r('shipBox')} className="absolute left-1/2 -translate-x-1/2" style={{ aspectRatio: '760 / 2643' }}>
              {/* shadow in the water: a wide soft one thrown down-right, and a tight dark one at the hull */}
              <div className="absolute inset-[2%] translate-x-[9%] translate-y-[2.5%] rounded-[45%] bg-[#020a14]/55 blur-[26px]" />
              <div className="absolute inset-[1%] rounded-[46%] bg-[#020a14]/50 blur-[8px]" />
              <div className="relative h-full w-full" style={{ animation: 'ags-bob 7s ease-in-out infinite' }}>
                <div className="relative h-full w-full" style={{ animation: 'ags-hum 0.9s linear infinite' }}>
                  <picture>
                    <source media="(max-width: 767px)" srcSet={V('ship-full-m.webp')} />
                    <img
                      src={V('ship-full.webp')}
                      alt=""
                      draggable={false}
                      className="h-full w-full"
                      style={{ filter: 'brightness(0.8) contrast(1.06) saturate(0.78) drop-shadow(0 0 2px rgba(2,10,20,0.7))' }}
                    />
                  </picture>
                  {/* sea-coloured tint and sunlight from the upper left, clipped to the ship's own outline */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(160deg, rgba(190,215,235,0.16) 0%, rgba(11,42,69,0.22) 45%, rgba(2,12,24,0.42) 100%)',
                      WebkitMaskImage: `url(${V('ship-full.webp')})`,
                      maskImage: `url(${V('ship-full.webp')})`,
                      WebkitMaskSize: '100% 100%',
                      maskSize: '100% 100%',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* darken the whole scene a little, plus a vignette */}
          <div className="absolute inset-0 bg-[#020a14]/25" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_50%,rgba(2,12,24,0.55))]" />
        </div>

        {/* 1. intro */}
        <div ref={r('copy0')} className="container-x absolute inset-x-0 top-0 z-[2] pt-28 text-ink sm:pt-32">
          <p className="eyebrow">Our services</p>
          <h2 className="mt-5 max-w-3xl text-[36px] font-medium leading-[1.02] sm:text-[56px] lg:text-[64px]">Every order, packed and on its way.</h2>
          <p className="mt-5 max-w-md text-[16px] leading-[1.65] text-muted sm:text-[17px]">From the supplier&apos;s door to yours, we handle each step and keep you posted along the way.</p>
        </div>

        {/* 4. the black panel under the truck */}
        <div ref={r('panel')} className="absolute inset-x-0 z-[2] overflow-hidden" style={{ top: '100%' }}>
          <div ref={r('panelCopy')} className="text-white" style={{ opacity: 0, visibility: 'hidden' }}>
            <div className="container-x grid gap-6 pt-10 lg:grid-cols-12 lg:pt-14">
              <div className="lg:col-span-5">
                <p className="eyebrow eyebrow-light">What we do</p>
                <h3 className="mt-4 font-display text-[30px] font-medium leading-[1.03] sm:text-[48px]">Six services. One team.</h3>
              </div>
              <p className="max-w-md text-[15px] leading-[1.65] text-white/70 lg:col-span-4 lg:col-start-9 lg:pt-8 lg:text-[16px]">
                One partner for the whole journey, so nothing gets lost between suppliers, inspectors and carriers.
              </p>
            </div>
            <ul ref={r('row')} className="mt-10 flex gap-10 pl-6 will-change-transform lg:mt-14 lg:gap-14">
              {services.map((sv, i) => (
                <li
                  key={sv.title}
                  ref={(el) => {
                    rowRefs.current[i] = el;
                  }}
                  className="w-[210px] shrink-0 border-l border-white/20 pl-4 lg:w-[250px]"
                  style={{ opacity: 0 }}
                >
                  <p className="font-display text-[22px] font-medium leading-none text-sky">{String(i + 1).padStart(2, '0')}</p>
                  <p className="mt-2 font-display text-[18px] leading-tight lg:text-[20px]">{sv.title}</p>
                  <p className="mt-1 text-[13px] leading-[1.5] text-white/60 lg:text-[14px]">{sv.short}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 6. down the road: services with detail, either side */}
        <div ref={r('copy1')} className="container-x pointer-events-none absolute inset-0 z-[2] text-ink" style={{ opacity: 0, visibility: 'hidden' }}>
          <ul className="grid h-full grid-cols-2 content-center gap-x-[38vw] gap-y-8 py-24 sm:gap-y-10 lg:gap-x-[30vw]">
            {services.map((sv, i) => (
              <li
                key={sv.title}
                ref={(el) => {
                  roadRefs.current[i] = el;
                }}
                className={`max-w-[300px] ${i % 2 ? 'justify-self-start' : 'justify-self-end text-right'}`}
                style={{ opacity: 0 }}
              >
                <p className="font-display text-[18px] font-medium leading-none text-accent sm:text-[20px]">{String(i + 1).padStart(2, '0')}</p>
                <p className="mt-2 font-display text-[16px] leading-tight sm:text-[20px]">{sv.title}</p>
                <p className="mt-1 hidden text-[13px] leading-[1.55] text-muted sm:block sm:text-[14px]">{sv.description}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* 7. at sea: Why AGS Trade */}
        <div ref={r('copy2')} className="container-x absolute inset-0 z-[2] flex flex-col justify-between py-24 text-white sm:py-20" style={{ opacity: 0, visibility: 'hidden' }}>
          <div className="text-center">
            <p className="eyebrow eyebrow-light justify-center">Why AGS Trade</p>
            <h3 className="mx-auto mt-4 max-w-3xl font-display text-[30px] font-medium leading-[1.02] [text-shadow:0_2px_24px_rgba(0,0,0,0.45)] sm:text-[52px]">Sourcing that works as hard as you do.</h3>
          </div>
          <ul className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-x-6 gap-y-6 sm:gap-x-[300px] lg:gap-x-[420px]">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <li
                  key={v.title}
                  ref={(el) => {
                    valueRefs.current[i] = el;
                  }}
                  className={`[text-shadow:0_1px_12px_rgba(0,0,0,0.5)] ${i % 2 ? 'text-left' : 'text-left sm:text-right'}`}
                  style={{ opacity: 0 }}
                >
                  <Icon size={20} strokeWidth={1.5} aria-hidden="true" className={`text-sky ${i % 2 ? '' : 'sm:ml-auto'}`} />
                  <p className="mt-2.5 font-display text-[16px] leading-tight sm:text-[19px]">{v.title}</p>
                  <p className="mt-1 text-[13px] leading-[1.55] text-white/80 sm:text-[14px]">{v.text}</p>
                </li>
              );
            })}
          </ul>
        </div>

        {/* fog between the road and the sea */}
        <div ref={r('fog')} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3] overflow-hidden" style={{ display: 'none' }}>
          <div ref={r('fogWash')} className="absolute inset-0 bg-[#eef1f4]" style={{ opacity: 0 }} />
          <img ref={r('fogA')} src={V('cloud-1.webp')} alt="" className="absolute inset-0 h-full w-full object-cover will-change-transform" style={{ WebkitMaskImage: FADE_MASK, maskImage: FADE_MASK }} />
          <img ref={r('fogB')} src={V('cloud-2.webp')} alt="" className="absolute inset-0 h-full w-full object-cover will-change-transform" style={{ WebkitMaskImage: FADE_MASK, maskImage: FADE_MASK }} />
        </div>

        {/* speed */}
        <div ref={r('speed')} aria-hidden="true" className="container-x pointer-events-none absolute inset-x-0 top-0 z-[2] pt-20 text-ink lg:pt-24" style={{ opacity: 0, visibility: 'hidden' }}>
          <span ref={r('kmh')} className="font-display text-[15px] font-medium tabular-nums">
            00
          </span>
          <span className="ml-1 text-[11px] tracking-[0.14em] opacity-60">KM/H</span>
        </div>
      </div>
      {/* 8. sky: a fixed layer, so the clouds and plane carry on over the next section */}
      <div ref={r('sky')} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[30] overflow-hidden" style={{ display: 'none' }}>
        <div ref={r('bank')} className="absolute inset-x-0 top-0 h-[400vh] will-change-transform" style={{ transform: 'translate3d(0,100vh,0)' }}>
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(240,244,250,0.6)_7%,#FFFFFF_15%,#FFFFFF_85%,rgba(240,244,250,0.6)_93%,rgba(255,255,255,0)_100%)]" />
        </div>
        <img ref={r('cloudA')} src={V('cloud-1.webp')} alt="" className="absolute inset-0 h-full w-full object-cover opacity-0 will-change-transform" style={{ WebkitMaskImage: FADE_MASK, maskImage: FADE_MASK }} />
        <img ref={r('cloudB')} src={V('cloud-2.webp')} alt="" className="absolute inset-0 h-full w-full object-cover will-change-transform" style={{ WebkitMaskImage: FADE_MASK, maskImage: FADE_MASK }} />
        <img
          ref={r('plane')}
          src={V('plane-xl.webp')}
          alt=""
          className="absolute left-0 top-1/2 max-w-none will-change-transform"
          style={{ transform: 'translate3d(-200vw,-50%,0)', filter: 'drop-shadow(40px 70px 40px rgba(10,20,40,0.35))' }}
        />
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
          <h2 className="mt-4 text-[32px] font-medium leading-none sm:text-[48px]">Every order, packed and on its way.</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <article key={s.title} className="border-l border-white/15 pl-5">
                <h3 className="font-display text-[22px]">{s.title}</h3>
                <p className="mt-2 text-[16px] text-white/65 lg:text-[17px]">{s.description}</p>
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
