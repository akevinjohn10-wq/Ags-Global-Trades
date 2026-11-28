import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Handshake, Receipt, Truck } from 'lucide-react';
import { services } from '@/data/siteContent';
import './train-hero.css';

/**
 * Services scroll story, frame by frame:
 *  1. The reach stacker drives in from the left to the stack and locks onto the grey container
 *  2. It lifts it and turns to face us                                    (119 video frames)
 *  3. The empty truck slides in, the container is lowered onto it, the spreader lifts away
 *  4. The truck pulls out: the frame zooms out, a black panel rises with the services
 *  5. The truck drives on off the right of the screen and disappears into fog
 *  6. Out of the fog: a container train crossing coal terrain (looping video), with
 *     "One team for every mile of the journey" and two points set either side of the train; fog rolls back over it
 *  7. The fog clears onto the ship, which sails on, held for a while with "Why AGS Trade"
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
const SHIP = 63; // the wide shot of the whole ship sailing, every frame, played as you scroll (clouds roll in at the end)
const SHIP_CU = 1; // roughly where the pull-back is well under way
// the light grey container column the truck lines up with, as fractions of the ship frame's width
// the centre container of the deck (the truck lands on it) and the deck's full width, as fractions of the frame;
// full-size frames (1920 x 1080); phones use a 540-wide centre slice
const SHIP_COL = {
  d: { cx: 959.25 / 1920, w: 66 / 1920, deck: 960 / 1920, fw: 1440, fh: 810 },
  m: { cx: 269.25 / 540, w: 66 / 540, deck: 960 / 540, fw: 540, fh: 1080 },
};
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

// ---------- timeline ----------
const T = {
  intro: [0, 0.0365],
  driveIn: [0.0036, 0.0911],
  turn: [0.0911, 0.2095],
  lift: [0.2095, 0.2232], // the stacker raises the container high enough for the truck
  truckIn: [0.2186, 0.2505],
  lower: [0.2505, 0.2706],
  swap: [0.2632, 0.2724],
  release: [0.2732, 0.2961],
  shrink: [0.2961, 0.3598],
  services: [0.3279, 0.4282],
  rise: [0.4282, 0.462], // the truck drives off the right of the screen into fog
  road: [0.462, 0.585], // the train scene, between two banks of fog
  hand: [0.585, 0.62], // the fog clears onto the ship
  ship: [0.62, 0.8725], // the wide shot sails up the page, clouds roll in
  sky: [0.8725, 1],
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


const PAPER = '#ffffff';
const SIDE_MASK = 'linear-gradient(to right, #000 0%, #000 55%, transparent 100%)';
const FADE_MASK = 'linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)';

// how far the camera has pulled back in each ship frame (1 = the deck close-up); the ship's hull is
// about half the frame wide at 1, so the moving-water effect leaves a band that wide (times this) alone
const SHIP_SCALE = [0.133,0.1304,0.1281,0.126,0.1241,0.1223,0.1207,0.1193,0.1179,0.1166,0.1153,0.1142,0.1131,0.1121,0.1111,0.1103,0.1094,0.1086,0.1078,0.1071,0.1065,0.1059,0.1053,0.1049,0.1044,0.104,0.1036,0.1032,0.1029,0.1026,0.1024,0.1021,0.1019,0.1017,0.1015,0.1014,0.1012,0.1011,0.101,0.1009,0.1008,0.1007,0.1005,0.1004,0.1003,0.1002,0.1001,0.1,0.0998,0.0998,0.0996,0.0996,0.0994,0.0994,0.0993,0.0992,0.0991,0.099,0.0989,0.0988,0.0987,0.0987,0.0987];

/**
 * The sea keeps moving while the page is still: the current ship frame is drawn through a tiny WebGL
 * shader that nudges the water by a pixel or two in slow, overlapping swells (the ship's band is left
 * alone). One texture upload when the frame changes, then a single cheap full-screen pass per tick.
 */
class SeaGL {
  gl: WebGLRenderingContext;
  canvas: HTMLCanvasElement;
  private u: Record<string, WebGLUniformLocation | null> = {};
  static create(canvas: HTMLCanvasElement) {
    try {
      const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: false, antialias: false });
      return gl ? new SeaGL(canvas, gl) : null;
    } catch {
      return null;
    }
  }
  constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
    this.canvas = canvas;
    this.gl = gl;
    const vs = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
    const fs = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D texA,texB;uniform vec4 rectA,rectB;uniform vec2 res;uniform float edge,t,halfW,amp,mixB,veil,sc,glare;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*vn(p);p*=2.03;a*=.5;}return v;}
void main(){
  vec2 px=vec2(gl_FragCoord.x,res.y-gl_FragCoord.y);
  // where the page meets the sea: a ragged, moving line of foam and spray instead of a straight edge
  float d=1e4;float n=.5,n2=.5;
  if(edge>0.5){
    vec2 q=px/sc;
    n=fbm(vec2(q.x*.009,q.y*.014-t*.35));
    n2=fbm(vec2(q.x*.03+7.,q.y*.045+t*.8));
    d=(px.y-edge)/sc+(n-.5)*120.+(n2-.5)*46.;
    if(d<-190.){gl_FragColor=vec4(0.);return;}
  }
  vec2 uv=(px-rectA.xy)/rectA.zw;
  float w=smoothstep(halfW,halfW+0.03,abs(uv.x-0.4996));
  vec2 dd=vec2(sin(uv.y*34.+t*1.25)*.55+sin((uv.x+uv.y)*19.-t*.85)*.45,
              sin(uv.x*28.-t*1.)*.5+sin((uv.x-uv.y)*24.+t*.7)*.5)*amp*w;

  vec3 c=texture2D(texA,clamp((px+dd-rectA.xy)/rectA.zw,0.,1.)).rgb;
  if(mixB>0.001){vec3 cb=texture2D(texB,clamp((px+dd-rectB.xy)/rectB.zw,0.,1.)).rgb;c=mix(c,cb,mixB);}
  c*=1.+.06*w*sin(uv.x*50.+uv.y*43.+t*1.7)*sin(uv.y*30.-t*1.3);
  c=mix(c,vec3(.008,.04,.08),veil);
  // a subtle lens flare: a soft sun glow at the top right and a few faint rings along the line through the centre
  float asp=res.x/res.y;
  vec2 sp=vec2(px.x/res.x*asp,px.y/res.y);
  vec2 sun=vec2(.9*asp,.07);
  if(glare>0.){
    float sd=distance(sp,sun);
    c+=vec3(1.,.86,.64)*exp(-sd*2.6)*.2*glare;
    c+=vec3(1.,.9,.75)*exp(-sd*9.)*.14*glare;
    // a soft horizontal streak through the sun
    c+=vec3(.85,.9,1.)*exp(-abs(sp.y-sun.y)*55.)*exp(-abs(sp.x-sun.x)*1.6)*.09*glare;
    vec2 axis=vec2(.5*asp,.5)-sun;
    float g1=smoothstep(.08,.06,distance(sp,sun+axis*.55));
    float g2=smoothstep(.038,.028,distance(sp,sun+axis*.85));
    float g3=smoothstep(.14,.105,distance(sp,sun+axis*1.35))-smoothstep(.105,.07,distance(sp,sun+axis*1.35));
    float g4=smoothstep(.055,.04,distance(sp,sun+axis*1.75));
    float g5=smoothstep(.02,.012,distance(sp,sun+axis*1.1));
    c+=(vec3(1.,.8,.5)*g1*.07+vec3(.6,.85,1.)*g2*.09+vec3(.7,1.,.8)*g3*.05+vec3(1.,.7,.9)*g4*.07+vec3(1.)*g5*.08)*glare;
  }
  if(d>=1e3){gl_FragColor=vec4(c,1.);return;}
  float seaA=smoothstep(-8.,8.,d);
  float foam=clamp(smoothstep(95.,0.,abs(d-6.))*smoothstep(.36,.62,n2*.75+n*.55-abs(d)/220.),0.,1.);
  float mist=(1.-seaA)*smoothstep(-190.,-10.,d)*(.25+.55*n);
  vec3 white=vec3(.97,.98,1.);
  float a=clamp(seaA+(1.-seaA)*max(foam,mist),0.,1.);
  vec3 rgb=c*seaA*(1.-foam)+white*foam+white*mist*(1.-seaA)*(1.-foam);
  gl_FragColor=vec4(min(rgb,vec3(a)),a);
}`;
    const sh = (type: number, src: string) => {
      const o = gl.createShader(type)!;
      gl.shaderSource(o, src);
      gl.compileShader(o);
      return o;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    for (const k of ['rectA', 'rectB', 'res', 'edge', 't', 'halfW', 'amp', 'mixB', 'texA', 'texB', 'veil', 'sc', 'glare']) this.u[k] = gl.getUniformLocation(prog, k);
    gl.uniform1i(this.u.texA, 0);
    gl.uniform1i(this.u.texB, 1);

  }
  get ok() {
    return !this.gl.isContextLost();
  }
  // recently used frames stay on the graphics card, so scrolling back and forth never sends them again
  private cache = new Map<HTMLImageElement, WebGLTexture>();
  private texFor(img: HTMLImageElement) {
    const gl = this.gl;
    let tx = this.cache.get(img);
    if (tx) {
      this.cache.delete(img);
      this.cache.set(img, tx);
      return tx;
    }
    if (this.cache.size >= 14) {
      const [oldImg, oldTx] = this.cache.entries().next().value as [HTMLImageElement, WebGLTexture];
      this.cache.delete(oldImg);
      tx = oldTx;
    } else tx = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    this.cache.set(img, tx);
    return tx;
  }
  /** rects and edge in CSS pixels; scale = the canvas's pixels per CSS pixel */
  draw(a: ShipLayer, b: ShipLayer | null, mixB: number, edge: number, halfW: number, t: number, amp: number, scale: number, veil: number, glare = 1) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texFor(a.img));
    if (b && mixB > 0.001) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.texFor(b.img));
    }
    gl.uniform1i(this.u.texA, 0);
    gl.uniform1i(this.u.texB, 1);
    const rb = b ?? a;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform4f(this.u.rectA, a.rect[0] * scale, a.rect[1] * scale, a.rect[2] * scale, a.rect[3] * scale);
    gl.uniform4f(this.u.rectB, rb.rect[0] * scale, rb.rect[1] * scale, rb.rect[2] * scale, rb.rect[3] * scale);
    gl.uniform2f(this.u.res, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.edge, edge * scale);
    gl.uniform1f(this.u.t, t);
    gl.uniform1f(this.u.halfW, halfW);
    gl.uniform1f(this.u.amp, amp * scale);
    gl.uniform1f(this.u.mixB, b ? mixB : 0);
    gl.uniform1f(this.u.veil, veil);
    gl.uniform1f(this.u.sc, scale);
    gl.uniform1f(this.u.glare, glare);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

type ShipLayer = { img: HTMLImageElement; rect: [number, number, number, number] };

export default function StoryV3() {
  const [reduce] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  return reduce ? <StoryStatic /> : <StoryFilm />;
}

function StoryFilm() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skyRef = useRef<HTMLCanvasElement>(null);
  const seaRef = useRef<HTMLCanvasElement>(null);
  const q = useRef<Record<string, HTMLElement | null>>({});
  const r = (k: string) => (el: HTMLElement | null) => {
    q.current[k] = el;
  };
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const trainRef = useRef<HTMLVideoElement>(null);
  const valueRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const skyCv = skyRef.current;
    const sg = skyCv?.getContext('2d') ?? null;
    let sdpr = 1;
    let nextInner: HTMLElement | null = null;
    // moving water (WebGL); skipped for reduced motion, and the plain frames are used if it's unavailable
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let sea = !reduceMotion && seaRef.current ? SeaGL.create(seaRef.current) : null;
    // if a machine can't keep up, the water layer drops resolution, and as a last resort turns itself off
    let seaRes = 1;
    let slowFrames = 0;
    let lastTick = 0;
    let gdpr = 1;
    const seaState = { on: false, target: 0, posS: -1, lastT: 0, rect: [0, 0, 0, 0] as [number, number, number, number], edge: 0 };
    const skyState = { on: false, u: 0, img: null as HTMLImageElement | null, rect: [0, 0, 0, 0] as [number, number, number, number] };
    let seaRaf = 0;
    let lastRender = 0;
    const renderSea = (now: number) => {
      if (!sea || !seaState.on || (mobile && skyState.on)) return false;
      if (now - lastRender < 4) return true; // already drawn this refresh
      lastRender = now;
      // the ship glides toward where the scroll is, every screen refresh, instead of jumping with each scroll event
      const dt = Math.min(0.1, Math.max(0, (now - seaState.lastT) / 1000));
      seaState.lastT = now;
      if (seaState.posS < 0 || Math.abs(seaState.target - seaState.posS) > 12) seaState.posS = seaState.target;
      else seaState.posS += (seaState.target - seaState.posS) * (1 - Math.exp(-dt * 14));
      const v = shipView(seaState.posS, ...seaState.rect);
      if (!v) return true;
      const veil = skyState.on ? 0.4 * (1 - easeIO(clamp(skyState.u / 0.5))) : 0.4;
      sea.draw(v.a, v.b, v.mixB, seaState.edge, v.halfW, now / 1000, mobile ? 1.6 : 3.6, gdpr, veil, mobile ? 0.6 : 1);
      return true;
    };
    // the fixed sky layer shows the same (moving) sea until the plane wipes it away
    const paintSky = () => {
      if (!sg || !skyState.on) return;
      sg.setTransform(sdpr, 0, 0, sdpr, 0, 0);
      if (sea && seaState.on && !mobile) sg.drawImage(sea.canvas, 0, 0, vw, vh); // already has the veil
      else {
        sg.fillStyle = '#0b2a45';
        sg.fillRect(0, 0, vw, vh);
        if (skyState.img) sg.drawImage(skyState.img, ...skyState.rect);
        // the same dark veil as over the ship scene, lifting as the clouds roll in so they stay bright
        sg.fillStyle = `rgba(2,10,20,${(0.4 * (1 - easeIO(clamp(skyState.u / 0.5)))).toFixed(3)})`;
        sg.fillRect(0, 0, vw, vh);
      }
    };
    const seaTick = (now: number) => {
      seaRaf = 0;
      if (sea && lastTick) {
        const dt = now - lastTick;
        slowFrames = dt > 21 && dt < 250 ? slowFrames + 1 : Math.max(0, slowFrames - 2);
        if (slowFrames > 14) {
          slowFrames = 0;
          if (seaRes > 0.55) {
            seaRes *= 0.75;
            size();
          } else {
            // too slow even at low resolution: back to plain frames (still smooth, no ripple)
            set(sea.canvas, { display: 'none' });
            sea = null;
            seaState.on = false;
            set($('shipTint'), { opacity: '1' });
            lastTick = 0;
            update();
            return;
          }
        }
      }
      lastTick = now;
      if (!renderSea(now)) return;
      paintSky();
      seaRaf = requestAnimationFrame(seaTick);
    };
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
      im.onload = () => {
        onScroll();
        im.decode?.().catch(() => {});
      };
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
    // Only the frames for the scene on screen and the next one stay in memory: the four sets together are
    // well over a gigabyte once decoded, which can crash a tab. A set loads as you approach its scene and is
    // dropped again once you've scrolled well past it (or back above it).
    const pad = (i: number) => String(i).padStart(3, '0');
    const dir = () => (mobile ? '-m' : '');
    type Group = { arr: (HTMLImageElement | null)[]; n: number; path: (i: number) => string; r: readonly [number, number]; on: boolean; timers: number[]; keep0?: boolean; delay: number };
    const groups: Group[] = [
      { arr: drive, n: DRIVE, path: (i) => `stacker5${dir()}/${pad(i)}.webp`, r: [0, T.turn[0]], on: false, timers: [], delay: 0 },
      { arr: turn, n: FRAMES, path: (i) => `turn${dir()}/${pad(i)}.webp`, r: [T.turn[0], T.truckIn[0]], on: false, timers: [], keep0: true, delay: 300 },
      { arr: riseCut, n: FRAMES, path: (i) => `truck${dir()}/${pad(i)}.webp`, r: [T.truckIn[0], T.rise[1]], on: false, timers: [], delay: 300 },
      { arr: ship, n: SHIP, path: (i) => `ship7${dir()}/${pad(i)}.webp`, r: [T.hand[0], 1], on: false, timers: [], delay: 300 },
    ];
    const coarseToFine = (n: number) => {
      const o: number[] = [];
      for (let st = 4; st >= 1; st = st >> 1) for (let i = 0; i < n; i += st) if (!o.includes(i)) o.push(i);
      return o;
    };
    const loadGroup = (gr: Group) => {
      gr.on = true;
      coarseToFine(gr.n).forEach((i, k) => {
        if (gr.arr[i]) return;
        gr.timers.push(window.setTimeout(() => (gr.arr[i] = img(V(gr.path(i)))), gr.delay + k * 10));
      });
    };
    const dropGroup = (gr: Group) => {
      gr.on = false;
      gr.timers.forEach(clearTimeout);
      gr.timers = [];
      for (let i = 0; i < gr.n; i++) {
        if (gr.keep0 && i === 0) continue;
        const im = gr.arr[i];
        if (im) {
          im.onload = null;
          im.src = '';
        }
        gr.arr[i] = null;
      }
    };
    const manageFrames = () => {
      if (!loading) return;
      for (const gr of groups) {
        const want = gr.r[1] >= p - 0.04 && gr.r[0] <= p + 0.1;
        if (want && !gr.on) loadGroup(gr);
        else if (!want && gr.on) dropGroup(gr);
      }
    };
    const startLoading = () => {
      if (loading) return;
      loading = true;
      for (const n of ['fk-head', 'fk-box', 'fk-low2', 'truck-e', 'truck-top-cab', 'truck-top-box']) one[n] = img(V(`${n}.webp`));
      turn[0] = img(V(`turn${dir()}/000.webp`)); // stand-in while the drive-in frames arrive
      manageFrames();
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

    // between two frames the next one is enlarged to exactly where the camera would be, so the pull-back moves
    // continuously however slowly you scroll; at the start of each step the previous frame (lined up with it)
    // fades out quickly, so there's no jump and no doubled image
    const shipScale = (k: number) => SHIP_SCALE[Math.max(0, Math.min(SHIP_SCALE.length - 1, k))];
    const shipView = (posF: number, rx: number, ry: number, rw: number, rh: number) => {
      const at = (im: HTMLImageElement, k: number): ShipLayer => {
        const w = rw * k;
        const h = rh * k;
        return { img: im, rect: [rx + (rw - w) / 2, ry + (rh - h) / 2, w, h] };
      };
      const i = Math.max(0, Math.min(SHIP - 1, Math.floor(posF)));
      const f = posF - i;
      const A = i + 1 < SHIP && ready(ship[i + 1]) ? ship[i + 1] : null;
      const B = ready(ship[i]) ? ship[i] : null;
      if (!A || f < 1e-4) {
        const im = B ?? frame(ship, i, 0, SHIP - 1);
        return im ? { a: at(im, 1), b: null, mixB: 0, halfW: 0.265 * shipScale(i) * (mobile ? 1920 / 540 : 1) } : null;
      }
      const sNow = Math.exp(lerp(Math.log(shipScale(i)), Math.log(shipScale(i + 1)), f));
      const fo = clamp(f / 0.35);
      const mixB = B ? 1 - fo * fo * (3 - 2 * fo) : 0;
      return { a: at(A, sNow / shipScale(i + 1)), b: B ? at(B, sNow / shipScale(i)) : null, mixB, halfW: 0.265 * shipScale(i + 1) * (mobile ? 1920 / 540 : 1) };
    };

    const size = () => {
      vw = window.innerWidth;
      // the stage is the full (toolbar-hidden) screen height on phones, so it never leaves a strip at the bottom
      vh = canvas.parentElement?.clientHeight || window.innerHeight;
      mobile = vw < 768;
      // render a little under the screen's full sharpness: far less to draw each frame, barely visible
      dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.25);
      // only reallocate a canvas when its size really changes (phone toolbars fire resize while scrolling)
      const fit = (cv: HTMLCanvasElement, k: number) => {
        const w = Math.round(vw * k);
        const h = Math.round(vh * k);
        if (cv.width !== w) cv.width = w;
        if (cv.height !== h) cv.height = h;
      };
      fit(canvas, dpr);
      if (sea) {
        gdpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.35 : 1) * seaRes;
        fit(sea.canvas, gdpr);
      }
      if (skyCv) {
        sdpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1);
        fit(skyCv, sdpr);
      }
      update();
    };

    // ---------- the live ship shot: plays on its own so the water keeps moving when you stop scrolling ----------
    let productOpen = false;
    const onProduct = (e: Event) => {
      productOpen = !!(e as CustomEvent<boolean>).detail;
      onScroll();
    };
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
      manageFrames();

      g!.setTransform(dpr, 0, 0, dpr, 0, 0);
      g!.clearRect(0, 0, vw, vh);

      // camera for the stage scenes
      const K1 = mobile ? (vw * 1.3) / 1280 : Math.min((vw * 0.74) / 1280, (vh * 0.63) / 720);
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
      // (the clip's widened left side is plain page white, so its edge never shows even when on screen)
      const stackX = 1205 - (vw / 2 - Math.max(150, vw * 0.09)) / Kd;
      const startX = mobile ? 640 : lerp(stackX, 640, settle);
      const sx0 = lerp(startX, TRUCK_C.x, shrink);
      const sy0 = lerp(GROUND1, TRUCK_C.y, shrink);
      const ay = lerp(vh * (mobile ? 0.66 : 0.73), vh * (mobile ? 0.2 : 0.25), shrink);
      const OX = vw / 2 - sx0 * K;
      const OY = ay - sy0 * K;
      const toY = (y: number) => OY + y * K;
      const R_ = (b: { x: number; y: number; w: number; h: number }) => [OX + b.x * K, OY + b.y * K, b.w * K, b.h * K] as const;
      const FULL = { x: 0, y: 0, w: 1280, h: 720 };

      const truckIn = easeOut(seg(p, T.truckIn));
      const groundStage = lerp(GROUND1, GROUND2, truckIn);
      // 5. the truck drives on and out of the right of the screen (stage units), into the fog
      const exitT = seg(p, T.rise);
      const exitX = exitT * exitT * (vw / K + 900);
      const travelled = (p - T.release[1]) * vw * 9.88;

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
        // the forklift's tyres end at stage y 677: the ground line sits right there so it never floats
        const top = toY(groundStage + lerp(-1.5, 2, truckIn));
        const bottom = vh;
        g!.fillStyle = ROAD;
        g!.fillRect(0, top, vw, Math.max(0, bottom - top));
        // the road under the wheels: dashes on the strip while the truck drives, then on the road band
        if (p > T.release[1]) dashes(top + 70 * K, K, travelled, 0.5 * win(p, T.release[1], T.rise[1], 0.08));
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
        } else {
          // 3. the stacker raises the container, the truck drives in under it on the same ground line,
          //    the container is lowered onto the trailer, the spreader lets go and lifts; 4. the truck
          //    drives off and the stacker is left behind. Nothing fades: every part is moved.
          const lift = ease(seg(p, T.lift));
          const low = easeIO(seg(p, T.lower));
          const swap = ease(seg(p, T.swap));
          const rel = ease(seg(p, T.release));
          const leave = easeIO(seg(p, [T.release[1] - 0.006, T.release[1] + 0.055]));
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
            drawImg(one['fk-low2'], OX + (380 + fx) * K, OY + 566 * K, 520 * K, 146 * K);
            const colTop = OY + (299 + headDy) * K;
            const colBot = OY + 578 * K;
            if (colBot > colTop) {
              // a telescopic steel mast: a wide outer sleeve on the chassis, and a lighter inner section that
              // slides up out of it as the container is lifted
              const steel = (x0: number, x1: number, c0: string, c1: string, hi: string) => {
                const gr = g!.createLinearGradient(OX + (x0 + fx) * K, 0, OX + (x1 + fx) * K, 0);
                gr.addColorStop(0, c0);
                gr.addColorStop(0.22, c1);
                gr.addColorStop(0.42, hi);
                gr.addColorStop(0.6, c1);
                gr.addColorStop(1, c0);
                return gr;
              };
              const sleeveTop = Math.max(colTop, colBot - 70 * K);
              // inner section (behind the sleeve's top edge)
              g!.fillStyle = steel(590, 690, '#2a2f36', '#4f5660', '#7d858f');
              g!.fillRect(OX + (590 + fx) * K, colTop, 100 * K, colBot - colTop);
              // two guide rails down the inner section
              g!.fillStyle = 'rgba(15,18,22,0.55)';
              g!.fillRect(OX + (606 + fx) * K, colTop, 4 * K, colBot - colTop);
              g!.fillRect(OX + (670 + fx) * K, colTop, 4 * K, colBot - colTop);
              // outer sleeve with a collar at its top
              g!.fillStyle = steel(570, 710, '#15181d', '#30353d', '#4a515a');
              g!.fillRect(OX + (570 + fx) * K, sleeveTop, 140 * K, colBot - sleeveTop);
              g!.fillStyle = '#0f1216';
              g!.fillRect(OX + (566 + fx) * K, sleeveTop, 148 * K, 7 * K);
            }
            // the truck (empty, then the identical loaded frame once the box is down)
            const tx = (1 - easeOut(seg(p, T.truckIn))) * 1700 + exitX;
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
        }
      }

      // ===================== 6. the road, top-down =====================
      // where the ship's light grey container column sits on screen (the ship frame is drawn to cover)
      const sc = mobile ? SHIP_COL.m : SHIP_COL.d;
      const sCover = Math.max((vw * 1.06) / sc.fw, vh / sc.fh); // a little overscan so sliding it sideways never shows an edge
      const sDW = sc.fw * sCover;
      const sDH = sc.fh * sCover;
      const colX = (vw - sDW) / 2 + sc.cx * sDW;
      // the ship sits under the train's cloud from the moment the cloud starts to clear
      const edge = p >= T.hand[0] ? 0 : vh;

      // ===================== 7. the ship: the page slides up onto the deck, then the camera pulls back =====================
      const shipOn = p >= T.hand[0] && rect.bottom > 0;
      set($('shipScene'), { display: shipOn ? '' : 'none', top: `${Math.max(0, edge).toFixed(1)}px` });
      // the clip only moves when you scroll: it plays through the pull-back and on under the clouds until the plane
      const pos = Math.min(SHIP - 1, seg(p, [T.ship[0], 1]) * (SHIP - 1));
      if (shipOn) {
        if (!(sea && sea.ok)) {
          g!.fillStyle = '#0b2a45';
          g!.fillRect(0, edge, vw, vh - edge);
        }
        // the road stays put: the ship is slid sideways so its container column sits under the truck,
        // then drifts back to centre as the camera pulls back
        const dxS = (vw / 2 - colX) * (1 - easeIO(clamp(pos / (SHIP_CU * 0.35))));
        const x = (vw - sDW) / 2 + dxS;
        const y = edge + (vh - sDH) / 2;
        {
          // the ship only fills the screen below the page's edge (the frame is taller than the window on wide screens)
          g!.save();
          g!.beginPath();
          g!.rect(0, Math.max(0, edge), vw, vh);
          g!.clip();
          if (sea && sea.ok && ready(ship[0])) {
            // the WebGL layer draws it (water moving, smooth between frames); the plain canvas only keeps the sea colour
            seaState.on = true;
            seaState.target = pos;
            seaState.rect = [x, y, sDW, sDH];
            seaState.edge = Math.max(0, edge);
          } else {
            // no WebGL: the same in-between frames, drawn directly
            const v = shipView(pos, x, y, sDW, sDH);
            if (v) {
              g!.drawImage(v.a.img, ...v.a.rect);
              if (v.b && v.mixB > 0.001) {
                g!.globalAlpha = v.mixB;
                g!.drawImage(v.b.img, ...v.b.rect);
                g!.globalAlpha = 1;
              }
            }
          }
          g!.restore();
        }
      }
      if (!shipOn) {
        seaState.on = false;
        seaState.posS = -1;
      }
      if (sea) set(sea.canvas, { display: seaState.on ? '' : 'none' });
      set($('shipTint'), { opacity: seaState.on ? '0' : '1' });
      // ===================== 8. sky: clouds and a plane =====================
      // the sea scene moves onto a fixed layer that sits over the next section; clouds drift in over part of
      // the sea, then the plane flies across and wipes the whole scene away right behind its wings, uncovering
      // the next section as it goes (like the reference: no white screen in between)
      const skyA = T.sky[0] * span;
      const skyB = span + vh * 0.95;
      const u = clamp((-rect.top - skyA) / (skyB - skyA));
      const skyOn = -rect.top > skyA - 10 && -rect.top < skyB;
      set($('sky'), { display: skyOn ? '' : 'none' });
      if (!skyOn) skyState.on = false;
      if (!skyOn) {
        set($('shipScene'), { visibility: '' });
        if (sea) set(sea.canvas, { visibility: '' });
      }
      if (!nextInner) nextInner = document.querySelector<HTMLElement>('#catalogue > .container-x');
      if (!skyOn) set(nextInner, { opacity: '', transform: '' });
      set($('planeLayer'), { opacity: productOpen ? '0' : '1', display: skyOn ? '' : 'none' });
      if (skyOn && sg) {
        // the same frame of the clip, full screen, on the fixed layer
        skyState.on = true;
        skyState.u = u;
        skyState.img = frame(ship, Math.round(pos), 0, SHIP - 1);
        skyState.rect = [(vw - sDW) / 2, (vh - sDH) / 2, sDW, sDH];
        // more cloud drifts in from the sides, leaving the middle of the sea open
        const drift = easeIO(clamp(u / 0.4));
        set($('cloudA'), { transform: `translate3d(${lerp(-100, mobile ? -30 : -42, drift).toFixed(2)}%,${(-3 * u).toFixed(2)}%,0) scale(1.3)`, opacity: (0.92 * Math.min(1, u * 6)).toFixed(3) });
        set($('cloudB'), { transform: `translate3d(${lerp(100, mobile ? 30 : 42, drift).toFixed(2)}%,${(3 * u).toFixed(2)}%,0) scale(1.3) scaleX(-1)`, opacity: (0.92 * Math.min(1, u * 6)).toFixed(3) });
        // the plane: big, nose first, lingering a little through the middle
        // timed so the wipe is 70% done just as the next section reaches the top of the screen,
        // which is when its content fades in (heading and all)
        const pwM = vw * 1.3 * (1369 / 1087);
        const pwD = vh * 1.55 * (1369 / 1087);
        const t70 = mobile
          ? (vh + pwM / 2 + 40 - 0.3 * vh + 0.04 * pwM) / (vh + pwM + 80)
          : (0.7 * vw - 0.46 * pwD + pwD + 40) / (vw + pwD + 80);
        const uTop = (span - skyA) / (skyB - skyA);
        const u0 = Math.max(0.15, (uTop - t70) / (1 - t70));
        const t = clamp((u - u0) / (1 - u0));
        const glide = t; // a steady pass, so the wipe moves at an even pace
        // the plane image carries its own soft shadow, with a margin round it (no live filters: they made it lag)
        const PK = (1370 + 220) / 1370;
        const PH = (1088 + 220) / 1370;
        let wipeOn: boolean;
        let wiped = 0;
        if (mobile) {
          // phones: the plane climbs up the screen nose first, wings past both sides, and wipes upwards
          const span2 = vw * 1.3; // wingspan
          const pw = span2 * (1369 / 1087); // nose to tail
          const cy = lerp(vh + pw / 2 + 40, -pw / 2 - 40, glide);
          set($('plane'), { width: `${(pw * PK).toFixed(0)}px`, top: '0px', transform: `translate3d(${(vw / 2 - (pw * PK) / 2).toFixed(1)}px,${(cy - (pw * PH) / 2).toFixed(1)}px,0) rotate(-90deg)` });
          // everything behind the wings is already the next section: the cut follows the swept-back
          // trailing edges (a chevron), so it stays hidden under the wings all the way out
          const wipe = cy - pw * 0.03;
          const side = wipe + (vw / 2) * 0.42;
          wipeOn = Math.min(wipe, side) < vh + 10;
          wiped = 1 - wipe / vh;
          const cp = wipeOn ? `polygon(0 0, ${vw}px 0, ${vw}px ${side.toFixed(1)}px, ${(vw / 2).toFixed(1)}px ${wipe.toFixed(1)}px, 0 ${side.toFixed(1)}px)` : 'none';
          set($('sky'), { clipPath: cp, WebkitClipPath: cp } as Partial<CSSStyleDeclaration>);
        } else {
          const span2 = vh * 1.55; // wingspan
          const pw = span2 * (1369 / 1087);
          const px = lerp(-pw - 40, vw + 40, glide);
          set($('plane'), { width: `${(pw * PK).toFixed(0)}px`, top: '50%', transform: `translate3d(${(px - (pw * 110) / 1370).toFixed(1)}px,-50%,0)` });
          // everything behind the wings is already the next section: the cut follows the swept-back
          // trailing edges (a chevron), so no sea shows between the wings and the uncovered page
          const wipe = px + pw * 0.53;
          const side = wipe - (vh / 2) * 0.42;
          wipeOn = Math.max(wipe, side) > -10;
          wiped = wipe / vw;
          const cp = wipeOn
            ? `polygon(${side.toFixed(1)}px 0, ${vw}px 0, ${vw}px ${vh}px, ${side.toFixed(1)}px ${vh}px, ${wipe.toFixed(1)}px ${(vh / 2).toFixed(1)}px)`
            : 'none';
          set($('sky'), { clipPath: cp, WebkitClipPath: cp } as Partial<CSSStyleDeclaration>);
        }
        // under the wiped part the page is plain paper until the next section's own background reaches the top
        // a bank of cloud rises from the bottom over the sea that's still showing beside the plane, so the
        // last of the sea is covered in cloud by the time the plane leaves
        const rise = ease(clamp((wiped - 0.25) / 0.65));
        set($('riseCloud'), { display: rise > 0 ? '' : 'none', transform: `translate3d(0,${lerp(vh + 20, -0.75 * vh, rise).toFixed(1)}px,0)` });
        // the next section's content waits until the plane has wiped about 70% of the way, then comes in
        const nx = clamp((wiped - 0.62) / 0.16);
        set(nextInner, { opacity: nx.toFixed(3), transform: `translate3d(0,${((1 - nx) * 30).toFixed(1)}px,0)` });
        if (wipeOn) {
          g!.fillStyle = PAPER;
          g!.fillRect(0, 0, vw, vh);
        }
        // and the ship's veil and moving-water layer stay out of the uncovered part
        set($('shipScene'), { visibility: wipeOn ? 'hidden' : '' });
        if (sea) set(sea.canvas, { visibility: wipeOn ? 'hidden' : '' });
      }
      // keep easing the blur back to sharp after the scrolling stops

      // draw the sea now (in step with the scroll), and keep it moving while it's on screen
      if (seaState.on) {
        renderSea(performance.now());
        if (!seaRaf) seaRaf = requestAnimationFrame(seaTick);
      }
      paintSky();

      // ===================== copy =====================
      // fades as the stacker reaches the stack (end of its run across the page)
      const reach = lerp(T.driveIn[0], T.driveIn[1], 0.55);
      const c0 = clamp((reach + 0.006 - p) / 0.022);
      show('copy0', c0, { transform: `translate3d(0,${((1 - c0) * 16).toFixed(1)}px,0)` });
      show('panelCopy', win(p, T.shrink[0] + 0.015, T.rise[1] + 0.01, 0.12));
      const row = $('row');
      if (row) row.style.transform = `translate3d(${lerp(vw * 0.25, -Math.max(0, row.scrollWidth - vw * 0.7), seg(p, T.services)).toFixed(1)}px,0,0)`;
      rowRefs.current.forEach((li, i) => {
        if (li) li.style.opacity = String(ease(clamp((p - T.services[0] - i * 0.008) / 0.03)));
      });
      // ===================== 5-6. fog, the train, fog again =====================
      const trT = seg(p, T.road);
      const fogV =
        p < T.road[0] ? ease(clamp((exitT - 0.3) / 0.7)) : p < T.hand[0] ? Math.max(1 - ease(clamp(trT / 0.14)), ease(clamp((trT - 0.84) / 0.16))) : 1 - ease(seg(p, T.hand));
      show('fog', fogV, { transform: `translate3d(${(-4 * (exitT + trT + seg(p, T.hand))).toFixed(2)}%,0,0) scale(1.15)` });
      const trainOn = p >= T.road[0] - 0.005 && p < T.hand[0];
      show('train', trainOn ? 1 : 0);
      const tv = trainRef.current;
      if (tv) {
        if (trainOn) {
          if (!tv.src) {
            tv.src = '/story/train/train-loop.mp4';
            tv.load();
          }
          if (tv.paused) tv.play().catch(() => {});
        } else if (!tv.paused) tv.pause();
      }
      // the entrance plays once the fog has mostly cleared, and again if you come back to it
      $('trainStage')?.classList.toggle('go', trainOn && trT > 0.07);

      const c2 = lerp(T.ship[0], T.ship[1], 0.12);
      show('copy2', win(p, c2, lerp(T.ship[0], T.ship[1], 0.93), 0.12));
      valueRefs.current.forEach((li, i) => {
        if (!li) return;
        const t = ease(clamp((p - c2 - 0.012 - i * 0.005) / 0.008));
        li.style.opacity = String(t);
        li.style.transform = `translate3d(${((1 - t) * (i % 2 ? 24 : -24)).toFixed(1)}px,0,0)`;
      });

      // speed while the truck is moving
      let kmh = 0;
      if (p > T.release[1] && p < T.rise[1]) kmh = 64 * easeOut(seg(p, [T.release[1], T.shrink[1]]));
      const spd = $('kmh');
      if (spd) spd.textContent = String(Math.max(0, Math.round(kmh))).padStart(2, '0');
      show('speed', win(p, T.release[1], T.rise[0] + (T.rise[1] - T.rise[0]) * 0.6, 0.06));
    }

    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }

    size();
    const ro = new ResizeObserver(size);
    ro.observe(section);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', size);
    window.addEventListener('ags:product-open', onProduct);
    let early = 0;
    // after the globe's opening animation (or straight away if you scroll down towards the story)
    const kick = () => (early = window.setTimeout(startLoading, 4800));
    if (document.readyState === 'complete') kick();
    else window.addEventListener('load', kick, { once: true });
    return () => {
      clearTimeout(early);
      window.removeEventListener('ags:product-open', onProduct);
      window.removeEventListener('load', kick);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(seaRaf);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', size);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={sectionRef} id="services" aria-label="Our services" className="relative h-[1695vh] scroll-mt-24 bg-[#fbfbfb] md:h-[2070vh]">
      <div className="sticky top-0 h-[100lvh] overflow-hidden">
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <canvas ref={seaRef} aria-hidden="true" className="absolute inset-0 h-full w-full" style={{ display: 'none' }} />

        {/* 7. the ship at sea */}
        <div ref={r('shipScene')} aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden" style={{ display: 'none', top: '100%' }}>
          {/* darken the whole scene a little, plus a vignette */}
          <div ref={r('shipTint')} className="absolute inset-0">
            <div className="absolute inset-0 bg-[#020a14]/40" />
          </div>
        </div>

        {/* 4. the black panel under the truck */}
        <div ref={r('panel')} className="absolute inset-x-0 z-[2] overflow-hidden" style={{ top: '100%' }}>
          {/* 1. intro, in white on the black ground strip */}
          <div ref={r('copy0')} className="container-x absolute inset-x-0 top-0 grid gap-x-12 gap-y-3 pt-6 text-white sm:pt-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="eyebrow eyebrow-light">Our services</p>
              <h2 className="mt-3 text-[28px] font-medium leading-[1.04] sm:text-[38px] lg:text-[44px]">Every order, packed and on its way.</h2>
            </div>
            <p className="max-w-md text-[15px] leading-[1.6] text-white/70 sm:text-[16px] lg:col-span-5 lg:pb-1">
              From the supplier&apos;s door to yours, we handle each step and keep you posted along the way.
            </p>
          </div>
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

        {/* 6. the train: looping clip, headline and two points set either side of the train */}
        <div ref={r('train')} aria-hidden="true" className="trh pointer-events-none absolute inset-0 z-[3] bg-[#0a0b0c]" style={{ opacity: 0, visibility: 'hidden' }}>
          <video
            ref={trainRef}
            muted
            loop
            playsInline
            preload="none"
            disablePictureInPicture
            poster="/story/train/train-loop.jpg"
            aria-label="Aerial view of a container freight train crossing black coal terrain"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="trh-tint" />
          <main ref={r('trainStage')} className="trh-stage">
            <p className="trh-eyebrow">
              <span>From factory to door</span>
            </p>
            <h3 className="trh-headline">
              <span className="hl1">One team</span>
              <span className="hl2">for every</span>
              <span className="hl3">mile of the</span>
              <span className="hl4">journey.</span>
            </h3>
            <svg className="trh-mark" viewBox="0 0 52 52" fill="none" aria-hidden="true">
              <circle cx="26" cy="26" r="23" stroke="currentColor" strokeWidth="1.6" strokeDasharray="98.3 46.3" transform="rotate(2.5 26 26)" />
              <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="26.5" cy="26.1" r="2.3" />
                <path d="M28.9 27.6C31.6 29 32.9 31.2 31.8 33.3 30.7 35.4 27.2 36.1 24.2 35.1" />
              </g>
            </svg>
            <section className="trh-feature trh-left">
              <svg className="trh-icon" viewBox="0 0 35 34" fill="none" aria-hidden="true">
                <defs>
                  <clipPath id="trh-gclip">
                    <circle cx="17.5" cy="17" r="9.8" />
                  </clipPath>
                </defs>
                <circle cx="17.5" cy="17" r="16.5" stroke="#F9F9F9" strokeWidth="1.9" strokeDasharray="3.6 3" />
                <circle cx="17.5" cy="17" r="9.8" fill="#F9F9F9" />
                <path d="M11.9 7.2V26.8M17.5 7.2V26.8M23.1 7.2V26.8M7.7 11.4H27.3M7.7 17H27.3M7.7 22.6H27.3" stroke="#101215" strokeWidth="0.9" clipPath="url(#trh-gclip)" />
              </svg>
              <h4>
                <span>Sourced</span>
                <span>worldwide</span>
              </h4>
              <p>
                <span>Verified suppliers across Asia, Europe</span>
                <span>and beyond, matched to your product</span>
                <span>and quantity.</span>
              </p>
            </section>
            <section className="trh-feature trh-right">
              <svg className="trh-icon" viewBox="0 0 35 38" fill="none" aria-hidden="true">
                <rect x="0.5" y="0.5" width="17" height="9.6" rx="0.5" fill="#F9F9F9" />
                <rect x="10.5" y="13.5" width="13.5" height="10.9" rx="0.5" fill="#F9F9F9" />
                <rect x="17.5" y="28.3" width="17" height="9.7" rx="0.5" fill="#F9F9F9" />
                <g fill="#101215">
                  {[2.5, 6.5].flatMap((y) => [2.5, 5.6, 8.7, 11.8, 14.9].map((x) => <rect key={`a${x}${y}`} x={x} y={y} width="1.1" height="1.9" />))}
                  {[15.2, 20.4].flatMap((y) => [12.5, 15.6, 18.7, 21.8].map((x) => <rect key={`b${x}${y}`} x={x} y={y} width="1.1" height="1.9" />))}
                  {[30.3, 34.4].flatMap((y) => [19.5, 22.6, 25.7, 28.8, 31.9].map((x) => <rect key={`c${x}${y}`} x={x} y={y} width="1.1" height="1.9" />))}
                </g>
              </svg>
              <h4>
                <span>Shipped and</span>
                <span>tracked</span>
              </h4>
              <p>
                <span>Sea freight or courier with trusted</span>
                <span>partners, and tracking shared with</span>
                <span>you until delivery.</span>
              </p>
            </section>
          </main>
        </div>

        {/* 5-6. fog the truck drives into, and the train comes out of */}
        <div ref={r('fog')} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[4] will-change-transform" style={{ opacity: 0, visibility: 'hidden' }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#ffffff_0%,#f3f5f8_55%,#e6eaf0_100%)]" />
          <img src={V('cloud-1.webp')} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
          <img src={V('cloud-2.webp')} alt="" className="absolute inset-0 h-full w-full -scale-x-100 object-cover opacity-60" />
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
      <div ref={r('sky')} aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[30] h-[100lvh] overflow-hidden" style={{ display: 'none' }}>
        <canvas ref={skyRef} className="absolute inset-0 h-full w-full" />
        <img ref={r('cloudA')} src={V('cloud-1.webp')} alt="" className="absolute inset-0 h-full w-full object-cover opacity-0 will-change-transform" style={{ WebkitMaskImage: SIDE_MASK, maskImage: SIDE_MASK }} />
        <div
          ref={r('riseCloud')}
          className="absolute inset-x-0 top-0 h-[180%] will-change-transform"
          style={{ display: 'none', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 10%, #000 30%)', maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 10%, #000 30%)' }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(240,244,249,0.55)_0%,#f2f5f9_28%,#ffffff_45%)]" />
          <img src={V('cloud-2.webp')} alt="" className="absolute inset-x-0 top-0 h-1/2 w-full object-cover opacity-90" style={{ WebkitMaskImage: 'linear-gradient(to bottom, #000 45%, transparent 95%)', maskImage: 'linear-gradient(to bottom, #000 45%, transparent 95%)' }} />
          <img src={V('cloud-1.webp')} alt="" className="absolute inset-x-0 top-[8%] h-1/2 w-full -scale-x-100 object-cover opacity-70" style={{ WebkitMaskImage: 'linear-gradient(to bottom, #000 45%, transparent 95%)', maskImage: 'linear-gradient(to bottom, #000 45%, transparent 95%)' }} />
        </div>
        <img ref={r('cloudB')} src={V('cloud-2.webp')} alt="" className="absolute inset-0 h-full w-full object-cover opacity-0 will-change-transform" style={{ WebkitMaskImage: SIDE_MASK, maskImage: SIDE_MASK }} />
      </div>
      {/* the plane flies over everything: the old scene and then the next section */}
      <div ref={r('planeLayer')} aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[31] h-[100lvh] overflow-hidden transition-opacity duration-500" style={{ display: 'none' }}>
        <img
          ref={r('plane')}
          src={V('plane-sh.webp')}
          alt=""
          className="absolute left-0 top-1/2 max-w-none will-change-transform"
          style={{ transform: 'translate3d(-200vw,-50%,0)' }}
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
