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
 * The ship pull-back is drawn on the same canvas; sky and text are DOM layers on top.
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
// the truck stands on the same ground line as the stacker (its wheels end at row 548 of the 720-high frames)
const TRUCK = { x: 90.25, y: GROUND1 - 548 * TS, w: 1280 * TS, h: 714 * TS };
const GROUND2 = TRUCK.y + 548 * TS;
const TRUCK_C = { x: TRUCK.x + 639.5 * TS, y: TRUCK.y + 360 * TS };
const RISE = { x: TRUCK.x, y: TRUCK.y, w: 1280 * TS, h: 720 * TS };
const SHIP = 96; // ship pull-back video frames
// hull width (out to where the foam starts) in each pull-back frame, in 1280-wide frame pixels
const SHIP_HULL = [456,456,456,456,456,456,456,456,456,455,454,453,451,449,447,445,442,439,435,431,428,424,420,415,411,406,401,395,390,385,379,373,367,362,357,351,345,339,333,327,320,314,307,301,295,289,282,276,270,264,258,252,247,242,236,231,226,221,217,212,207,203,199,195,191,187,183,180,177,174,171,168,165,163,160,158,155,153,151,149,147,146,145,143,142,141,141,140,139,139,139,138,138,138,138,138];
const SHIP_K = 0.0144; // the ship shrinks by about this much (log scale) per frame of the pull-back
// the light grey container column the truck lines up with, as fractions of the ship frame's width
const SHIP_COL = { d: { cx: 1337 / 2560, w: 83 / 2560, fw: 1600, fh: 900 }, m: { cx: 417 / 720, w: 83 / 720, fw: 480, fh: 960 } };
// wheel centres in the 1280x720 truck frames (x, y), tyre radius 47: they are spun as the truck moves
const WHEELS = [
  [180, 501],
  [286, 500],
  [391, 501],
  [777, 502],
  [1090, 501],
] as const;
const DRIVE = 85; // drive-in video frames, ending on the first turn frame
const DRIVE_EXT = 900; // drive frames are widened this much to the left so the stacker is never cut by the frame edge

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
  driveIn: [0.004, 0.1],
  turn: [0.1, 0.23],
  lift: [0.23, 0.245], // the stacker raises the container high enough for the truck
  truckIn: [0.24, 0.275],
  lower: [0.275, 0.297],
  swap: [0.289, 0.299],
  release: [0.3, 0.325],
  shrink: [0.325, 0.38],
  services: [0.36, 0.47],
  rise: [0.47, 0.55],
  road: [0.55, 0.69],
  hand: [0.69, 0.75], // the truck reaches the bottom of the page, which slides up onto the ship
  ship: [0.75, 0.84], // camera pulls back from the deck to the whole ship (video frames)
  hold: [0.84, 0.89], // live footage: the sea keeps moving while the camera pulls back further
  sky: [0.89, 1],
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

const MIST_MASK = 'radial-gradient(ellipse 34% 60% at 50% 50%, transparent 35%, #000 100%)';
const FADE_MASK = 'linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)';

export default function StoryV3() {
  const [reduce] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  return reduce ? <StoryStatic /> : <StoryFilm />;
}

function StoryFilm() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const q = useRef<Record<string, HTMLElement | null>>({});
  const r = (k: string) => (el: HTMLElement | null) => {
    q.current[k] = el;
  };
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const roadRefs = useRef<(HTMLLIElement | null)[]>([]);
  const valueRefs = useRef<(HTMLLIElement | null)[]>([]);
  const liveRef = useRef<HTMLVideoElement>(null);

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
    const drive: (HTMLImageElement | null)[] = new Array(DRIVE).fill(null);
    const riseCut: (HTMLImageElement | null)[] = new Array(FRAMES).fill(null);
    const ship: (HTMLImageElement | null)[] = new Array(SHIP).fill(null);
    let loading = false;
    const startLoading = () => {
      if (loading) return;
      loading = true;
      const dir = mobile ? '-m' : '';
      for (const n of ['fk-head', 'fk-box', 'fk-low', 'truck-e', 'truck-top-cab', 'truck-top-box']) one[n] = img(V(`${n}.webp`));
      const order: number[] = [];
      for (let s = 4; s >= 1; s = s >> 1) for (let i = 0; i < FRAMES; i += s) if (!order.includes(i)) order.push(i);
      const dOrder: number[] = [];
      for (let s = 4; s >= 1; s = s >> 1) for (let i = 0; i < DRIVE; i += s) if (!dOrder.includes(i)) dOrder.push(i);
      dOrder.forEach((i, k) => setTimeout(() => (drive[i] = img(V(`stacker4${dir}/${String(i).padStart(3, '0')}.webp`))), k * 10));
      order.forEach((i, k) =>
        setTimeout(() => {
          const n = String(i).padStart(3, '0');
          turn[i] = img(V(`turn${dir}/${n}.webp`));
          riseCut[i] = img(V(`truck${dir}/${n}.webp`));
        }, 400 + k * 12),
      );
      const sOrder: number[] = [];
      for (let s = 4; s >= 1; s = s >> 1) for (let i = 0; i < SHIP; i += s) if (!sOrder.includes(i)) sOrder.push(i);
      sOrder.forEach((i, k) => setTimeout(() => (ship[i] = img(V(`ship${dir}/${String(i).padStart(3, '0')}.webp`))), 2400 + k * 14));
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

    // ---------- the live ship shot: plays on its own so the water keeps moving when you stop scrolling ----------
    let liveOn = false;
    const setLive = (on: boolean) => {
      const v = liveRef.current;
      if (!v || on === liveOn) return;
      liveOn = on;
      if (on) {
        if (!v.src) {
          v.muted = true;
          v.src = V(mobile ? 'ship-live-m.mp4' : 'ship-live.mp4');
        }
        v.play().catch(() => {});
      } else v.pause();
    };
    const oc = document.createElement('canvas');
    const og = oc.getContext('2d');
    /** The live shot scaled by zz around the centre, with open sea from the clip's own left side filling around it. */
    function drawLive(v: HTMLVideoElement, zz: number, top: number, alpha: number) {
      const VW = v.videoWidth;
      const VH = v.videoHeight;
      const sw = mobile ? (VW * 720) / 2560 : VW; // phones use the same centre slice as the frames
      const sx = (VW - sw) / 2;
      const k = Math.max(vw / sw, vh / VH) * zz;
      const dw = sw * k;
      const dh = VH * k;
      const dx = (vw - dw) / 2;
      const dy = top + (vh - dh) / 2;
      g!.globalAlpha = alpha;
      if (zz > 0.999 || !og) {
        g!.drawImage(v, sx, 0, sw, VH, dx, dy, dw, dh);
        g!.globalAlpha = 1;
        return;
      }
      // open sea all around in the clip's own deep blue; the shot fades into it
      const sea = g!.createRadialGradient(vw / 2, top + vh / 2, Math.min(dw, dh) * 0.3, vw / 2, top + vh / 2, Math.max(vw, vh) * 0.75);
      sea.addColorStop(0, '#26405f');
      sea.addColorStop(1, '#152a47');
      g!.fillStyle = sea;
      g!.fillRect(0, top, vw, vh - top);
      // the shot itself, edges feathered into the sea
      const W = Math.max(2, Math.round(dw * dpr));
      const H = Math.max(2, Math.round(dh * dpr));
      if (oc.width !== W || oc.height !== H) {
        oc.width = W;
        oc.height = H;
      }
      og.globalCompositeOperation = 'source-over';
      og.clearRect(0, 0, W, H);
      og.drawImage(v, sx, 0, sw, VH, 0, 0, W, H);
      og.globalCompositeOperation = 'destination-in';
      const f = 0.22;
      const gx = og.createLinearGradient(0, 0, W, 0);
      gx.addColorStop(0, 'rgba(0,0,0,0)');
      gx.addColorStop(f, '#000');
      gx.addColorStop(1 - f, '#000');
      gx.addColorStop(1, 'rgba(0,0,0,0)');
      og.fillStyle = gx;
      og.fillRect(0, 0, W, H);
      const gy = og.createLinearGradient(0, 0, 0, H);
      gy.addColorStop(0, 'rgba(0,0,0,0)');
      gy.addColorStop(f, '#000');
      gy.addColorStop(1 - f, '#000');
      gy.addColorStop(1, 'rgba(0,0,0,0)');
      og.fillStyle = gy;
      og.fillRect(0, 0, W, H);
      g!.drawImage(oc, dx, dy, dw, dh);
      g!.globalAlpha = 1;
    }

    function drawImg(im: HTMLImageElement | null | undefined, x: number, y: number, w: number, h: number, alpha = 1) {
      if (!ready(im) || alpha <= 0.002) return;
      g!.globalAlpha = alpha;
      g!.drawImage(im!, x, y, w, h);
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
      const K1 = mobile ? (vw * 1.3) / 1280 : Math.min((vw * 0.66) / 1280, (vh * 0.56) / 720);
      const K3 = mobile ? (vw * 0.92) / 1302 : K1 * 0.55;
      const shrink = easeIO(seg(p, T.shrink));
      // drive-in: the camera holds still with the clip's left edge on the screen edge (slightly closer on
      // wide screens), so the stacker comes in from off-screen and the stack stays put on the right;
      // it eases to the normal framing during the turn
      const settle = ease(seg(p, [lerp(T.turn[0], T.turn[1], 0.52), T.turn[1]])); // after the stack has left the turn clip
      const Kd = K1;
      const K0 = lerp(Kd, K1, settle);
      const K = lerp(K0, K3, shrink);
      // the stack's right edge (stage x 1205) sits near the right of the screen, above the chat button
      const stackX = Math.max(1205 - (vw / 2 - Math.min(80, vw * 0.04)) / Kd, (vw / 2) / Kd - DRIVE_EXT + 4);
      const startX = mobile ? 640 : lerp(stackX, 640, settle);
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

        // fade a clip's edges into the page so its slightly different white never shows as a box
        const feather = (x: number, y: number, w: number, h: number, sides: string) => {
          const fe = 80 * K;
          const run = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
            const gr = g!.createLinearGradient(x0, y0, x1, y1);
            gr.addColorStop(0, BG);
            gr.addColorStop(1, 'rgba(251,251,251,0)');
            g!.fillStyle = gr;
            g!.fillRect(rx, ry, rw, rh);
          };
          if (sides.includes('t')) run(0, y - 1, 0, y + fe, x - 2, y - 2, w + 4, fe + 2);
          if (sides.includes('l')) run(x - 1, 0, x + fe, 0, x - 2, y, fe + 2, h);
          if (sides.includes('r')) run(x + w + 1, 0, x + w - fe, 0, x + w - fe, y, fe + 2, h);
        };
        const clipTop = (fn: () => void) => {
          g!.save();
          g!.beginPath();
          g!.rect(0, 0, vw, top);
          g!.clip();
          fn();
          g!.restore();
        };

        if (p < T.turn[0]) {
          // 1. the stacker drives in from behind the heading (half off the page) to the stack and picks
          //    up the grey box. The stack stays put; for the first part the stacker half of each video
          //    frame is slid further left, so it covers the whole width of the page
          const dT = seg(p, T.driveIn);
          const SPLIT = 0.55;
          const slide = easeIO(clamp(dT / SPLIT));
          const fi = dT < SPLIT ? (12 * dT) / SPLIT : 12 + (DRIVE - 13) * ((dT - SPLIT) / (1 - SPLIT));
          const fr = frame(drive, Math.round(fi), 0, DRIVE - 1) ?? frame(turn, 0);
          if (fr) {
            const wide = fr.naturalWidth > fr.naturalHeight * 2;
            const D = R_(wide ? { x: -DRIVE_EXT, y: 0, w: 1280 + DRIVE_EXT, h: 720 } : FULL);
            const off = wide ? Math.max(0, 19 + OX / K) * (1 - slide) * K : 0; // px
            const cut = OX + 830 * K; // where the stacker half ends and the stack begins
            clipTop(() => {
              if (off < 0.5) {
                g!.drawImage(fr, ...D);
                return;
              }
              g!.save();
              g!.beginPath();
              g!.rect(cut, 0, vw - cut, vh);
              g!.clip();
              g!.drawImage(fr, ...D);
              g!.restore();
              g!.save();
              g!.beginPath();
              g!.rect(0, 0, cut - off, vh);
              g!.clip();
              g!.drawImage(fr, D[0] - off, D[1], D[2], D[3]);
              g!.restore();
            });
            clipTop(() => feather(D[0] - off, D[1], D[2] + off, D[3], 'tr'));
          }
        } else if (p < T.truckIn[0]) {
          // 2. lift and turn, frame by frame
          const ti = Math.round(seg(p, T.turn) * (FRAMES - 1));
          const fr = frame(turn, ti);
          if (fr)
            clipTop(() => {
              const [fx, fy, fw, fh] = R_(FULL);
              g!.drawImage(fr, fx, fy, fw, fh);
              // feather the clip's edges into the page (the right edge only once the stack has left it)
              feather(fx, fy, fw, fh, ti >= 58 ? 'lr' : 'l');
            });
        } else if (p < T.rise[0]) {
          // 3. the stacker raises the container, the truck drives in under it on the same ground line,
          //    the container is lowered onto the trailer, the spreader lets go and lifts; 4. the truck
          //    drives off and the stacker is left behind. Nothing fades: every part is moved.
          const lift = ease(seg(p, T.lift));
          const low = easeIO(seg(p, T.lower));
          const swap = ease(seg(p, T.swap));
          const rel = ease(seg(p, T.release));
          const leave = easeIO(seg(p, [T.release[1] - 0.004, T.release[1] + 0.03]));
          // container: held box (stage 159..1124 x 300..566) -> lands exactly on the truck's container
          const BX0 = 159, BY0 = 300, BX1 = 1124, BY1 = 566;
          const L0 = 156.6, LT = 279.6, L1 = 1126.4, LB = 553;
          const up = -70 * lift * (1 - low);
          const cx0 = lerp(BX0, L0, low);
          const cy0 = lerp(BY0, LT, low) + up;
          const sxk = lerp(1, (L1 - L0) / (BX1 - BX0), low);
          const syk = lerp(1, (LB - LT) / (BY1 - BY0), low);
          // the stacker slides out to the left as the camera follows the truck away
          const away = leave * (OX / K + 1150 + 60);
          const fx = -away;
          // head and spreader ride on top of the container, then lift off
          const headDy = cy0 - BY0 - 90 * rel;
          clipTop(() => {
            // behind: lower body and the chassis column (seen when the container is up or gone)
            drawImg(one['fk-low'], OX + (380 + fx) * K, OY + 566 * K, 520 * K, 146 * K);
            const colTop = OY + (299 + headDy) * K;
            const colBot = OY + 578 * K;
            if (colBot > colTop) {
              // the boom seen end-on: as wide as the head, shaded like it
              const gc = g!.createLinearGradient(OX + (548 + fx) * K, 0, OX + (732 + fx) * K, 0);
              gc.addColorStop(0, '#16191e');
              gc.addColorStop(0.18, '#2f343b');
              gc.addColorStop(0.5, '#454b54');
              gc.addColorStop(0.82, '#2f343b');
              gc.addColorStop(1, '#16191e');
              g!.fillStyle = gc;
              g!.fillRect(OX + (548 + fx) * K, colTop, 184 * K, colBot - colTop);
            }
            // the truck (empty, then the identical loaded frame once the box is down)
            const tx = (1 - easeOut(seg(p, T.truckIn))) * 1700;
            const [rx, ry, rw, rh] = R_({ ...RISE, x: RISE.x + tx });
            drawImg(one['truck-e'], rx, ry, rw, rh, 1);
            // the held container, scaled onto the truck's container as it comes down
            if (swap < 1) {
              const w = 1000 * sxk;
              const h = 276 * syk;
              drawImg(one['fk-box'], OX + (cx0 + (140 - BX0) * sxk) * K, OY + (cy0 + (296 - BY0) * syk) * K, w * K, h * K);
            }
            const f0 = frame(riseCut, 0);
            if (swap > 0 && f0) {
              g!.save();
              g!.globalAlpha = swap;
              g!.drawImage(f0, rx, ry, rw, rh);
              g!.restore();
            }
            // spin the wheels by the distance travelled (driving in: to the left; driving off: to the right)
            const top = swap >= 1 && f0 ? f0 : one['truck-e'];
            if (ready(top)) {
              const k = top!.naturalWidth / 1280;
              const sc = rw / 1280;
              const angle = (tx + Math.max(0, travelled) / K) / (47 * TS);
              for (const [wx, wy] of WHEELS) {
                const cx = rx + wx * sc;
                const cy = ry + wy * sc;
                const r = 45.5 * sc;
                g!.save();
                g!.beginPath();
                g!.arc(cx, cy, r, 0, Math.PI * 2);
                g!.clip();
                g!.translate(cx, cy);
                g!.rotate(angle);
                g!.drawImage(top!, (wx - 46) * k, (wy - 46) * k, 92 * k, 92 * k, -46 * sc, -46 * sc, 92 * sc, 92 * sc);
                g!.restore();
              }
            }
            drawImg(one['fk-head'], OX + (140 + fx) * K, OY + headDy * K, 1000 * K, 299 * K);
          });
        } else {
          // 5. the camera rises over the truck, which stays on the road (frames are cut out)
          const fr = frame(riseCut, riseI);
          if (fr) g!.drawImage(fr, ...R_(RISE));
        }
      }

      // ===================== 6. the road, top-down =====================
      // where the ship's light grey container column sits on screen (the ship frame is drawn to cover)
      const sc = mobile ? SHIP_COL.m : SHIP_COL.d;
      const sCover = Math.max(vw / sc.fw, vh / sc.fh);
      const sDW = sc.fw * sCover;
      const sDH = sc.fh * sCover;
      const colX = (vw - sDW) / 2 + sc.cx * sDW;
      const colW = sc.w * sDW;
      const hT = seg(p, T.hand);
      const hA = easeIO(clamp(hT / 0.45)); // truck lines up with the column and drives to the bottom of the page
      const hB = easeIO(clamp((hT - 0.4) / 0.6)); // the page slides up, the ship comes up under it
      const edge = lerp(vh, 0, hB);

      if (p >= T.road[0] && p < T.hand[1]) {
        const sEnd = S_END * 0.97;
        const s = sEnd * easeIO(seg(p, T.road));
        const [px, py0, hd0] = path(s);
        let py = py0;
        let hd = hd0;
        const hx = OX + TRUCK_C.x * K;
        const hy = OY + TRUCK_C.y * K;
        const zRoad = (vh * (mobile ? 0.3 : 0.34)) / TL;
        const zH = colW / BOX.h; // the truck's container as wide as a container on the ship
        const settle = easeIO(clamp(seg(p, T.road) / 0.22));
        let z = lerp(K, zRoad, settle);
        let sxA = lerp(hx, vw / 2, settle);
        const syA = lerp(hy, vh * (mobile ? 0.42 : 0.4), settle);
        const cx = px;
        const cy = py0;
        if (hT > 0) {
          // camera holds; the truck drives on down until its cab reaches the bottom of the page
          z = lerp(zRoad, zH, hA);
          sxA = lerp(vw / 2, colX, hA);
          const drive = (vh - syA) / zH - 640 * TS - 30;
          py += hA * drive;
          hd = Math.PI / 2;
        }

        g!.save();
        if (hT > 0) {
          g!.beginPath();
          g!.rect(0, 0, vw, edge);
          g!.clip();
        }
        g!.translate(sxA, syA - (vh - edge));
        g!.scale(z, z);
        g!.translate(-cx, -cy);
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

      // ===================== 7. the ship: the page slides up onto the deck, then the camera pulls back =====================
      const shipOn = (hT > 0.4 || p >= T.ship[0]) && rect.bottom > 0;
      set($('shipScene'), { display: shipOn ? '' : 'none', top: `${Math.max(0, edge).toFixed(1)}px` });
      const lv = liveRef.current;
      setLive(shipOn && p > T.ship[1] - 0.03);
      if (shipOn) {
        g!.fillStyle = '#0b2a45';
        g!.fillRect(0, edge, vw, vh - edge);
        const liveReady = !!lv && lv.readyState >= 2 && p > T.ship[1] - 0.006;
        const mix = liveReady ? clamp((p - (T.ship[1] - 0.006)) / 0.006) : 0;
        if (mix < 1) {
          // keep the water moving even when the page is still: show a frame a little further on,
          // drifting back and forth, scaled up by exactly as much as the camera pulled back meanwhile,
          // so the ship holds its size and only the sea and foam move
          const i0 = Math.round(seg(p, T.ship) * (SHIP - 1));
          const dd = 7 * (0.5 - 0.5 * Math.cos((performance.now() / 1000) * ((2 * Math.PI) / 2.6)));
          const want = Math.min(SHIP - 1, Math.round(i0 + dd));
          let got = -1;
          for (let d = 0; d < SHIP && got < 0; d++) {
            if (want - d >= i0 && ready(ship[want - d])) got = want - d;
            else if (want + d < SHIP && ready(ship[want + d])) got = want + d;
          }
          const fr = got >= 0 ? ship[got] : frame(ship, i0, 0, SHIP - 1);
          if (fr) {
            const k = got >= 0 ? Math.exp(SHIP_K * (got - i0)) : 1;
            const w = sDW * k;
            const h = sDH * k;
            g!.drawImage(fr, (vw - w) / 2, edge + (vh - h) / 2, w, h);
            // the ship itself stays put: redraw the hull from the current frame over the moving water
            const base = got !== i0 ? frame(ship, i0, 0, SHIP - 1) : null;
            if (base && base !== fr) {
              const srcW = mobile ? 720 : 2560;
              const hullW = ((SHIP_HULL[i0] * 2) / srcW) * sDW;
              g!.save();
              g!.beginPath();
              g!.rect(vw / 2 - hullW / 2, edge, hullW, vh - edge);
              g!.clip();
              g!.drawImage(base, (vw - sDW) / 2, edge + (vh - sDH) / 2, sDW, sDH);
              g!.restore();
            }
          }
        }
        // then the live shot takes over and keeps moving; scrolling pulls the camera back further
        if (liveReady) drawLive(lv!, lerp(1, mobile ? 0.55 : 0.42, easeIO(seg(p, T.hold))), edge, mix);
      }
      // mist over the edges of the wide shot
      const ho = seg(p, T.hold);
      set($('mist'), { display: shipOn && ho > 0 ? '' : 'none', opacity: (0.85 * ease(clamp(ho / 0.5))).toFixed(3) });
      if (shipOn && ho > 0) {
        const drift = (performance.now() / 1000) % 120;
        set($('mistA'), { transform: `translate3d(${(-8 - drift * 0.08).toFixed(2)}%,0,0) scale(1.4)` });
        set($('mistB'), { transform: `translate3d(${(6 + drift * 0.06).toFixed(2)}%,0,0) scale(1.5) scaleX(-1)` });
      }

      // ===================== 8. sky: clouds and a plane =====================
      // runs on past the end of the section: the cloud wall wipes the sea away, the next section
      // slides in underneath it, and the plane carries on across the top of that section
      const skyA = T.sky[0] * span;
      const skyB = span + vh * 0.9;
      const u = clamp((-rect.top - skyA) / (skyB - skyA));
      const skyOn = -rect.top > skyA - 10 && -rect.top < skyB;
      set($('sky'), { display: skyOn ? '' : 'none' });
      // solid over the sea and clouds; multiplied only once the next section is under it, so its text shows through
      set($('planeLayer'), { display: skyOn ? '' : 'none', mixBlendMode: rect.bottom - vh < vh * 0.95 ? 'multiply' : 'normal' });
      if (skyOn) {
        // the white wall only covers this section: the next section shows through under the plane
        // (the next section starts a full screen before this one ends, so its top is rect.bottom - vh)
        const nextTop = rect.bottom - vh;
        set($('bankClip'), { height: `${clamp(nextTop, 0, vh).toFixed(1)}px` });
        set($('bank'), { transform: `translate3d(0,${(vh - 5 * vh * u).toFixed(1)}px,0)` });
        const after = clamp((vh - nextTop) / vh);
        set($('cloudA'), { transform: `translate3d(0,${lerp(110, -260, u).toFixed(2)}%,0) scale(1.5)`, opacity: String(Math.min(1, u * 6) * (1 - 0.85 * after)) });
        set($('cloudB'), { transform: `translate3d(0,${lerp(160, -230, u).toFixed(2)}%,0) scale(1.9)`, opacity: String(1 - 0.85 * after) });
        // the whole aircraft crosses the page, lingering through the middle
        const t = clamp(u / 0.92);
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
      show('copy1', win(roadT, 0.42, 1.06, 0.12) * (1 - ease(seg(p, [T.hand[0], T.hand[0] + 0.02]))));
      roadRefs.current.forEach((li, i) => {
        if (!li) return;
        const t = ease(clamp((roadT - 0.46 - i * 0.06) / 0.08));
        li.style.opacity = String(t);
        li.style.transform = `translate3d(0,${((1 - t) * 20).toFixed(1)}px,0)`;
      });
      const shipT = seg(p, T.ship);
      const c2 = lerp(T.ship[0], T.ship[1], 0.55);
      show('copy2', win(p, c2, T.sky[0] + 0.03, 0.12));
      valueRefs.current.forEach((li, i) => {
        if (!li) return;
        const t = ease(clamp((p - c2 - 0.012 - i * 0.005) / 0.008));
        li.style.opacity = String(t);
        li.style.transform = `translate3d(${((1 - t) * (i % 2 ? 24 : -24)).toFixed(1)}px,0,0)`;
      });

      // speed while the truck is moving
      let kmh = 0;
      if (p > T.release[1] && p < T.hand[0] + 0.03) {
        kmh = 64 * easeOut(seg(p, [T.release[1], T.shrink[1]]));
        if (p > T.road[0]) kmh = 64 - 36 * Math.exp(-Math.pow((roadT - A / S_END) / 0.05, 2));
      }
      if ((liveOn || shipOn) && !raf) raf = requestAnimationFrame(update);
      const spd = $('kmh');
      if (spd) spd.textContent = String(Math.max(0, Math.round(kmh))).padStart(2, '0');
      show('speed', win(p, T.release[1], T.hand[0] + 0.03, 0.06));
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
      setLive(false);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', size);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={sectionRef} id="services" aria-label="Our services" className="relative h-[1550vh] scroll-mt-24 bg-[#fbfbfb] md:h-[1900vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <video ref={liveRef} muted loop playsInline preload="none" aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0" />

        {/* 7. the ship at sea */}
        <div ref={r('shipScene')} aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden" style={{ display: 'none', top: '100%' }}>
          {/* darken the whole scene a little, plus a vignette */}
          <div className="absolute inset-0 bg-[#020a14]/10" />
          {/* phones: the ship fills the width, so shade behind the heading and the points */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,10,20,0.7)_0%,rgba(2,10,20,0.15)_32%,rgba(2,10,20,0.15)_52%,rgba(2,10,20,0.75)_75%)] sm:hidden" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_50%,rgba(2,12,24,0.55))]" />
          {/* mist drifting over the edges of the wide shot, clear in the middle where the ship is */}
          <div ref={r('mist')} className="absolute inset-0" style={{ display: 'none', opacity: 0, WebkitMaskImage: MIST_MASK, maskImage: MIST_MASK }}>
            <img ref={r('mistA')} src={V('cloud-1.webp')} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 will-change-transform" />
            <img ref={r('mistB')} src={V('cloud-2.webp')} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 will-change-transform" />
          </div>
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
        <div ref={r('copy2')} className="container-x absolute inset-0 z-[2] text-white" style={{ opacity: 0, visibility: 'hidden' }}>
          {/* phones: heading on top, points below; wider screens: text either side of the ship, like a spread */}
          <div className="flex h-full flex-col justify-between py-24 sm:grid sm:grid-cols-[1fr_minmax(220px,24vw)_1fr] sm:content-center sm:gap-y-14 sm:py-20">
            <div className="text-center sm:col-start-1 sm:row-start-1 sm:text-right">
              <p className="eyebrow eyebrow-light justify-center sm:justify-end">Why AGS Trade</p>
              <h3 className="mt-4 font-display text-[30px] font-medium leading-[1.04] [text-shadow:0_2px_24px_rgba(0,0,0,0.5)] sm:ml-auto sm:max-w-[420px] sm:text-[40px] lg:text-[46px]">
                Sourcing that works as hard as you do.
              </h3>
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-6 sm:contents">
              {VALUES.map((v, i) => {
                const Icon = v.icon;
                const left = i % 2 === 0;
                return (
                  <li
                    key={v.title}
                    ref={(el) => {
                      valueRefs.current[i] = el;
                    }}
                    className={`[text-shadow:0_1px_12px_rgba(0,0,0,0.55)] ${
                      left ? 'text-left sm:col-start-1 sm:ml-auto sm:max-w-[340px] sm:text-right' : 'text-left sm:col-start-3 sm:max-w-[340px]'
                    } ${i < 2 ? 'sm:row-start-2' : 'sm:row-start-3'}`}
                    style={{ opacity: 0 }}
                  >
                    <Icon size={20} strokeWidth={1.5} aria-hidden="true" className={`text-sky ${left ? 'sm:ml-auto' : ''}`} />
                    <p className="mt-2.5 font-display text-[16px] leading-tight sm:text-[20px]">{v.title}</p>
                    <p className="mt-1 text-[13px] leading-[1.55] text-white/80 sm:text-[14px]">{v.text}</p>
                  </li>
                );
              })}
            </ul>
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
      {/* 8. sky: a fixed layer, so the clouds and plane carry on over the next section */}
      <div ref={r('sky')} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[30] overflow-hidden" style={{ display: 'none' }}>
        <div ref={r('bankClip')} className="absolute inset-x-0 top-0 h-full overflow-hidden">
          <div ref={r('bank')} className="absolute inset-x-0 top-0 h-[400vh] will-change-transform" style={{ transform: 'translate3d(0,100vh,0)' }}>
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(240,244,250,0.6)_7%,#FFFFFF_15%,#FFFFFF_85%,rgba(240,244,250,0.6)_93%,rgba(255,255,255,0)_100%)]" />
          </div>
        </div>
        <img ref={r('cloudA')} src={V('cloud-1.webp')} alt="" className="absolute inset-0 h-full w-full object-cover opacity-0 will-change-transform" style={{ WebkitMaskImage: FADE_MASK, maskImage: FADE_MASK }} />
        <img ref={r('cloudB')} src={V('cloud-2.webp')} alt="" className="absolute inset-0 h-full w-full object-cover will-change-transform" style={{ WebkitMaskImage: FADE_MASK, maskImage: FADE_MASK }} />
      </div>
      {/* the plane is its own layer, multiplied onto the page: the next section's text shows through it,
          so the text reads as lying on top of the plane */}
      <div ref={r('planeLayer')} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[31] overflow-hidden" style={{ display: 'none' }}>
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
