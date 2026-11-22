import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Handshake, Receipt, Truck } from 'lucide-react';
import { services } from '@/data/siteContent';

/**
 * Services scroll story, frame by frame (the way United Carriers builds theirs):
 *  1. A reach stacker lifts the grey container off the stack and turns to face us   (119 video frames)
 *  2. The empty truck slides in, the container is lowered onto it, the spreader lifts away
 *  3. The truck pulls out: the frame zooms out, a black panel rises with the services
 *  4. The camera rises over the truck to a top-down view                            (119 video frames)
 *  5. The truck drives a black road through a junction and down between the copy
 *  6. At the water's edge the container lifts off and drops into a slot on a ship
 *  7. Pull back to the whole ship at sea, with "Why AGS Trade"
 *  8. Clouds and a plane, into the next section
 *
 * Everything is drawn on one 2D canvas, except the sea and wake (videos behind it) and the text.
 * "Stage" units are the 1280 x 720 video frame; the road and ship live in the same units.
 */

const V = (n: string) => `/story/v3/${n}`;
const FRAMES = 119;

const VALUES = [
  { title: 'Verified suppliers', text: 'Every maker is checked before we place your order.', icon: BadgeCheck },
  { title: 'One point of contact', text: 'A named manager from enquiry to delivery.', icon: Handshake },
  { title: 'Clear, honest quotes', text: 'Product, packing and shipping in one price.', icon: Receipt },
  { title: 'Shipping handled', text: 'Booked with trusted shipping and courier partners.', icon: Truck },
];

// ---------- stage geometry (1280 x 720 frame units) ----------
const BG = '#fbfbfb'; // the video frames' own background
const GROUND1 = 679; // stacker wheels touch down here in the turn clip
const TS = 1.125; // truck images scaled so their container matches the held container
const TRUCK = { x: 90.25, y: 174.4, w: 1280 * TS, h: 714 * TS };
const GROUND2 = TRUCK.y + 544 * TS; // truck wheels
const LOWER = 90; // container travel down onto the trailer
const SPLIT_SPREAD = 300; // last frame: spreader above, container 300-567, wheels below
const SPLIT_BOX = 567;
const TRUCK_C = { x: TRUCK.x + 639.5 * TS, y: TRUCK.y + 360 * TS }; // truck centre (side and top view)
const RISE = { x: TRUCK.x, y: TRUCK.y, w: 1280 * TS, h: 720 * TS };

// ---------- world (top view, same units, truck centred at its position) ----------
const TL = 1155 * TS; // truck length
const WR = 700; // road width
const A = 2600; // east leg to the junction
const R = 900; // turn radius
const B = 6200; // south leg to the water
const ARC = (Math.PI / 2) * R;
const XS = A + R; // x of the south road
const Y_END = R + B; // land ends, sea begins
const S_STOP = A + ARC + B - TL / 2 - 120; // truck stops with its nose at the edge
const S_END = S_STOP;
const SS = 295 / 78; // ship scale: its slot fits the truck's container
const SHIP = { w: 760 * SS, h: 2643 * SS };
const SLOT = { x: 432 * SS, y: 505 * SS, w: 78 * SS, h: 256 * SS };
const Y_SLOT = Y_END + SLOT.y + 420;
const SHIP_X = XS - SLOT.x;
const SHIP_Y = Y_SLOT - SLOT.y;
const SHIP_MID = SHIP_Y + SHIP.h / 2;
const BOX = { x: (56 - 639.5) * TS, y: (234 - 360) * TS, w: 856 * TS, h: 262 * TS };
const BOX_C = { x: BOX.x + BOX.w / 2, y: BOX.y + BOX.h / 2 };

// ---------- timeline ----------
const T = {
  intro: [0, 0.05],
  turn: [0.02, 0.19],
  truckIn: [0.19, 0.235],
  lower: [0.235, 0.265],
  swap: [0.262, 0.272],
  release: [0.27, 0.3],
  shrink: [0.3, 0.36],
  services: [0.34, 0.47],
  rise: [0.47, 0.54],
  topSwap: [0.538, 0.548],
  toRoad: [0.548, 0.575],
  road: [0.575, 0.76],
  liftBox: [0.76, 0.78],
  carry: [0.78, 0.81],
  drop: [0.81, 0.83],
  pull: [0.83, 0.9],
  sky: [0.9, 1],
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

    // ---------- images: frame sequences load as the section comes near ----------
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
    const rise: (HTMLImageElement | null)[] = new Array(FRAMES).fill(null);
    let loading = false;
    const startLoading = () => {
      if (loading) return;
      loading = true;
      const dir = mobile ? '-m' : '';
      for (const n of ['f118', 'truck-empty', 'truck-loaded', 'truck-top', 'truck-top-cab', 'truck-top-box', 'ship-box', mobile ? 'ship-m' : 'ship']) {
        one[n.replace('-m', '')] = img(V(`${n}.webp`));
      }
      // every 4th frame first so scrubbing works early, then fill in
      const order: number[] = [];
      for (let s = 4; s >= 1; s = s >> 1) for (let i = 0; i < FRAMES; i += s) if (!order.includes(i)) order.push(i);
      order.forEach((i, k) =>
        setTimeout(() => {
          turn[i] = img(V(`turn${dir}/${String(i).padStart(3, '0')}.webp`));
          rise[i] = img(V(`rise${dir}/${String(i).padStart(3, '0')}.webp`));
        }, k * 12),
      );
    };
    const frame = (arr: (HTMLImageElement | null)[], i: number) => {
      for (let d = 0; d < FRAMES; d++) {
        const a = arr[i - d];
        if (ready(a)) return a;
        const b = arr[i + d];
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

    // ---------- videos play only while the sea is on screen ----------
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
    /** Draw rows [sy0, sy1) of an image laid over a stage rect. */
    function drawRows(im: HTMLImageElement | null | undefined, rect: { x: number; y: number; w: number; h: number }, sy0: number, sy1: number, dy: number, alpha = 1) {
      if (!ready(im) || alpha <= 0.002) return;
      const sy = im!.naturalHeight / 720;
      const ky = rect.h / 720;
      g!.globalAlpha = alpha;
      g!.drawImage(im!, 0, sy0 * sy, im!.naturalWidth, (sy1 - sy0) * sy, rect.x, rect.y + sy0 * ky + dy, rect.w, (sy1 - sy0) * ky);
      g!.globalAlpha = 1;
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
      const K3 = mobile ? (vw * 0.92) / (1302 * 1) : K1 * 0.55;
      const shrink = easeIO(seg(p, T.shrink));
      const K = lerp(K1, K3, shrink);
      const sx0 = lerp(640, TRUCK_C.x, shrink);
      const sy0 = lerp(GROUND1, TRUCK_C.y, shrink);
      const ax = vw / 2;
      const ay = lerp(vh * (mobile ? 0.66 : 0.8), vh * (mobile ? 0.2 : 0.25), shrink);
      const OX = ax - sx0 * K;
      const OY = ay - sy0 * K;
      const toS = (x: number, y: number) => [OX + x * K, OY + y * K] as const;
      const R_ = (b: { x: number; y: number; w: number; h: number }, dy = 0) => [OX + b.x * K, OY + (b.y + dy) * K, b.w * K, b.h * K] as const;

      const truckIn = easeOut(seg(p, T.truckIn));
      const groundStage = lerp(GROUND1, GROUND2, truckIn);
      const riseT = seg(p, T.rise);
      const toRoad = easeIO(seg(p, T.toRoad));

      // ===================== stage scenes (1-4) =====================
      if (p < T.toRoad[1]) {
        g!.fillStyle = BG;
        g!.fillRect(0, 0, vw, vh);

        // "OUR SERVICES" drifting behind the truck while it drives
        const mq = win(p, T.shrink[0] + 0.02, T.rise[0] + 0.02, 0.15);
        if (mq > 0.01) {
          const [, ty] = toS(0, TRUCK_C.y);
          const fs = Math.min(vh * 0.26, vw * 0.2);
          g!.font = `700 ${fs}px Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif`;
          g!.textBaseline = 'middle';
          g!.fillStyle = `rgba(20,24,32,${(0.07 * mq).toFixed(3)})`;
          const shift = seg(p, [T.shrink[0], T.rise[0] + 0.02]) * vw * 1.6;
          g!.fillText('OUR SERVICES  OUR SERVICES', vw * 0.55 - shift, ty);
        }

        // black ground strip, then the services panel, then the road band
        const [, gTop] = toS(0, groundStage + 2);
        let top = gTop;
        let bottom = vh;
        if (p > T.rise[0]) top = lerp(gTop, OY + (RISE.y + RISE.h) * K + 4, ease(clamp(riseT / 0.25)));
        if (p > T.toRoad[0]) {
          const [, bt] = toS(0, TRUCK_C.y - WR / 2);
          const [, bb] = toS(0, TRUCK_C.y + WR / 2);
          const from = OY + (RISE.y + RISE.h) * K + 4;
          top = lerp(from, bt, toRoad);
          bottom = lerp(vh, bb, toRoad);
        }
        g!.fillStyle = '#0d0f13';
        g!.fillRect(0, top, vw, Math.max(0, bottom - top));
        if (p > T.toRoad[0]) {
          // centre dashes appear on the new road band
          g!.fillStyle = `rgba(255,255,255,${(0.55 * toRoad).toFixed(3)})`;
          const mid = (top + bottom) / 2;
          const dl = 90 * K;
          for (let x = -((p * 4000) % (dl * 2.2)); x < vw; x += dl * 2.2) g!.fillRect(x, mid - 2.5 * K * 2, dl, 5 * K * 2);
        }
        set($('panel'), { top: `${top.toFixed(1)}px` });

        const f118 = one.f118;
        const last = { x: 0, y: 0, w: 1280, h: 720 };
        if (p < T.truckIn[0]) {
          // 1. the turn, frame by frame
          const i = Math.round(seg(p, T.turn) * (FRAMES - 1));
          const fr = frame(turn, i);
          if (fr) {
            g!.save();
            g!.beginPath();
            g!.rect(0, 0, vw, top);
            g!.clip();
            g!.drawImage(fr, ...R_(last));
            g!.restore();
          }
        } else if (p < T.rise[0]) {
          // 2. truck in, container lowered, spreader released; 3. pull out
          const lower = ease(seg(p, T.lower)) * LOWER;
          const swap = ease(seg(p, T.swap));
          const release = ease(seg(p, T.release));
          const L = R_(last);
          const L2 = { x: L[0], y: L[1], w: L[2], h: L[3] };
          drawRows(f118, L2, SPLIT_BOX, GROUND1 + 2, 0, 1 - swap);
          const tx = (1 - truckIn) * 1700;
          const [ex, ey, ew, eh] = R_({ ...TRUCK, x: TRUCK.x + tx });
          drawImg(one['truck-empty'], ex, ey, ew, eh, 1 - swap);
          drawImg(one['truck-loaded'], ex, ey, ew, eh, swap);
          drawRows(f118, L2, SPLIT_SPREAD, SPLIT_BOX, lower * K, 1 - swap);
          drawRows(f118, L2, 0, SPLIT_SPREAD, (lower - release * 420) * K, 1 - release);
        } else {
          // 4. the camera rises over the truck, frame by frame
          const i = Math.round(clamp(riseT / 0.96) * (FRAMES - 1));
          const fr = frame(rise, i);
          const top_ = ease(seg(p, T.topSwap));
          if (fr && top_ < 1) {
            g!.save();
            g!.beginPath();
            g!.rect(0, 0, vw, top - 1);
            g!.clip();
            g!.drawImage(fr, ...R_(RISE));
            g!.restore();
          }
          const [tx, ty, tw, th] = R_(TRUCK);
          drawImg(one['truck-top'], tx, ty, tw, th, top_);
        }
      }

      // ===================== world scenes (5-7) =====================
      const worldOn = p >= T.toRoad[1];
      if (worldOn) {
        const s = S_END * easeIO(seg(p, T.road));
        const [px, py, hd] = path(s);
        const [hx, hy] = [OX + TRUCK_C.x * K, OY + TRUCK_C.y * K]; // where the stage left the truck
        const zRoad = (vh * (mobile ? 0.3 : 0.34)) / TL;
        const settle = easeIO(clamp(seg(p, T.road) / 0.25));
        let z = lerp(K, zRoad, settle);
        let sxA = lerp(hx, vw / 2, settle);
        let syA = lerp(hy, vh * (mobile ? 0.42 : 0.4), settle);
        let cx = px;
        let cy = py;

        const lift = easeOut(seg(p, T.liftBox));
        const carry = easeIO(seg(p, T.carry));
        const drop = easeIO(seg(p, T.drop));
        const pull = easeIO(seg(p, T.pull));
        const boxStartY = py + BOX_C.x; // heading south: the box trails behind (above) the cab
        if (p > T.carry[0]) {
          cy = lerp(py, Y_SLOT, carry);
          syA = lerp(vh * (mobile ? 0.42 : 0.4), vh * 0.5, carry);
          z = zRoad * (1 - Math.sin(carry * Math.PI) * 0.35);
        }
        const zFit = (vh * (mobile ? 0.5 : 0.62)) / SHIP.h;
        if (p > T.pull[0]) {
          cy = lerp(Y_SLOT, SHIP_MID, pull);
          z = lerp(zRoad, zFit, pull);
          syA = lerp(vh * 0.5, vh * (mobile ? 0.5 : 0.56), pull);
        }
        sxA = p > T.carry[0] ? vw / 2 : sxA;

        g!.save();
        g!.translate(sxA, syA);
        g!.scale(z, z);
        g!.translate(-cx, -cy);

        // land (white) down to the water's edge; the sea video shows below it
        const fade = 1 - ease(seg(p, [T.carry[0] + 0.01, T.drop[0]]));
        g!.globalAlpha = fade;
        g!.fillStyle = BG;
        g!.fillRect(-20000, -20000, 60000, Y_END + 20000);
        // road: east leg (and on past the junction), the bend, the south leg
        g!.strokeStyle = '#0d0f13';
        g!.lineWidth = WR;
        g!.lineCap = 'butt';
        g!.beginPath();
        g!.moveTo(-12000, 0);
        g!.lineTo(A + R + 4000, 0);
        g!.stroke();
        g!.beginPath();
        g!.moveTo(A - 2, 0);
        g!.arc(A, R, R, -Math.PI / 2, 0);
        g!.lineTo(XS, Y_END);
        g!.stroke();
        g!.fillStyle = '#0d0f13';
        g!.fillRect(XS - WR / 2, -WR / 2, WR, Y_END + WR / 2);
        // lane dashes
        g!.strokeStyle = 'rgba(255,255,255,0.55)';
        g!.lineWidth = 14;
        g!.setLineDash([120, 140]);
        g!.beginPath();
        g!.moveTo(-12000, 0);
        g!.lineTo(A - WR / 2 - 60, 0);
        g!.moveTo(XS, WR / 2 + 60);
        g!.lineTo(XS, Y_END - 40);
        g!.moveTo(XS + WR / 2 + 60, 0);
        g!.lineTo(A + R + 4000, 0);
        g!.stroke();
        g!.setLineDash([]);
        // crossings at the junction
        g!.fillStyle = 'rgba(255,255,255,0.6)';
        for (let i = -WR / 2 + 30; i < WR / 2 - 20; i += 70) {
          g!.fillRect(XS - WR / 2 - 160, i, 110, 34);
          g!.fillRect(XS + i, WR / 2 + 50, 34, 110);
        }
        g!.globalAlpha = 1;

        // the ship, bow south, waiting at sea
        if (ready(one.ship)) g!.drawImage(one.ship, SHIP_X, SHIP_Y, SHIP.w, SHIP.h);

        // the truck
        const truckA = 1 - ease(seg(p, [T.carry[0] + 0.004, T.carry[0] + 0.02]));
        if (truckA > 0.002) {
          g!.save();
          g!.globalAlpha = truckA;
          g!.translate(px, py);
          g!.rotate(hd);
          g!.fillStyle = '#2a2d33';
          g!.fillRect(BOX.x + 30, -60, BOX.w - 60, 34);
          g!.fillRect(BOX.x + 30, 26, BOX.w - 60, 34);
          if (ready(one['truck-top-cab'])) g!.drawImage(one['truck-top-cab'], -639.5 * TS, -360 * TS, 1280 * TS, 714 * TS);
          g!.restore();
        }

        // the container: on the truck, lifted, carried over the ship and set into its slot
        g!.save();
        if (p < T.liftBox[0]) {
          g!.translate(px, py);
          g!.rotate(hd);
          g!.translate(BOX_C.x, BOX_C.y);
        } else {
          const scale = 1 + lift * 0.14 * (1 - drop);
          g!.translate(XS, lerp(boxStartY, Y_SLOT, carry));
          g!.rotate(Math.PI / 2);
          g!.scale(scale, scale);
          const air = lift * (1 - drop);
          g!.shadowColor = `rgba(0,0,0,${(0.25 + air * 0.25).toFixed(2)})`;
          g!.shadowBlur = (10 + air * 50) * z * dpr;
          g!.shadowOffsetX = air * 60 * z * dpr;
          g!.shadowOffsetY = air * 70 * z * dpr;
        }
        const shipBox = ease(seg(p, [T.drop[0] + 0.006, T.drop[1]]));
        if (ready(one['truck-top-box']) && shipBox < 1) {
          g!.globalAlpha = 1 - shipBox;
          g!.drawImage(one['truck-top-box'], -BOX.w / 2, -BOX.h / 2, BOX.w, BOX.h);
        }
        g!.shadowColor = 'transparent';
        if (ready(one['ship-box']) && shipBox > 0) {
          // the ship's own container image, so it matches its neighbours exactly
          g!.globalAlpha = shipBox;
          g!.rotate(-Math.PI / 2);
          g!.drawImage(one['ship-box'], -SLOT.w / 2, -SLOT.h / 2, SLOT.w, SLOT.h);
        }
        g!.restore();
        g!.restore();

        // the wake trails behind the stern, under the canvas, over the sea
        const m = `translate3d(${sxA.toFixed(1)}px,${syA.toFixed(1)}px,0) scale(${z.toFixed(5)}) translate3d(${(-cx).toFixed(1)}px,${(-cy).toFixed(1)}px,0)`;
        set($('wakeIn'), { transform: m });
        setSea(p > T.road[0] + (T.road[1] - T.road[0]) * 0.75 && p < T.sky[1]);
      } else {
        setSea(false);
      }
      if (seaRef.current) seaRef.current.style.visibility = worldOn && p > T.road[0] + 0.1 ? 'visible' : 'hidden';

      // ===================== sky =====================
      const u = seg(p, T.sky);
      set($('sky'), { display: p > T.sky[0] - 0.005 ? '' : 'none' });
      if (p > T.sky[0] - 0.005) {
        set($('cloudA'), { transform: `translate3d(0,${lerp(110, -130, u).toFixed(2)}%,0) scale(1.4)`, opacity: String(Math.min(1, u * 4)) });
        set($('cloudB'), { transform: `translate3d(0,${lerp(140, -170, u).toFixed(2)}%,0) scale(1.8)` });
        set($('plane'), { transform: `translate3d(${lerp(-100, 110, easeIO(clamp(u * 1.05))).toFixed(2)}vw,-50%,0)` });
        set($('bank'), { transform: `translate3d(0,${(((1.15 - u) / 1.5) * 100).toFixed(2)}%,0)` });
      }

      // ===================== copy =====================
      const c0 = clamp((T.intro[1] - p) / 0.03);
      show('copy0', c0, { transform: `translate3d(0,${((1 - c0) * -20).toFixed(1)}px,0)` });
      const cPanel = win(p, T.shrink[0] + 0.015, T.rise[0] + 0.015, 0.12);
      show('panelCopy', cPanel);
      const row = $('row');
      if (row) row.style.transform = `translate3d(${lerp(vw * 0.25, -Math.max(0, row.scrollWidth - vw * 0.7), seg(p, T.services)).toFixed(1)}px,0,0)`;
      rowRefs.current.forEach((li, i) => {
        if (!li) return;
        const t = ease(clamp((p - T.services[0] - i * 0.008) / 0.03));
        li.style.opacity = String(t);
      });
      const roadT = seg(p, T.road);
      const cRoad = win(roadT, 0.42, 0.97, 0.12);
      show('copy1', cRoad);
      roadRefs.current.forEach((li, i) => {
        if (!li) return;
        const t = ease(clamp((roadT - 0.46 - i * 0.06) / 0.08));
        li.style.opacity = String(t);
        li.style.transform = `translate3d(0,${((1 - t) * 20).toFixed(1)}px,0)`;
      });
      const c2 = win(p, T.pull[0] + 0.045, T.sky[0] + 0.035, 0.2);
      show('copy2', c2);
      valueRefs.current.forEach((li, i) => {
        if (!li) return;
        const t = ease(clamp((p - T.pull[0] - 0.055 - i * 0.008) / 0.025));
        li.style.opacity = String(t);
        li.style.transform = `translate3d(${((1 - t) * (i % 2 ? 24 : -24)).toFixed(1)}px,0,0)`;
      });

      // speed while the truck is moving
      let kmh = 0;
      if (p > T.release[1] && p < T.liftBox[0]) {
        kmh = 64 * easeOut(seg(p, [T.release[1], T.shrink[1]]));
        if (p > T.road[0]) {
          const rt = seg(p, T.road);
          const jn = A / S_END;
          kmh = 64 - 36 * Math.exp(-Math.pow((rt - jn) / 0.05, 2)) - 64 * Math.pow(clamp((rt - 0.86) / 0.14), 2);
        }
      }
      const sp = $('kmh');
      if (sp) sp.textContent = String(Math.max(0, Math.round(kmh))).padStart(2, '0');
      const darkSpeed = p > T.toRoad[0] && p < T.road[0] + 0.02;
      show('speed', win(p, T.release[1], T.liftBox[0] + 0.005, 0.06), { color: darkSpeed ? '#fff' : '' });
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
    <section ref={sectionRef} id="services" aria-label="Our services" className="relative h-[1100vh] scroll-mt-24 bg-[#fbfbfb] md:h-[1300vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* sea and wake sit under the canvas; the canvas leaves the water transparent */}
        <video ref={seaRef} muted loop playsInline preload="none" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" style={{ visibility: 'hidden' }} />
        <div aria-hidden="true" className="absolute inset-0 mix-blend-screen" style={{ opacity: 0.85 }}>
          <div ref={r('wakeIn')} className="absolute left-0 top-0 origin-top-left will-change-transform">
            <video
              ref={wakeRef}
              muted
              loop
              playsInline
              preload="none"
              className="absolute max-w-none"
              style={{ left: SHIP_X + SHIP.w / 2 - SHIP.w * 1.4, top: SHIP_Y - SHIP.w * 1.575 + 260, width: SHIP.w * 2.8, height: SHIP.w * 1.575 }}
            />
          </div>
        </div>
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />

        {/* 1. intro */}
        <div ref={r('copy0')} className="container-x absolute inset-x-0 top-0 z-[2] pt-28 text-ink sm:pt-32">
          <p className="eyebrow">Our services</p>
          <h2 className="mt-5 max-w-3xl text-[36px] font-medium leading-[1.02] sm:text-[56px] lg:text-[64px]">Every order, packed and on its way.</h2>
          <p className="mt-5 max-w-md text-[16px] leading-[1.65] text-muted sm:text-[17px]">From the supplier&apos;s door to yours, we handle each step and keep you posted along the way.</p>
        </div>

        {/* 3. the black panel under the truck: heading and the services row */}
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
            <ul ref={r('row') as (el: HTMLUListElement | null) => void} className="mt-10 flex gap-10 pl-6 will-change-transform lg:mt-14 lg:gap-14">
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

        {/* 5. down the road: services with detail, either side */}
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

        {/* 7. at sea */}
        <div ref={r('copy2')} className="container-x absolute inset-0 z-[2] flex flex-col justify-between py-24 text-white sm:py-20" style={{ opacity: 0, visibility: 'hidden' }}>
          <div className="text-center">
            <p className="eyebrow eyebrow-light justify-center">Why AGS Trade</p>
            <h3 className="mx-auto mt-4 max-w-3xl font-display text-[30px] font-medium leading-[1.02] [text-shadow:0_2px_24px_rgba(0,0,0,0.35)] sm:text-[52px]">Sourcing that works as hard as you do.</h3>
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
                  <p className="mt-1 text-[13px] leading-[1.55] text-white/70 sm:text-[14px]">{v.text}</p>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 8. sky */}
        <div ref={r('sky')} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3] overflow-hidden" style={{ display: 'none' }}>
          <img ref={r('cloudA') as (el: HTMLImageElement | null) => void} src={V('cloud-1.webp')} alt="" className="absolute inset-0 h-full w-full object-cover opacity-0 will-change-transform" style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)', maskImage: 'linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)' }} />
          <img ref={r('plane') as (el: HTMLImageElement | null) => void} src={V('plane.webp')} alt="" className="absolute left-0 top-1/2 w-[min(110vw,1100px)] max-w-none drop-shadow-[30px_50px_30px_rgba(0,0,0,0.3)] will-change-transform" />
          <img ref={r('cloudB') as (el: HTMLImageElement | null) => void} src={V('cloud-2.webp')} alt="" className="absolute inset-0 h-full w-full object-cover will-change-transform" style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)', maskImage: 'linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)' }} />
          <div ref={r('bank')} className="absolute inset-x-0 bottom-0 h-[150%] will-change-transform" style={{ transform: 'translate3d(0,100%,0)' }}>
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(244,246,251,0.35)_8%,rgba(255,255,255,0.9)_18%,#FFFFFF_23%)]" />
          </div>
        </div>

        {/* speed */}
        <div ref={r('speed')} aria-hidden="true" className="container-x pointer-events-none absolute inset-x-0 top-0 z-[2] pt-20 text-ink lg:pt-24" style={{ opacity: 0, visibility: 'hidden' }}>
          <span ref={r('kmh')} className="font-display text-[15px] font-medium tabular-nums">
            00
          </span>
          <span className="ml-1 text-[11px] tracking-[0.14em] opacity-60">KM/H</span>
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
