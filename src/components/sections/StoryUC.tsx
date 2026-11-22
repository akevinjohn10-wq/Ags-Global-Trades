import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { BadgeCheck, Handshake, Receipt, Truck } from 'lucide-react';
import { services } from '@/data/siteContent';

/**
 * The services scroll story, told in one continuous camera move:
 * a reach stacker lifts a container, turns, sets it on a truck; the camera rises over the truck,
 * follows it along a night road through a junction to the quay, the container drops into a slot
 * on a ship at sea, the camera pulls back to the whole ship, and the clouds close over the page.
 *
 * Side-view sprites share one 2752 x 1536 frame (the size they were rendered at), so they stay
 * aligned when they swap. The top-view leg lives in "world" units where the truck is 400 long.
 */

const U = (n: string) => `/story/uc/${n}`;

const VALUES = [
  { title: 'Verified suppliers', text: 'Every maker is checked before we place your order.', icon: BadgeCheck },
  { title: 'One point of contact', text: 'A named manager from enquiry to delivery.', icon: Handshake },
  { title: 'Clear, honest quotes', text: 'Product, packing and shipping in one price.', icon: Receipt },
  { title: 'Shipping handled', text: 'Booked with trusted shipping and courier partners.', icon: Truck },
];
const LABELS = ['Loaded', 'On the road', 'At sea', 'Delivered'];

// ---------- side rig, in source-image pixels ----------
const FW = 2752;
const FH = 1536;
const GROUND = 1443;
const SIDE = { x: 280, y: 90, w: 2360, h: 1370 };
const TURN = { x: 100, y: 30 - 58, w: 2560, h: 1490 }; // rear frames, lifted so their wheels share the side frames' ground
const TRUCK_S = 1.277; // truck shot scaled so its trailer matches the held container
const TRUCK = { x: 110.6, y: -96, w: FW * TRUCK_S, h: FH * TRUCK_S };
const BOX_DROP = 247; // container resting on the ground vs. held
const SPREAD_DOWN = 190; // spreader travel down onto the container
const LOWER = 63; // held container down onto the trailer
const POST = { x: 2250, y: 480, w: 100 }; // telescoping post shown above the lowered spreader

// ---------- world (top view), truck is 400 long ----------
const TL = 400;
const F = TL / 2630;
const CAB = { w: 740 * F, h: 1002 * F, x: -370 * F, y: -TL / 2 };
const TBOX = { w: 595 * F, h: 1640 * F, x: (470 - 768) * F, y: -TL / 2 + 990 * F };
const WR = 300; // road width
const A = 1800; // first leg, heading east
const R = WR / 2; // junction turn radius
const B = 4200; // straight north to the quay
const ARC = (Math.PI / 2) * R;
const S_END = A + ARC + B;
const XN = A + R; // x of the north road
const Y_STOP = -R - B;
const Y_QUAY = Y_STOP - TL / 2 - 40;
const SHIP_S = TBOX.w / 77; // ship drawn so its empty slot fits the container width
const SLOT = { x: 838, y: 2548.5, h: 324 }; // slot centre in ship.webp pixels
const Y_SLOT = Y_QUAY - 2740 - 420;
const SHIP = { w: 1700 * SHIP_S, h: 5220 * SHIP_S, x: XN - SLOT.x * SHIP_S, y: Y_SLOT - SLOT.y * SHIP_S };
const SHIP_MID = SHIP.y + ((540 + 5080) / 2 - 200) * SHIP_S;
const HULL = (5080 - 540) * SHIP_S;

// ---------- timeline (fraction of the section's scroll) ----------
const T = {
  driveIn: [0.012, 0.055],
  spreadDown: [0.05, 0.085],
  lift: [0.085, 0.12],
  hold: [0.12, 0.13],
  turn1: [0.14, 0.155],
  turn2: [0.17, 0.185],
  turn3: [0.2, 0.215],
  truckIn: [0.19, 0.245],
  lower: [0.25, 0.27],
  release: [0.27, 0.29],
  driveOff: [0.29, 0.37],
  angle: [0.35, 0.37],
  top: [0.37, 0.39],
  settle: [0.38, 0.43],
  road: [0.41, 0.66],
  liftBox: [0.66, 0.69],
  carry: [0.69, 0.75],
  drop: [0.75, 0.78],
  pull: [0.78, 0.86],
  sky: [0.87, 1],
} as const;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, r: readonly [number, number]) => clamp((p - r[0]) / (r[1] - r[0]));
const ease = (t: number) => t * t * (3 - 2 * t);
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const win = (p: number, a: number, b: number, edge = 0.25) => {
  const t = clamp((p - a) / (b - a));
  return ease(Math.min(clamp(t / edge), clamp((1 - t) / edge)));
};

/** Position and heading (degrees clockwise from north) along the road. */
function path(s: number): [number, number, number] {
  if (s <= A) return [s, 0, 90];
  if (s <= A + ARC) {
    const a = (s - A) / R;
    return [A + R * Math.sin(a), -R + R * Math.cos(a), 90 - (a * 180) / Math.PI];
  }
  return [XN, -R - (s - A - ARC), 0];
}

/** Box in the 2752 x 1536 frame, as percentages of the rig. */
const at = (b: { x: number; y: number; w: number; h: number }): CSSProperties => ({
  position: 'absolute',
  left: `${(b.x / FW) * 100}%`,
  top: `${(b.y / FH) * 100}%`,
  width: `${(b.w / FW) * 100}%`,
  height: `${(b.h / FH) * 100}%`,
});
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

// ---------- ocean: a small WebGL shader, navy water that keeps moving ----------
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 r; uniform float t; uniform vec2 o; uniform float z;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
void main(){
 vec2 q=gl_FragCoord.xy; q.y=r.y-q.y;
 vec2 w=(q-r*.5)/z+o;
 vec2 p=w*.0035; p.y-=t*.09;
 float a=fbm(p+vec2(t*.01,0.));
 float b=fbm(p*2.2+a*1.3+vec2(0.,-t*.05));
 float c=fbm(vec2(p.x*8.,p.y*15.)+b*2.2+vec2(t*.05,-t*.35));
 float d=fbm(vec2(p.x*22.,p.y*40.)+c*1.5+vec2(-t*.08,-t*.6));
 vec3 deep=vec3(.010,.105,.205), lite=vec3(.045,.19,.31);
 vec3 col=mix(deep,lite,smoothstep(.25,.85,b));
 col+=pow(c,5.)*.32*vec3(.75,.88,1.);
 col+=pow(d,6.)*.28*vec3(.8,.9,1.);
 col*=.9+.2*c;
 col*=.92+.08*smoothstep(.3,.8,a);
 gl_FragColor=vec4(col,1.);
}`;

function startOcean(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true });
  if (!gl || gl.isContextLost()) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, 'r');
  const uT = gl.getUniformLocation(prog, 't');
  const uO = gl.getUniformLocation(prog, 'o');
  const uZ = gl.getUniformLocation(prog, 'z');
  return (time: number, ox: number, oy: number, zoom: number, scale: number) => {
    const w = canvas.width;
    const hh = canvas.height;
    gl.viewport(0, 0, w, hh);
    gl.uniform2f(uR, w, hh);
    gl.uniform1f(uT, time);
    gl.uniform2f(uO, ox, oy);
    gl.uniform1f(uZ, zoom * scale);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}

export default function StoryUC() {
  const [reduce] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (reduce) return <StoryStatic />;
  return <StoryFilm />;
}

function StoryFilm() {
  const sectionRef = useRef<HTMLElement>(null);
  const q = useRef<Record<string, HTMLElement | null>>({});
  const r = (k: string) => (el: HTMLElement | null) => {
    q.current[k] = el;
  };
  const oceanRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<HTMLVideoElement>(null);
  const serviceRefs = useRef<(HTMLLIElement | null)[]>([]);
  const valueRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = oceanRef.current;
    const worldCanvas = worldRef.current;
    if (!section || !canvas || !worldCanvas) return;
    const $ = (k: string) => q.current[k] ?? null;
    const set = (el: HTMLElement | null, css: Partial<CSSStyleDeclaration>) => {
      if (el) Object.assign(el.style, css);
    };
    const op = (k: string, v: number) => set($(k), { opacity: v.toFixed(3), visibility: v < 0.002 ? 'hidden' : 'visible' });

    let vw = 1440;
    let vh = 900;
    let k = 0.4; // screen px per source px (side rig)
    let z1 = 1; // world zoom on the road
    let mobile = false;
    let p = 0;
    let lastScene = -1;
    let draw: ReturnType<typeof startOcean> = null;
    const OCEAN_SCALE = 0.6; // the water is rendered at 60 % and stretched; it is soft anyway
    let cam = { x: 0, y: 0, z: 1 };

    const size = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      mobile = vw < 768;
      k = mobile ? Math.min((vw * 1.05) / 2500, (vh * 0.34) / 1446) : Math.min((vh * 0.6) / 1446, (vw * 0.92) / 2700);
      z1 = (vh * (mobile ? 0.3 : 0.44)) / TL;
      const rig = $('rig');
      if (rig) {
        rig.style.width = `${FW * k}px`;
        rig.style.height = `${FH * k}px`;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      worldCanvas.width = Math.round(vw * dpr);
      worldCanvas.height = Math.round(vh * dpr);
      canvas.width = Math.round(vw * OCEAN_SCALE);
      canvas.height = Math.round(vh * OCEAN_SCALE);
      const bankTop = $('bankTop');
      if (bankTop) bankTop.style.backgroundImage = paintClouds(91, 16, 1, 24, 44, (0.6 * vh) / vw);
      update();
    };

    // ---------- the sea keeps moving on its own, but only while it is on screen ----------
    let oceanOn = false;
    let loopId = 0;
    const t0 = performance.now();
    const loop = () => {
      loopId = 0;
      if (!oceanOn) return;
      if (!draw) draw = startOcean(canvas);
      // offsets kept small (relative to the ship) so phone GPUs keep their precision
      draw?.(((performance.now() - t0) / 1000) % 600, cam.x - XN, cam.y - Y_SLOT, cam.z, OCEAN_SCALE);
      loopId = requestAnimationFrame(loop);
    };
    const setOcean = (on: boolean) => {
      if (on === oceanOn) return;
      oceanOn = on;
      const wake = wakeRef.current;
      if (on) {
        if (wake && !wake.src) {
          wake.muted = true;
          wake.src = U('wake.mp4');
        }
        wake?.play().catch(() => {});
        if (!loopId) loopId = requestAnimationFrame(loop);
      } else {
        wake?.pause();
      }
    };

    // ---------- the top-view world is drawn on a 2D canvas: crisp at any zoom, and light on memory ----------
    const wctx = worldCanvas.getContext('2d');
    const imgs: Record<string, HTMLImageElement> = {};
    const tints: HTMLCanvasElement[] = [];
    for (const n of ['ship', 'tk-top-cab', 'tk-top-box', 'box-top']) {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => {
        if (n === 'box-top') makeTints(im);
        onScroll();
      };
      im.src = U(`${n}.webp`);
      imgs[n] = im;
    }
    function makeTints(im: HTMLImageElement) {
      // burgundy, navy and light grey boxes for the yard, from the one grey box
      for (const col of ['#7a3440', '#2a3a66', '#c9ccd2']) {
        const c = document.createElement('canvas');
        c.width = im.naturalWidth;
        c.height = im.naturalHeight;
        const g = c.getContext('2d');
        if (!g) continue;
        g.drawImage(im, 0, 0);
        g.globalCompositeOperation = 'multiply';
        g.fillStyle = col;
        g.fillRect(0, 0, c.width, c.height);
        g.globalCompositeOperation = 'destination-in';
        g.drawImage(im, 0, 0);
        tints.push(c);
      }
    }
    const ready = (im?: HTMLImageElement) => !!im && im.complete && im.naturalWidth > 0;
    type WorldState = {
      ax: number;
      ay: number;
      zoom: number;
      rot: number;
      cx: number;
      cy: number;
      tpos: { x: number; y: number };
      hd: number;
      lift: number;
      carry: number;
      drop: number;
      truckA: number;
      landA: number;
      shipBox: number;
      onTruck: boolean;
    };
    function road(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, horizontal: boolean) {
      g.fillStyle = '#1b1f26';
      g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(255,255,255,0.22)';
      if (horizontal) {
        g.fillRect(x, y + 10, w, 4);
        g.fillRect(x, y + h - 14, w, 4);
      } else {
        g.fillRect(x + 10, y, 4, h);
        g.fillRect(x + w - 14, y, 4, h);
      }
      g.strokeStyle = 'rgba(255,255,255,0.55)';
      g.lineWidth = 5;
      g.setLineDash([60, 70]);
      g.beginPath();
      if (horizontal) {
        g.moveTo(x, y + h / 2);
        g.lineTo(x + w, y + h / 2);
      } else {
        g.moveTo(x + w / 2, y + h);
        g.lineTo(x + w / 2, y);
      }
      g.stroke();
      g.setLineDash([]);
    }
    function drawWorld(s: WorldState) {
      const g = wctx;
      if (!g) return;
      const dpr = worldCanvas.width / vw;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, worldCanvas.width, worldCanvas.height);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.translate(s.ax, s.ay);
      g.scale(s.zoom, s.zoom);
      g.rotate((s.rot * Math.PI) / 180);
      g.translate(-s.cx, -s.cy);
      const shadow = (blur: number, ox: number, oy: number, a: number) => {
        g.shadowColor = `rgba(0,0,0,${a})`;
        g.shadowBlur = blur * s.zoom * dpr;
        g.shadowOffsetX = ox * s.zoom * dpr;
        g.shadowOffsetY = oy * s.zoom * dpr;
      };
      const noShadow = () => {
        g.shadowColor = 'transparent';
        g.shadowBlur = 0;
        g.shadowOffsetX = 0;
        g.shadowOffsetY = 0;
      };

      // land, roads, junction and the yard by the quay
      if (s.landA > 0.002) {
        g.globalAlpha = s.landA;
        g.fillStyle = '#0d1015';
        g.fillRect(-4000, Y_QUAY, A + 9000, 9000);
        const qg = g.createLinearGradient(0, Y_QUAY - 46, 0, Y_QUAY);
        qg.addColorStop(0, '#7d838c');
        qg.addColorStop(1, '#4c525b');
        g.fillStyle = qg;
        g.fillRect(-4000, Y_QUAY - 46, A + 9000, 46);
        road(g, -4000, -WR / 2, A + R + 4000 + 2400, WR, true);
        road(g, XN - WR / 2, Y_QUAY, WR, -Y_QUAY + 2400, false);
        g.fillStyle = '#1b1f26';
        g.fillRect(XN - WR / 2, -WR / 2, WR, WR);
        g.fillStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < WR; i += 30) {
          g.fillRect(XN - WR / 2 - 46, -WR / 2 + i + 6, 26, 14);
          g.fillRect(XN + WR / 2 + 20, -WR / 2 + i + 6, 26, 14);
          g.fillRect(XN - WR / 2 + i + 6, -WR / 2 - 46, 14, 26);
          g.fillRect(XN - WR / 2 + i + 6, WR / 2 + 20, 14, 26);
        }
        if (tints.length === 3) {
          for (let row = 0; row < 2; row++) {
            for (let j = 0; j < 8; j++) {
              const y = Y_QUAY + 120 + row * 310;
              g.drawImage(tints[(row + j) % 3], XN + WR / 2 + 160 + j * 82, y, 72, 300);
              g.drawImage(tints[(row + j + 2) % 3], XN - WR / 2 - 160 - 8 * 82 + j * 82, y, 72, 300);
            }
          }
        }
        g.globalAlpha = 1;
      }

      // the ship, bow north
      if (ready(imgs.ship)) g.drawImage(imgs.ship, SHIP.x, SHIP.y, SHIP.w, SHIP.h);

      // the truck
      if (s.truckA > 0.002) {
        g.save();
        g.globalAlpha = s.truckA;
        g.translate(s.tpos.x, s.tpos.y);
        g.rotate((s.hd * Math.PI) / 180);
        // bare trailer, seen once the box is lifted off
        g.fillStyle = '#24272c';
        const tx = -TBOX.w / 2 + 14;
        const tw = TBOX.w - 28;
        g.fillRect(tx + tw * 0.18, TBOX.y + 6, tw * 0.09, TBOX.h - 10);
        g.fillRect(tx + tw * 0.73, TBOX.y + 6, tw * 0.09, TBOX.h - 10);
        for (const t of [0.08, 0.3, 0.52, 0.74, 0.92]) g.fillRect(tx, TBOX.y + 6 + (TBOX.h - 10) * t, tw, 7);
        if (ready(imgs['tk-top-cab'])) {
          shadow(14, 6, 8, 0.6);
          g.drawImage(imgs['tk-top-cab'], CAB.x, CAB.y, CAB.w, CAB.h);
          noShadow();
        }
        g.restore();
      }

      // the container: rides the truck, then is lifted, carried and set into the slot
      g.save();
      if (s.onTruck) {
        g.translate(s.tpos.x, s.tpos.y);
        g.rotate((s.hd * Math.PI) / 180);
        g.translate(0, TBOX.y + TBOX.h / 2);
        shadow(12, 5, 7, 0.55);
      } else {
        const lifted = 1 + s.lift * 0.22 * (1 - s.drop);
        const sy = lerp(1, (SLOT.h * SHIP_S) / TBOX.h, s.drop) * lifted;
        g.translate(XN, lerp(Y_STOP + TBOX.y + TBOX.h / 2, Y_SLOT, s.carry));
        g.scale(lifted, sy);
        const air = s.lift * (1 - s.drop);
        shadow(12 + air * 40, 5 + air * 30, 7 + air * 40, 0.55 - air * 0.15);
      }
      if (ready(imgs['tk-top-box']) && s.shipBox < 1) {
        g.globalAlpha = 1 - s.shipBox;
        g.drawImage(imgs['tk-top-box'], -TBOX.w / 2, -TBOX.h / 2, TBOX.w, TBOX.h);
      }
      if (ready(imgs['box-top']) && s.shipBox > 0) {
        noShadow();
        g.globalAlpha = s.shipBox;
        g.drawImage(imgs['box-top'], -TBOX.w / 2, -TBOX.h / 2, TBOX.w, TBOX.h);
      }
      g.restore();
      g.globalAlpha = 1;
      noShadow();
    }

    let raf = 0;
    function update() {
      raf = 0;
      const rect = section!.getBoundingClientRect();
      const span = rect.height - vh;
      p = span > 0 ? clamp(-rect.top / span) : 0;

      const sc = p < T.driveOff[1] ? 0 : p < T.liftBox[0] ? 1 : p < T.sky[0] ? 2 : 3;
      if (sc !== lastScene) {
        lastScene = sc;
        setScene(sc);
      }

      // ================= Leg 1: the yard, side and rear views =================
      const sideOn = p < T.settle[0] + 0.02;
      set($('side'), { display: sideOn ? '' : 'none' });
      if (sideOn) {
        const drive = easeOut(seg(p, T.driveIn));
        const machineX = lerp(-2700, 0, drive);
        const spread = ease(seg(p, T.spreadDown)) * SPREAD_DOWN - ease(seg(p, T.lift)) * (SPREAD_DOWN + 57);
        const boxY = BOX_DROP * (1 - ease(seg(p, T.lift)));
        const hold = ease(seg(p, T.hold));
        const t1 = ease(seg(p, T.turn1));
        const t2 = ease(seg(p, T.turn2));
        const t3 = ease(seg(p, T.turn3));
        const lower = ease(seg(p, T.lower)) * LOWER;
        const release = ease(seg(p, T.release));
        const away = ease(seg(p, [T.release[1] - 0.005, T.release[1] + 0.02]));
        const driveX = easeIn(seg(p, T.driveOff)) * 2600;
        const truckIn = easeOut(seg(p, T.truckIn));
        const truckX = lerp(-3600, 0, truckIn) + driveX;

        // camera: the yard, then the rear view, then it follows the truck out
        const follow = ease(seg(p, [T.release[0], T.driveOff[0] + 0.03]));
        const camX = lerp(lerp(1460, 1394, t1), 1850 + driveX, follow);
        const kz = lerp(lerp(1, 0.96, t3), mobile ? 0.82 : 0.78, follow);
        const K = k * kz;
        const G = vh * (mobile ? 0.72 : 0.84);
        const tx = vw / 2 - camX * K;
        const ty = G - GROUND * K;
        set($('rig'), { transform: `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${kz.toFixed(4)})` });

        const mx = `translate3d(${(machineX * k).toFixed(1)}px,0,0)`;
        set($('rsBase'), { transform: mx });
        set($('rsSpread'), { transform: `translate3d(${(machineX * k).toFixed(1)}px,${(spread * k).toFixed(1)}px,0)` });
        set($('rsPost'), { transform: mx, height: `${(Math.max(0, spread + 20) * k).toFixed(1)}px` });
        set($('rsBox'), { transform: `translate3d(0,${(boxY * k).toFixed(1)}px,0)` });
        set($('rsHold'), { transform: mx });
        // side frames hand over to the rear frames
        const sideA = 1 - hold;
        op('rsBase', sideA * (1 - t1));
        op('rsSpread', sideA * (1 - t1));
        op('rsPost', sideA * (1 - t1));
        op('rsBox', sideA * (1 - t1));
        op('rsHold', hold * (1 - t1));
        op('t1', t1 * (1 - t2));
        op('tmid', t2 * (1 - t3));
        const swap = p >= T.lower[0] ? 1 : 0;
        op('t5', t3 * (1 - swap));
        op('t6lo', swap * (1 - away));
        op('t6up', swap * (1 - away));
        op('tbox', swap);
        set($('t6up'), { transform: `translate3d(0,${((lower - release * (LOWER + 160)) * k).toFixed(1)}px,0)` });
        set($('tbox'), { transform: `translate3d(${(driveX * k).toFixed(1)}px,${(lower * k).toFixed(1)}px,0)` });
        set($('t6lo'), { transform: `translate3d(${(-away * 140 * k).toFixed(1)}px,0,0)` });
        set($('truck'), { transform: `translate3d(${(truckX * k).toFixed(1)}px,0,0)` });
        set($('truckA'), { transform: `translate3d(${(truckX * k).toFixed(1)}px,0,0)` });
        const ang = ease(seg(p, T.angle));
        op('truck', truckIn > 0 ? 1 - ang : 0);
        op('truckA', ang * (1 - ease(seg(p, T.top))));
        op('tbox', swap * (1 - ang));
        op('stack', 1 - ease(seg(p, [T.turn1[0], T.turn2[0]])));
        op('shadowSide', 1 - t1);

        // the yard goes to night road: a dark band rises, then fills the frame
        const band = ease(seg(p, [T.release[1], T.angle[1]]));
        set($('band'), { transform: `translate3d(0,${((1 - band) * 100).toFixed(2)}%,0)` });
        set($('dash'), { backgroundPositionX: `${(-driveX * K * 0.9).toFixed(0)}px`, opacity: String(1 - ang) });
        set($('side'), { opacity: (1 - ease(seg(p, T.top))).toFixed(3) });

        // hand-over point for the top view: centre and length of the truck on screen
        handover.x = tx + (1850 + driveX) * K;
        handover.y = ty + 880 * K;
        handover.len = 3167 * K;
      }

      // ================= Legs 2-3: top view, road, quay, ship =================
      const worldOn = p > T.angle[0];
      set($('world'), { display: worldOn ? '' : 'none' });
      const topIn = ease(seg(p, T.top));
      set($('world'), { opacity: topIn.toFixed(3) });
      let rot = 0;
      if (worldOn) {
        const settle = easeIO(seg(p, T.settle));
        const s = S_END * easeIO(seg(p, T.road));
        const [tx0, ty0, hd] = path(s);
        // truck stays at the quay once it gets there
        const tpos = { x: tx0, y: ty0 };
        // camera: start where the side truck was, settle over the road, then carry the box to the ship
        const zStart = handover.len / TL;
        let zoom = lerp(zStart, z1, settle);
        let cx = tpos.x;
        let cy = tpos.y;
        rot = lerp(0, -hd, settle);
        let ax = lerp(handover.x, vw / 2, settle);
        const roadY = vh * (mobile ? 0.76 : 0.56);
        let ay = lerp(handover.y, roadY, settle);

        const lift = easeOut(seg(p, T.liftBox));
        const carry = easeIO(seg(p, T.carry));
        const drop = easeIO(seg(p, T.drop));
        const pull = easeIO(seg(p, T.pull));
        if (p > T.carry[0]) {
          cy = lerp(tpos.y, Y_SLOT, carry);
          zoom = z1 * (1 - Math.sin(carry * Math.PI) * 0.45);
        }
        const zFit = (vh * (mobile ? 0.34 : 0.6)) / HULL;
        if (p > T.pull[0]) {
          cy = lerp(Y_SLOT, SHIP_MID, pull);
          zoom = lerp(z1, zFit, pull);
          ay = lerp(roadY, vh * (mobile ? 0.47 : 0.6), pull);
        }
        ax = p > T.pull[0] ? vw / 2 : ax;
        cam = { x: cx, y: cy, z: zoom };

        const m = `translate3d(${ax.toFixed(1)}px,${ay.toFixed(1)}px,0) scale(${zoom.toFixed(5)}) rotate(${rot.toFixed(3)}deg) translate3d(${(-cx).toFixed(1)}px,${(-cy).toFixed(1)}px,0)`;
        set($('wakeIn'), { transform: m });
        drawWorld({
          ax,
          ay,
          zoom,
          rot,
          cx,
          cy,
          tpos,
          hd,
          lift,
          carry,
          drop,
          truckA: 1 - ease(seg(p, [T.carry[0] + 0.02, T.carry[0] + 0.05])),
          landA: 1 - ease(seg(p, [T.carry[0] + 0.03, T.drop[0]])),
          shipBox: ease(seg(p, [T.drop[0] + 0.015, T.drop[1]])),
          onTruck: p < T.liftBox[0],
        });

        if (!draw && p > T.road[0]) draw = startOcean(canvas); // compile early, off the critical moment
        setOcean(p > T.road[0] + (T.road[1] - T.road[0]) * 0.7 && p < T.sky[1]);
      } else {
        setOcean(false);
      }

      // ================= Leg 4: clouds, a plane, and the page below =================
      const u = seg(p, T.sky);
      set($('sky'), { display: p > T.sky[0] - 0.01 ? '' : 'none' });
      if (p > T.sky[0] - 0.01) {
        set($('cloudA'), { transform: `translate3d(0,${lerp(110, -130, u).toFixed(2)}%,0) scale(1.4)`, opacity: String(Math.min(1, u * 4)) });
        set($('cloudB'), { transform: `translate3d(0,${lerp(140, -170, u).toFixed(2)}%,0) scale(1.8)` });
        set($('plane'), { transform: `translate3d(-50%,${lerp(120, -140, easeIO(clamp(u * 1.25))).toFixed(2)}vh,0) rotate(-90deg)` });
        set($('bank'), { transform: `translate3d(0,${(((1.15 - u) / 1.5) * 100).toFixed(2)}%,0)` });
      }

      // ================= Copy =================
      const c0 = clamp((0.045 - p) / 0.03);
      const c1 = win(p, 0.46, 0.59, 0.2);
      const c2 = win(p, T.pull[0] + 0.035, T.sky[0] + 0.03, 0.22);
      [c0, c1, c2].forEach((o, i) => {
        const el = $(`copy${i}`);
        if (!el) return;
        el.style.opacity = String(o);
        el.style.transform = `translate3d(0,${((1 - o) * 30).toFixed(1)}px,0)`;
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      });
      serviceRefs.current.forEach((li, i) => {
        if (!li) return;
        const t = ease(clamp((p - 0.49 - i * 0.012) / 0.03));
        li.style.opacity = String(t);
        li.style.transform = `translate3d(0,${((1 - t) * 18).toFixed(1)}px,0)`;
      });
      valueRefs.current.forEach((li, i) => {
        if (!li) return;
        const t = ease(clamp((p - T.pull[0] - 0.05 - i * 0.012) / 0.03));
        li.style.opacity = String(t);
        li.style.transform = `translate3d(${((1 - t) * (i % 2 ? 24 : -24)).toFixed(1)}px,0,0)`;
      });

      // speed readout while the truck is moving
      let kmh = 0;
      if (p > T.driveOff[0] && p < T.liftBox[0]) {
        const r0 = seg(p, T.road);
        const jn = A / S_END;
        kmh = 62 * easeOut(seg(p, T.driveOff));
        if (p > T.road[0]) kmh = 62 - 34 * Math.exp(-Math.pow((r0 - jn) / 0.05, 2)) - 62 * easeIn(clamp((r0 - 0.88) / 0.12));
      }
      const sp = $('kmh');
      if (sp) sp.textContent = String(Math.max(0, Math.round(kmh))).padStart(2, '0');
      op('speed', win(p, T.driveOff[0], T.liftBox[0] + 0.01, 0.08));
    }
    const handover = { x: 0, y: 0, len: 1000 };
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
      cancelAnimationFrame(loopId);
      oceanOn = false;
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', size);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const img = (src: string, style: CSSProperties, key: string, extra = '') => (
    <img ref={r(key)} src={U(src)} alt="" draggable={false} decoding="async" className={`pointer-events-none select-none ${extra}`} style={style} />
  );

  return (
    <section ref={sectionRef} id="services" aria-label="Our services" className="relative h-[820vh] scroll-mt-24 bg-space text-white md:h-[1000vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* ---------- ocean, wake, then the top-view world ---------- */}
        <canvas ref={oceanRef} aria-hidden="true" className="absolute inset-0 h-full w-full bg-[#03192f]" />
        <div aria-hidden="true" className="absolute inset-0 mix-blend-screen" style={{ opacity: 0.35 }}>
          <div ref={r('wakeIn')} className="absolute left-0 top-0 origin-top-left will-change-transform">
            <video
              ref={wakeRef}
              muted
              loop
              playsInline
              preload="none"
              className="absolute max-w-none"
              style={{ left: XN - 1500, top: SHIP.y + 300 * SHIP_S, width: 3000, height: 5333 }}
            />
          </div>
        </div>

        <div ref={r('world')} aria-hidden="true" className="absolute inset-0" style={{ display: 'none', opacity: 0 }}>
          <canvas ref={worldRef} className="absolute inset-0 h-full w-full" />
          {/* night grade over the land, lighter toward the sea */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_80%_at_50%_50%,rgba(5,7,15,0)_50%,rgba(5,7,15,0.6))]" />
        </div>

        {/* ---------- Leg 1: the yard, side view ---------- */}
        <div ref={r('side')} className="absolute inset-0 text-ink">
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_bottom,#C9D0D2_0%,#DCE1E2_45%,#EAECEB_78%,#E2E4E4_100%)]" />
          <div aria-hidden="true" className="absolute inset-0 opacity-40" style={{ backgroundImage: "url('/story/parts/fog-a.webp')", backgroundSize: '1400px 1400px' }} />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[24%] bg-[linear-gradient(to_bottom,#D3D7D8,#C2C7C9)]" />

          {/* the night road rising under the truck */}
          <div ref={r('band')} aria-hidden="true" className="absolute inset-0 bg-[#0f1217] will-change-transform" style={{ transform: 'translate3d(0,100%,0)' }}>
            <div
              ref={r('dash')}
              className="absolute inset-x-0 top-[22%] h-[4px]"
              style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.5) 0 50%, transparent 50% 100%)', backgroundSize: '90px 4px' }}
            />
          </div>

          <div ref={r('rig')} aria-hidden="true" className="absolute left-0 top-0 origin-top-left will-change-transform">
            {/* a stack of boxes in the yard behind */}
            <div ref={r('stack')} className="absolute opacity-80" style={{ left: `${(2760 / FW) * 100}%`, bottom: `${((FH - GROUND + 60) / FH) * 100}%`, width: `${(640 / FW) * 100}%` }}>
              <div className="flex items-end gap-[1.5%] blur-[0.6px]">
                <div className="flex w-1/2 flex-col">
                  <img src={U('door-blue.webp')} alt="" draggable={false} className="w-full" />
                  <img src={U('door-navy.webp')} alt="" draggable={false} className="w-full" />
                </div>
                <img src={U('door-grey.webp')} alt="" draggable={false} className="w-1/2" />
              </div>
            </div>
            <div ref={r('shadowSide')} className="absolute rounded-[50%] bg-black/30 blur-[12px]" style={at({ x: 300, y: GROUND - 30, w: 2350, h: 70 })} />

            {/* truck arriving behind the machine (rear view) */}
            {img('tk-empty.webp', { ...at(TRUCK), opacity: 0 }, 'truck', 'will-change-transform')}
            {img('tk-angle2.webp', { ...at(TRUCK), opacity: 0 }, 'truckA', 'will-change-transform')}
            {img('t-box.webp', { ...at(TURN), opacity: 0 }, 'tbox', 'will-change-transform')}

            {/* side view: machine, spreader on its post, the box on the ground */}
            {img('rs-base.webp', at(SIDE), 'rsBase', 'will-change-transform')}
            <div
              ref={r('rsPost')}
              className="absolute bg-[linear-gradient(90deg,#141518,#2c2e33_45%,#17181b)]"
              style={{ left: `${(POST.x / FW) * 100}%`, top: `${(POST.y / FH) * 100}%`, width: `${(POST.w / FW) * 100}%`, height: 0 }}
            />
            {img('rs-spreader.webp', at(SIDE), 'rsSpread', 'will-change-transform')}
            {img('rs-box.webp', at(SIDE), 'rsBox', 'will-change-transform')}
            {img('rs-holding.webp', { ...at(SIDE), opacity: 0 }, 'rsHold', 'will-change-transform')}

            {/* rear frames */}
            {img('t1.webp', { ...at(TURN), opacity: 0 }, 't1')}
            {img('tmid.webp', { ...at(TURN), opacity: 0 }, 'tmid')}
            {img('t5.webp', { ...at(TURN), opacity: 0 }, 't5')}
            {img('t6-lo.webp', { ...at(TURN), opacity: 0 }, 't6lo', 'will-change-transform')}
            {img('t6-up.webp', { ...at(TURN), opacity: 0 }, 't6up', 'will-change-transform')}
          </div>

        </div>

        {/* ---------- Leg 4: sky ---------- */}
        <div ref={r('sky')} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ display: 'none' }}>
          <img ref={r('cloudA')} src={U('cloud-1.webp')} alt="" draggable={false} className="absolute inset-x-0 top-0 h-full w-full object-cover opacity-0 will-change-transform" style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)', maskImage: 'linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)' }} />
          <img ref={r('plane')} src={U('plane.webp')} alt="" draggable={false} className="absolute left-1/2 top-0 w-[min(70vw,560px)] max-w-none drop-shadow-[40px_60px_30px_rgba(0,0,0,0.35)] will-change-transform" />
          <img ref={r('cloudB')} src={U('cloud-2.webp')} alt="" draggable={false} className="absolute inset-x-0 top-0 h-full w-full object-cover will-change-transform" style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)', maskImage: 'linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)' }} />
          <div ref={r('bank')} className="absolute inset-x-0 bottom-0 h-[150%] will-change-transform" style={{ transform: 'translate3d(0,100%,0)' }}>
            <div ref={r('bankTop')} className="absolute inset-x-0 top-0 h-[40%]" style={{ backgroundSize: '100% 100%', WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 45%)', maskImage: 'linear-gradient(to bottom, transparent, #000 45%)' }} />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(244,246,251,0.35)_8%,rgba(255,255,255,0.9)_18%,#FFFFFF_23%)]" />
          </div>
        </div>

        {/* ---------- Copy ---------- */}
        <div ref={r('copy0')} className="container-x absolute inset-x-0 top-0 z-[2] pt-28 text-ink sm:pt-32">
          <p className="eyebrow">Our services</p>
          <h2 className="mt-5 max-w-3xl text-[36px] font-medium leading-[1.02] sm:text-[56px] lg:text-[64px]">Every order, packed and on its way.</h2>
          <p className="mt-5 max-w-md text-[16px] leading-[1.65] text-muted sm:text-[17px]">From the supplier&apos;s door to yours, we handle each step and keep you posted along the way.</p>
        </div>

        <div ref={r('copy1')} className="container-x absolute inset-x-0 top-0 z-[2] grid gap-6 pt-24 text-white lg:grid-cols-12 lg:items-start lg:pt-36" style={{ opacity: 0, visibility: 'hidden' }}>
          <div className="lg:col-span-4">
            <p className="eyebrow text-white/80">What we do</p>
            <h3 className="mt-4 font-display text-[28px] font-medium leading-[1.05] sm:text-[44px]">Six services. One team.</h3>
            <p className="mt-4 max-w-sm text-[16px] leading-[1.65] text-white/75 lg:text-[17px]">One partner for the whole journey, so nothing gets lost between suppliers, inspectors and carriers.</p>
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
                <p className="mt-0.5 hidden text-[14px] text-white/70 sm:block lg:text-[15px]">{sv.short}</p>
              </li>
            ))}
          </ul>
        </div>

        <div ref={r('copy2')} className="container-x absolute inset-0 z-[2] flex flex-col justify-between py-28 sm:py-24" style={{ opacity: 0, visibility: 'hidden' }}>
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

        {/* speed, while the truck is moving */}
        <div ref={r('speed')} aria-hidden="true" className="container-x pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex justify-center pb-6 lg:justify-start lg:pb-24" style={{ opacity: 0, visibility: 'hidden' }}>
          <div>
            <span ref={r('kmh')} className="font-display text-[40px] font-medium tabular-nums leading-none sm:text-[56px]">
              00
            </span>
            <span className="ml-2 text-[12px] tracking-[0.14em] text-white/60">KM/H</span>
          </div>
        </div>

        {/* Journey indicator */}
        <div className="container-x pointer-events-none absolute inset-x-0 bottom-0 z-[2] hidden pb-6 lg:block [@media(max-height:820px)]:!hidden">
          <div className={`flex items-center gap-4 transition-opacity duration-300 ${scene === 3 || scene === 0 ? 'opacity-0' : ''}`}>
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
