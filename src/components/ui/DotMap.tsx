import { useEffect, useRef, type MutableRefObject } from 'react';
import { homeHub, type Hub } from '@/data/globe';
import { getLandMask, isLand } from '@/lib/landMask';
import { subscribeNightTexture, type NightTexture } from '@/lib/nightTexture';

type Theme = 'light' | 'dark' | 'blue' | 'night';

interface DotMapProps {
  className?: string;
  theme?: Theme;
  /** Destinations; an arc is drawn from New Delhi to each one */
  hubs?: Hub[];
  /** Names of the highlighted hubs. Undefined highlights every hub. */
  activeHubs?: string[];
  labels?: 'active' | 'none';
  /** Dots sweep in from the west the first time the map is seen */
  intro?: boolean;
  /** Travelling route lights and pulsing hubs */
  animated?: boolean;
  /** Hover labels and click-to-select on hubs */
  interactive?: boolean;
  onHubSelect?: (hub: Hub) => void;
  /** Target gap between dots in CSS pixels at 1200px width */
  density?: number;
  /** 'width' shows the whole map; 'cover' fills the box (crops) */
  fit?: 'width' | 'cover';
  /** Where New Delhi sits horizontally when cropping, 0-1 */
  focusX?: number;
  label?: string;
  /** Drag to pan, pinch / ctrl+wheel to zoom, and the controls API */
  pannable?: boolean;
  /** Draw map pins instead of dots for the hubs */
  pins?: boolean;
  /** Name of the pinned (selected) hub */
  selectedHub?: string | null;
  controlsRef?: MutableRefObject<DotMapControls | null>;
}

export interface DotMapControls {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  flyTo: (hub: Hub, zoom?: number) => void;
}

interface View {
  k: number;
  tx: number;
  ty: number;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
/** How far past its edges the map may be moved, as a share of the box */
const PAN_SLACK = 0.22;

const LON_MIN = -170;
const LAT_MAX = 80;
const LAT_MIN = -58;
const LON_SPAN = 360;
const LAT_SPAN = LAT_MAX - LAT_MIN;

const PALETTES: Record<Theme, { dot: string; tint: string; arc: string; arcDim: string; comet: string; hub: string; home: string; labelBg: string; labelFg: string }> = {
  light: {
    dot: 'rgba(27,30,36,0.2)',
    tint: '35,64,142',
    arc: 'rgba(35,64,142,0.4)',
    arcDim: 'rgba(27,30,36,0.08)',
    comet: '35,64,142',
    hub: '#23408E',
    home: '#23408E',
    labelBg: '#1B1E24',
    labelFg: '#FFFFFF',
  },
  dark: {
    dot: 'rgba(255,255,255,0.2)',
    tint: '123,143,201',
    arc: 'rgba(184,196,230,0.45)',
    arcDim: 'rgba(255,255,255,0.08)',
    comet: '184,196,230',
    hub: '#B8C4E6',
    home: '#3E5BB0',
    labelBg: '#FFFFFF',
    labelFg: '#1B1E24',
  },
  // night Earth, matching the hero globe: dark textured map, pale-blue land dots, amber routes
  night: {
    dot: 'rgba(78,104,180,0.85)', // until the texture is ready (and during the intro sweep)
    tint: '255,200,130',
    arc: 'rgba(255,214,170,0.6)',
    arcDim: 'rgba(255,255,255,0.07)',
    comet: '255,205,140',
    hub: '#FFD2A0',
    home: '#3E5BB0',
    labelBg: '#0A1640',
    labelFg: '#F3F5FA',
  },
  blue: {
    dot: 'rgba(255,255,255,0.22)',
    tint: '255,255,255',
    arc: 'rgba(255,255,255,0.45)',
    arcDim: 'rgba(255,255,255,0.1)',
    comet: '255,255,255',
    hub: '#FFFFFF',
    home: '#FFFFFF',
    labelBg: '#FFFFFF',
    labelFg: '#23408E',
  },
};

interface Layout {
  w: number;
  h: number;
  scale: number;
  ox: number;
  oy: number;
}

function project(layout: Layout, lon: number, lat: number): [number, number] {
  const l = lon < LON_MIN ? lon + 360 : lon;
  return [layout.ox + (l - LON_MIN) * layout.scale, layout.oy + (LAT_MAX - lat) * layout.scale];
}

/** Quadratic arc from a to b, lifted towards the top of the map. */
function arcControl(a: [number, number], b: [number, number]): [number, number] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dist = Math.hypot(dx, dy);
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - dist * 0.32];
}

function pointOn(a: [number, number], c: [number, number], b: [number, number], t: number): [number, number] {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
}

/** Flat dotted world map with animated trade routes from New Delhi (canvas). */
export default function DotMap({
  className = '',
  theme = 'light',
  hubs = [],
  activeHubs,
  labels = 'active',
  intro = true,
  animated = true,
  interactive = false,
  onHubSelect,
  density = 7,
  fit = 'width',
  focusX = 0.6,
  label = 'World map showing trade routes from New Delhi',
  pannable = false,
  pins = false,
  selectedHub = null,
  controlsRef,
}: DotMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Live props for the render loop, so changing tabs never restarts it
  const live = useRef({ hubs, activeHubs, labels, onHubSelect, theme, selectedHub });
  live.current = { hubs, activeHubs, labels, onHubSelect, theme, selectedHub };
  const redrawRef = useRef<() => void>(() => {});

  useEffect(() => {
    redrawRef.current();
  }, [hubs, activeHubs, labels, theme, selectedHub]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doAnimate = animated && !reduce;
    const mask = getLandMask();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let base: Layout = { w: 0, h: 0, scale: 1, ox: 0, oy: 0 };
    let layout: Layout = base;
    let gap = 7;
    const view: View = { k: 1, tx: 0, ty: 0 };
    let target: View = { k: 1, tx: 0, ty: 0 };
    let pinStart = -1;
    let dots = new Float32Array(0); // x, y, delay
    let dotSizes = new Float32Array(0); // per-dot size factor
    let dotR = 1.5;
    let dotLayer: HTMLCanvasElement | null = null;
    let dotLayerKey = '';
    let introStart = -1;
    let introDone = !intro || reduce;
    let visible = false;
    let raf = 0;
    let hover: Hub | null = null;
    const drawState = new Map<string, number>(); // arc draw-in progress per hub
    let last = performance.now();
    let tex: NightTexture | null = null;
    const unsubTex = live.current.theme === 'night'
      ? subscribeNightTexture((t) => { tex = t; if (base.w > 0) applyView(); kick(); }, { lonMin: LON_MIN, latMax: LAT_MAX, lonSpan: LON_SPAN, latSpan: LAT_SPAN })
      : () => {};

    const isActive = (hub: Hub) => {
      const set = live.current.activeHubs;
      return !set || set.includes(hub.name);
    };

    function build() {
      const rect = canvas!.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      // 'width' shows the whole world; 'cover' fills the box and keeps New Delhi in view
      const sW = w / LON_SPAN;
      const s = fit === 'cover' ? Math.max(sW, h / LAT_SPAN) : sW;
      let ox = (w - LON_SPAN * s) / 2;
      if (fit === 'cover' && LON_SPAN * s > w) {
        const hx = (homeHub.lon - LON_MIN) * s;
        ox = Math.min(0, Math.max(w - LON_SPAN * s, w * focusX - hx));
      }
      base = { w, h, scale: s, ox, oy: (h - LAT_SPAN * s) / 2 };
      gap = Math.max(4.2, Math.min(9, (density * w) / 1200));
      Object.assign(view, clampView(view, 0));
      target = clampView(target, 0);
      applyView();
    }

    /** Keeps the map on screen; `slack` lets a drag overshoot a little before springing back. */
    function clampView(v: View, slack: number): View {
      const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.k));
      const s = base.scale * k;
      const fitAxis = (o: number, size: number, box: number) => {
        const lo = size <= box ? (box - size) / 2 - slack * box : box - size - slack * box;
        const hi = size <= box ? (box - size) / 2 + slack * box : slack * box;
        return Math.min(hi, Math.max(lo, o));
      };
      const ox = fitAxis(base.ox * k + v.tx, LON_SPAN * s, base.w);
      const oy = fitAxis(base.oy * k + v.ty, LAT_SPAN * s, base.h);
      return { k, tx: ox - base.ox * k, ty: oy - base.oy * k };
    }

    /** Rebuilds the layout and the visible dot grid for the current pan and zoom. */
    function applyView() {
      const { w, h } = base;
      const s = base.scale * view.k;
      layout = { w, h, scale: s, ox: base.ox * view.k + view.tx, oy: base.oy * view.k + view.ty };

      // Grid density doubles at each zoom level, so the dots stay steady while panning
      const level = Math.pow(2, Math.floor(Math.log2(view.k) + 1e-6));
      const smoothLand = live.current.theme === 'night' && tex ? tex : null;
      const stepDeg = (gap * (smoothLand ? 0.8 : 1)) / base.scale / level;
      dotR = Math.max(1, gap * 0.26 * Math.min(1.5, Math.sqrt(view.k / level)));
      const pad = gap * 2;
      const lonFrom = LON_MIN + (-pad - layout.ox) / s;
      const lonTo = LON_MIN + (w + pad - layout.ox) / s;
      const latFrom = LAT_MAX - (-pad - layout.oy) / s;
      const latTo = LAT_MAX - (h + pad - layout.oy) / s;
      const i0 = Math.max(0, Math.floor((lonFrom - LON_MIN) / stepDeg));
      const i1 = Math.min(Math.ceil(LON_SPAN / stepDeg), Math.ceil((lonTo - LON_MIN) / stepDeg));
      const j0 = Math.max(0, Math.floor((LAT_MAX - latFrom) / stepDeg));
      const j1 = Math.min(Math.ceil(LAT_SPAN / stepDeg), Math.ceil((LAT_MAX - latTo) / stepDeg));
      const list: number[] = [];
      const sizes: number[] = [];
      // night theme: a staggered (hex) grid read from the smooth coastline, with dots tapering at the coast
      const rowStep = smoothLand ? stepDeg * 0.866 : stepDeg;
      const jj0 = Math.floor((j0 * stepDeg) / rowStep), jj1 = Math.ceil((j1 * stepDeg) / rowStep);
      for (let j = jj0; j <= jj1; j++) {
        const lat = LAT_MAX - rowStep / 2 - j * rowStep;
        if (lat <= LAT_MIN) break;
        const shift = smoothLand && j % 2 ? stepDeg / 2 : 0;
        for (let i = i0; i <= i1; i++) {
          const l = LON_MIN + stepDeg / 2 + i * stepDeg + shift;
          if (l >= LON_MIN + LON_SPAN) break;
          const lon = l > 180 ? l - 360 : l;
          let size = 1;
          if (smoothLand) {
            const f = smoothLand.landAt(l - LON_MIN, lat);
            if (f < 0.5) continue;
            size = 0.55 + 0.45 * Math.min(1, (f - 0.5) / 0.22);
          } else if (!isLand(mask, lon, lat)) continue;
          const [x, y] = project(layout, lon, lat);
          const delay = ((l - LON_MIN) / LON_SPAN) * 0.75 + Math.random() * 0.25;
          list.push(x, y, delay);
          sizes.push(size);
        }
      }
      dots = new Float32Array(list);
      dotSizes = new Float32Array(sizes);
      dotLayerKey = '';
    }

    function zoomAt(sx: number, sy: number, k: number) {
      const nk = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));
      const bx = (sx - target.tx) / target.k;
      const by = (sy - target.ty) / target.k;
      target = clampView({ k: nk, tx: sx - bx * nk, ty: sy - by * nk }, 0);
      kick();
    }

    function flyTo(hub: Hub, k = 2.4) {
      const bx = base.ox + (hub.lon - LON_MIN) * base.scale;
      const by = base.oy + (LAT_MAX - hub.lat) * base.scale;
      // On wide screens the info card sits on the right, so park the pin left of centre
      const cx = base.w * (base.w >= 900 ? 0.4 : 0.5);
      target = clampView({ k, tx: cx - bx * k, ty: base.h * (base.w >= 900 ? 0.52 : 0.4) - by * k }, PAN_SLACK);
      kick();
    }

    if (controlsRef) {
      controlsRef.current = {
        zoomIn: () => zoomAt(base.w / 2, base.h / 2, target.k * 1.6),
        zoomOut: () => zoomAt(base.w / 2, base.h / 2, target.k / 1.6),
        reset: () => {
          target = clampView({ k: 1, tx: 0, ty: 0 }, 0);
          kick();
        },
        flyTo,
      };
    }

    function tintFor(x: number, y: number, active: [number, number][]) {
      let best = 0;
      const radius = Math.max(26, layout.w * 0.035);
      for (const [hx, hy] of active) {
        const d = Math.hypot(x - hx, y - hy);
        if (d < radius) best = Math.max(best, 1 - d / radius);
      }
      return best;
    }

    function renderDotLayer() {
      const pal = PALETTES[live.current.theme];
      const activePts = live.current.hubs.filter(isActive).map((hub) => project(layout, hub.lon, hub.lat));
      activePts.push(project(layout, homeHub.lon, homeHub.lat));
      const key = `${layout.w}x${layout.h}|${layout.ox.toFixed(1)},${layout.oy.toFixed(1)},${layout.scale.toFixed(4)}|${live.current.theme}|${tex ? 1 : 0}|${activePts.map((p) => p.join(',')).join(';')}`;
      if (key === dotLayerKey && dotLayer) return;
      dotLayerKey = key;
      dotLayer = dotLayer ?? document.createElement('canvas');
      dotLayer.width = canvas!.width;
      dotLayer.height = canvas!.height;
      const g = dotLayer.getContext('2d')!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, layout.w, layout.h);
      const night = live.current.theme === 'night';
      const r = night ? dotR * 1.12 : dotR;
      g.fillStyle = night && tex ? '#FFFFFF' : pal.dot;
      g.beginPath();
      for (let i = 0; i < dots.length; i += 3) {
        const rr = r * (dotSizes[i / 3] ?? 1);
        g.moveTo(dots[i] + rr, dots[i + 1]);
        g.arc(dots[i], dots[i + 1], rr, 0, Math.PI * 2);
      }
      g.fill();
      if (live.current.theme === 'night' && tex) {
        // night theme: the dots take their colour from the night-Earth texture (blue land, amber city lights)
        g.globalCompositeOperation = 'source-in';
        g.drawImage(tex.base, layout.ox, layout.oy, LON_SPAN * layout.scale, LAT_SPAN * layout.scale);
        // light up the dots around cities in amber, fading outwards
        g.globalCompositeOperation = 'source-atop';
        g.globalAlpha = 0.95;
        g.drawImage(tex.glow, layout.ox, layout.oy, LON_SPAN * layout.scale, LAT_SPAN * layout.scale);
        g.drawImage(tex.glow, layout.ox, layout.oy, LON_SPAN * layout.scale, LAT_SPAN * layout.scale);
        g.globalAlpha = 1;
        g.globalCompositeOperation = 'source-over';
      }
      for (let i = 0; live.current.theme !== 'night' && i < dots.length; i += 3) {
        const t = tintFor(dots[i], dots[i + 1], activePts);
        if (t <= 0) continue;
        g.fillStyle = `rgba(${pal.tint},${(0.25 + t * 0.65).toFixed(3)})`;
        g.beginPath();
        g.arc(dots[i], dots[i + 1], dotR * (1 + t * 0.35), 0, Math.PI * 2);
        g.fill();
      }
    }

    // Label boxes already placed this frame, so neighbouring ports never overlap
    let placed: { x: number; y: number; w: number; h: number }[] = [];

    function drawLabel(text: string, x: number, y: number, pal: (typeof PALETTES)[Theme], strong = false) {
      ctx!.font = `600 ${layout.w < 640 ? 9 : 11}px "Geist Mono", ui-monospace, monospace`;
      const t = text.toUpperCase();
      const bw = ctx!.measureText(t).width + 14;
      const bh = layout.w < 640 ? 18 : 22;
      const candidates = [
        [x + 10, y - bh - 6],
        [x - 10 - bw, y - bh - 6],
        [x + 10, y + 6],
        [x - 10 - bw, y + 6],
        [x - bw / 2, y - bh - 14],
        [x - bw / 2, y + 12],
      ];
      const fits = ([bx, by]: number[]) =>
        bx >= 2 &&
        bx + bw <= layout.w - 2 &&
        by >= 2 &&
        by + bh <= layout.h - 2 &&
        !placed.some((r) => bx < r.x + r.w + 4 && bx + bw + 4 > r.x && by < r.y + r.h + 3 && by + bh + 3 > r.y);
      const [bx, by] = candidates.find(fits) ?? candidates[0];
      placed.push({ x: bx, y: by, w: bw, h: bh });
      ctx!.fillStyle = strong ? pal.home : pal.labelBg;
      ctx!.beginPath();
      if (typeof ctx!.roundRect === 'function') ctx!.roundRect(bx, by, bw, bh, 3);
      else ctx!.rect(bx, by, bw, bh);
      ctx!.fill();
      ctx!.fillStyle = strong ? (live.current.theme === 'blue' ? '#23408E' : '#FFFFFF') : pal.labelFg;
      ctx!.textBaseline = 'middle';
      ctx!.fillText(t, bx + 7, by + bh / 2 + 0.5);
    }

    function drawPin(x: number, y: number, selected: boolean, hovered: boolean, alpha: number, lift: number, pal: (typeof PALETTES)[Theme], phase: number) {
      if (alpha <= 0) return;
      const R = (layout.w < 640 ? 5.5 : 7) * (selected ? 1.35 : hovered ? 1.15 : 1);
      const tipY = y + lift;
      const cy = tipY - R * 2.1;
      ctx!.globalAlpha = alpha;
      // pulse on the ground
      if (doAnimate) {
        const ph = (phase % 2.2) / 2.2;
        ctx!.strokeStyle = selected ? '#FFFFFF' : pal.hub;
        ctx!.globalAlpha = alpha * 0.5 * (1 - ph);
        ctx!.lineWidth = 1.2;
        ctx!.beginPath();
        ctx!.ellipse(x, y, 3 + ph * 16, (3 + ph * 16) * 0.45, 0, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.globalAlpha = alpha;
      }
      // shadow
      ctx!.fillStyle = 'rgba(0,0,0,0.35)';
      ctx!.beginPath();
      ctx!.ellipse(x, y, R * 0.55, R * 0.2, 0, 0, Math.PI * 2);
      ctx!.fill();
      // body
      ctx!.fillStyle = selected ? '#FFFFFF' : pal.hub;
      ctx!.beginPath();
      ctx!.moveTo(x, tipY);
      ctx!.bezierCurveTo(x - R * 0.35, tipY - R * 0.75, x - R, cy + R * 0.7, x - R, cy);
      ctx!.arc(x, cy, R, Math.PI, 0);
      ctx!.bezierCurveTo(x + R, cy + R * 0.7, x + R * 0.35, tipY - R * 0.75, x, tipY);
      ctx!.fill();
      // eye
      ctx!.fillStyle = selected ? '#23408E' : live.current.theme === 'blue' ? '#23408E' : '#0A1640';
      ctx!.beginPath();
      ctx!.arc(x, cy, R * 0.42, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.globalAlpha = 1;
    }

    function frame(now: number) {
      raf = 0;
      const dt = Math.min(64, now - last);
      last = now;
      let viewMoving = false;
      if (view.k !== target.k || view.tx !== target.tx || view.ty !== target.ty) {
        const f = reduce ? 1 : 1 - Math.exp(-dt / 130);
        view.k += (target.k - view.k) * f;
        view.tx += (target.tx - view.tx) * f;
        view.ty += (target.ty - view.ty) * f;
        if (Math.abs(target.k - view.k) < 0.001 && Math.abs(target.tx - view.tx) < 0.3 && Math.abs(target.ty - view.ty) < 0.3) {
          Object.assign(view, target);
        } else viewMoving = true;
        applyView();
      }
      const pal = PALETTES[live.current.theme];
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, layout.w, layout.h);

      // Night-Earth texture under the dots (same look as the hero globe), with gently pulsing city glow
      if (tex && live.current.theme === 'night') {
        const tw = LON_SPAN * layout.scale, th = LAT_SPAN * layout.scale;
        const tS = now / 1000;
        ctx!.globalCompositeOperation = 'lighter';
        ctx!.globalAlpha = doAnimate ? 0.28 + 0.14 * Math.sin(tS * 0.8) : 0.3;
        ctx!.drawImage(tex.glow, layout.ox, layout.oy, tw, th);
        ctx!.globalAlpha = 1;
        // twinkling city sparks
        if (doAnimate) {
          for (let i = 0; i < tex.sparks.length; i += 2) {
            const ph = Math.sin(tS * (0.7 + (i % 7) * 0.13) + i * 1.7);
            if (ph < 0.6) continue;
            const a = (ph - 0.6) / 0.4;
            const x = layout.ox + tex.sparks[i] * tw, y = layout.oy + tex.sparks[i + 1] * th;
            if (x < -10 || x > layout.w + 10 || y < -10 || y > layout.h + 10) continue;
            const r = 2 + a * 4;
            ctx!.strokeStyle = `rgba(255,220,170,${(a * 0.8).toFixed(3)})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(x - r, y); ctx!.lineTo(x + r, y);
            ctx!.moveTo(x, y - r); ctx!.lineTo(x, y + r);
            ctx!.stroke();
          }
        }
        ctx!.globalCompositeOperation = 'source-over';
      }

      // Dots
      if (!introDone) {
        if (introStart < 0) introStart = now;
        const e = (now - introStart) / 1000;
        ctx!.fillStyle = pal.dot;
        // Batch dots into a few fade levels: one path per level instead of one per dot
        const LEVELS = 6;
        for (let lv = 1; lv <= LEVELS; lv++) {
          const a = lv / LEVELS;
          const r = dotR * (0.4 + 0.6 * a);
          ctx!.globalAlpha = a;
          ctx!.beginPath();
          for (let i = 0; i < dots.length; i += 3) {
            const t = Math.min(1, Math.max(0, (e - dots[i + 2] * 1.1) / 0.35));
            if (t <= 0 || Math.ceil(t * LEVELS) !== lv) continue;
            ctx!.moveTo(dots[i] + r, dots[i + 1]);
            ctx!.arc(dots[i], dots[i + 1], r, 0, Math.PI * 2);
          }
          ctx!.fill();
        }
        ctx!.globalAlpha = 1;
        if (e > 1.5) introDone = true;
      } else {
        renderDotLayer();
        if (dotLayer) {
          ctx!.setTransform(1, 0, 0, 1, 0, 0);
          ctx!.drawImage(dotLayer, 0, 0);
          ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
      }

      const home = project(layout, homeHub.lon, homeHub.lat);
      const routeAlpha = introDone ? 1 : 0;
      const tSec = now / 1000;
      const lw = layout.w < 640 ? 1.1 : 1.6;

      // Arcs
      live.current.hubs.forEach((hub, index) => {
        const active = isActive(hub) || hover === hub;
        const prev = drawState.get(hub.name) ?? 0;
        const target = active && routeAlpha ? 1 : 0;
        const next = doAnimate ? prev + Math.sign(target - prev) * Math.min(Math.abs(target - prev), dt / 900) : target;
        drawState.set(hub.name, next);
        const p = project(layout, hub.lon, hub.lat);
        const c = arcControl(home, p);

        // faint full route
        if (routeAlpha) {
          ctx!.strokeStyle = pal.arcDim;
          ctx!.lineWidth = lw;
          ctx!.beginPath();
          ctx!.moveTo(home[0], home[1]);
          ctx!.quadraticCurveTo(c[0], c[1], p[0], p[1]);
          ctx!.stroke();
        }
        // drawn-in highlighted route
        if (next > 0.001) {
          ctx!.strokeStyle = pal.arc;
          ctx!.lineWidth = lw;
          ctx!.beginPath();
          const steps = 48;
          for (let s = 0; s <= steps * next; s++) {
            const [x, y] = pointOn(home, c, p, s / steps);
            if (s === 0) ctx!.moveTo(x, y);
            else ctx!.lineTo(x, y);
          }
          ctx!.stroke();
        }
        // travelling light
        if (doAnimate && next > 0.98) {
          const head = (tSec / (2.6 + (index % 3) * 0.5) + index * 0.37) % 1;
          for (let k = 0; k < 16; k++) {
            const t = head - k * 0.012;
            if (t < 0) break;
            const [x, y] = pointOn(home, c, p, t);
            ctx!.fillStyle = `rgba(${pal.comet},${(1 - k / 16).toFixed(3)})`;
            ctx!.beginPath();
            ctx!.arc(x, y, (lw + 1.4) * (1 - k / 20), 0, Math.PI * 2);
            ctx!.fill();
          }
        }
      });

      // Hubs
      if (pins && routeAlpha && pinStart < 0) pinStart = now;
      const pinAge = pins ? (now - pinStart) / 1000 : 0;
      live.current.hubs.forEach((hub, index) => {
        if (!routeAlpha) return;
        if (pins) {
          const [x, y] = project(layout, hub.lon, hub.lat);
          if (x < -40 || x > layout.w + 40 || y < -10 || y > layout.h + 60) return;
          const selected = live.current.selectedHub === hub.name;
          // staggered drop-in with a small bounce
          const d = Math.min(1, Math.max(0, (pinAge - index * 0.08) / 0.55));
          const drop = reduce ? 1 : 1 + 2.4 * Math.pow(d - 1, 3) + 1.4 * Math.pow(d - 1, 2);
          drawPin(x, y, selected, hover === hub, d, (1 - drop) * -26, pal, tSec + index * 0.3);
          return;
        }
        const [x, y] = project(layout, hub.lon, hub.lat);
        const active = isActive(hub) || hover === hub;
        if (active && doAnimate) {
          const ph = ((tSec + index * 0.3) % 2.2) / 2.2;
          ctx!.strokeStyle = pal.hub;
          ctx!.globalAlpha = 0.55 * (1 - ph);
          ctx!.lineWidth = 1.2;
          ctx!.beginPath();
          ctx!.arc(x, y, 4 + ph * 16, 0, Math.PI * 2);
          ctx!.stroke();
          ctx!.globalAlpha = 1;
        }
        ctx!.fillStyle = active ? pal.hub : pal.arcDim;
        ctx!.beginPath();
        ctx!.arc(x, y, active ? 4 : 3, 0, Math.PI * 2);
        ctx!.fill();
        if (active) {
          ctx!.fillStyle = live.current.theme === 'light' ? '#fff' : live.current.theme === 'blue' ? '#23408E' : '#1B1E24';
          ctx!.beginPath();
          ctx!.arc(x, y, 1.6, 0, Math.PI * 2);
          ctx!.fill();
        }
      });

      // Home: the "blue square"
      if (routeAlpha || introDone) {
        const size = layout.w < 640 ? 8 : 11;
        if (doAnimate) {
          const ph = (tSec % 2) / 2;
          ctx!.strokeStyle = pal.home;
          ctx!.globalAlpha = 0.6 * (1 - ph);
          ctx!.lineWidth = 1.4;
          const r = size / 2 + ph * 22;
          ctx!.strokeRect(home[0] - r, home[1] - r, r * 2, r * 2);
          ctx!.globalAlpha = 1;
        }
        ctx!.fillStyle = pal.home;
        ctx!.fillRect(home[0] - size / 2, home[1] - size / 2, size, size);
      }

      // Labels
      if (routeAlpha && live.current.labels !== 'none') {
        placed = [];
        drawLabel(homeHub.name, home[0], home[1], pal, true);
        live.current.hubs.forEach((hub) => {
          const show = (live.current.activeHubs ? live.current.activeHubs.includes(hub.name) : false) || hover === hub;
          if (!show) return;
          const [x, y] = project(layout, hub.lon, hub.lat);
          if (x < 0 || x > layout.w || y < 0 || y > layout.h) return;
          const R = layout.w < 640 ? 5.5 : 7;
          drawLabel(hub.name, x, pins ? y - R * 2.1 : y, pal, live.current.selectedHub === hub.name);
        });
      }

      const moving = viewMoving || doAnimate || !introDone || [...drawState.values()].some((v) => v > 0.001 && v < 0.999);
      if (visible && moving && !document.hidden) raf = requestAnimationFrame(frame);
    }

    function kick() {
      if (!raf && visible) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }
    redrawRef.current = kick;

    /** Client coordinates to canvas coordinates (the canvas may be CSS-scaled by the hero dive). */
    function toLocal(clientX: number, clientY: number): [number, number] {
      const rect = canvas!.getBoundingClientRect();
      return [((clientX - rect.left) * layout.w) / rect.width, ((clientY - rect.top) * layout.h) / rect.height];
    }

    function hubAt(clientX: number, clientY: number): Hub | null {
      const [mx, my] = toLocal(clientX, clientY);
      let best: Hub | null = null;
      let bestD = 20;
      const lift = pins ? (layout.w < 640 ? 5.5 : 7) * 2.1 : 0;
      for (const hub of pins ? [...live.current.hubs, homeHub] : live.current.hubs) {
        const [x, y] = project(layout, hub.lon, hub.lat);
        const d = Math.min(Math.hypot(mx - x, my - y), Math.hypot(mx - x, my - (y - lift)));
        if (d < bestD) {
          bestD = d;
          best = hub;
        }
      }
      return best;
    }

    const idleCursor = pannable ? 'grab' : '';
    let drag: { id: number; x: number; y: number; tx: number; ty: number; moved: boolean } | null = null;
    let suppressClick = false;

    const onDown = (event: PointerEvent) => {
      if (!pannable || event.button !== 0) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, tx: view.tx, ty: view.ty, moved: false };
      suppressClick = false;
    };
    const onMove = (event: PointerEvent) => {
      if (drag && event.pointerId === drag.id) {
        const rect = canvas.getBoundingClientRect();
        const r = layout.w / rect.width;
        const dx = (event.clientX - drag.x) * r;
        const dy = (event.clientY - drag.y) * r;
        if (!drag.moved && Math.hypot(dx, dy) > 5) {
          drag.moved = true;
          try {
            canvas.setPointerCapture(event.pointerId);
          } catch {
            /* ignore */
          }
          canvas.style.cursor = 'grabbing';
        }
        if (drag.moved) {
          const next = clampView({ k: view.k, tx: drag.tx + dx, ty: drag.ty + dy }, PAN_SLACK + 0.1);
          Object.assign(view, next);
          target = { ...next };
          applyView();
          kick();
          return;
        }
      }
      const h = hubAt(event.clientX, event.clientY);
      if (h !== hover) {
        hover = h;
        canvas.style.cursor = h ? 'pointer' : idleCursor;
        kick();
      }
    };
    const onUp = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      if (drag.moved) {
        suppressClick = true;
        target = clampView(view, PAN_SLACK); // spring back if dragged too far
        canvas.style.cursor = idleCursor;
        kick();
      }
      drag = null;
    };
    const onLeave = () => {
      hover = null;
      if (!drag) canvas.style.cursor = idleCursor;
      kick();
    };
    const onClick = (event: MouseEvent) => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      const h = hubAt(event.clientX, event.clientY);
      if (h) live.current.onHubSelect?.(h);
    };
    // Trackpad pinch (and ctrl + wheel) zooms; a plain wheel keeps scrolling the page
    const onWheel = (event: WheelEvent) => {
      if (!pannable || !event.ctrlKey) return;
      event.preventDefault();
      const [mx, my] = toLocal(event.clientX, event.clientY);
      zoomAt(mx, my, target.k * Math.exp(-event.deltaY * 0.01));
    };

    build();
    const ro = new ResizeObserver(() => {
      build();
      kick();
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) kick();
      },
      { threshold: 0.05 },
    );
    io.observe(canvas);
    const onVis = () => kick();
    document.addEventListener('visibilitychange', onVis);

    if (interactive || pannable) {
      canvas.style.cursor = idleCursor;
      if (pannable) canvas.style.touchAction = 'pan-y';
      canvas.addEventListener('pointerdown', onDown);
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerup', onUp);
      canvas.addEventListener('pointercancel', onUp);
      canvas.addEventListener('pointerleave', onLeave);
      canvas.addEventListener('click', onClick);
      canvas.addEventListener('wheel', onWheel, { passive: false });
    }

    return () => {
      unsubTex();
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('wheel', onWheel);
      if (controlsRef) controlsRef.current = null;
    };
  }, [animated, intro, interactive, density, fit, focusX, pannable, pins, controlsRef]);

  return <canvas ref={canvasRef} role="img" aria-label={label} className={`block h-full w-full ${className}`} />;
}
