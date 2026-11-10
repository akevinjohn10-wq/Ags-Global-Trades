import { useEffect, useRef } from 'react';
import { homeHub, type Hub } from '@/data/globe';
import { getLandMask, isLand } from '@/lib/landMask';

type Theme = 'light' | 'dark' | 'blue';

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
}

const LON_MIN = -170;
const LAT_MAX = 80;
const LAT_MIN = -58;
const LON_SPAN = 360;
const LAT_SPAN = LAT_MAX - LAT_MIN;

const PALETTES: Record<Theme, { dot: string; tint: string; arc: string; arcDim: string; comet: string; hub: string; home: string; labelBg: string; labelFg: string }> = {
  light: {
    dot: 'rgba(27,30,36,0.2)',
    tint: '27,30,36',
    arc: 'rgba(27,30,36,0.45)',
    arcDim: 'rgba(27,30,36,0.08)',
    comet: '27,30,36',
    hub: '#1B1E24',
    home: '#1B1E24',
    labelBg: '#1B1E24',
    labelFg: '#FFFFFF',
  },
  dark: {
    dot: 'rgba(255,255,255,0.2)',
    tint: '200,205,215',
    arc: 'rgba(220,224,232,0.4)',
    arcDim: 'rgba(255,255,255,0.08)',
    comet: '235,238,243',
    hub: '#E6E8EC',
    home: '#FFFFFF',
    labelBg: '#FFFFFF',
    labelFg: '#1B1E24',
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
    labelFg: '#1B1E24',
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
}: DotMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Live props for the render loop, so changing tabs never restarts it
  const live = useRef({ hubs, activeHubs, labels, onHubSelect, theme });
  live.current = { hubs, activeHubs, labels, onHubSelect, theme };
  const redrawRef = useRef<() => void>(() => {});

  useEffect(() => {
    redrawRef.current();
  }, [hubs, activeHubs, labels, theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doAnimate = animated && !reduce;
    const mask = getLandMask();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let layout: Layout = { w: 0, h: 0, scale: 1, ox: 0, oy: 0 };
    let dots = new Float32Array(0); // x, y, delay
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
      layout = { w, h, scale: s, ox, oy: (h - LAT_SPAN * s) / 2 };

      const gap = Math.max(4.2, Math.min(9, (density * w) / 1200));
      const stepDeg = gap / s;
      dotR = Math.max(1, gap * 0.26);
      const list: number[] = [];
      for (let lat = LAT_MAX - stepDeg / 2; lat > LAT_MIN; lat -= stepDeg) {
        for (let l = LON_MIN + stepDeg / 2; l < LON_MIN + LON_SPAN; l += stepDeg) {
          const lon = l > 180 ? l - 360 : l;
          if (!isLand(mask, lon, lat)) continue;
          const [x, y] = project(layout, lon, lat);
          if (x < -gap || x > w + gap || y < -gap || y > h + gap) continue;
          const delay = ((l - LON_MIN) / LON_SPAN) * 0.75 + Math.random() * 0.25;
          list.push(x, y, delay);
        }
      }
      dots = new Float32Array(list);
      dotLayerKey = '';
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
      const key = `${layout.w}x${layout.h}|${live.current.theme}|${activePts.map((p) => p.join(',')).join(';')}`;
      if (key === dotLayerKey && dotLayer) return;
      dotLayerKey = key;
      dotLayer = dotLayer ?? document.createElement('canvas');
      dotLayer.width = canvas!.width;
      dotLayer.height = canvas!.height;
      const g = dotLayer.getContext('2d')!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, layout.w, layout.h);
      g.fillStyle = pal.dot;
      g.beginPath();
      for (let i = 0; i < dots.length; i += 3) {
        g.moveTo(dots[i] + dotR, dots[i + 1]);
        g.arc(dots[i], dots[i + 1], dotR, 0, Math.PI * 2);
      }
      g.fill();
      for (let i = 0; i < dots.length; i += 3) {
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
      ctx!.fillStyle = strong ? (live.current.theme === 'light' ? '#FFFFFF' : '#0A0B0E') : pal.labelFg;
      ctx!.textBaseline = 'middle';
      ctx!.fillText(t, bx + 7, by + bh / 2 + 0.5);
    }

    function frame(now: number) {
      raf = 0;
      const dt = Math.min(64, now - last);
      last = now;
      const pal = PALETTES[live.current.theme];
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, layout.w, layout.h);

      // Dots
      if (!introDone) {
        if (introStart < 0) introStart = now;
        const e = (now - introStart) / 1000;
        ctx!.fillStyle = pal.dot;
        for (let i = 0; i < dots.length; i += 3) {
          const a = Math.min(1, Math.max(0, (e - dots[i + 2] * 1.1) / 0.35));
          if (a <= 0) continue;
          ctx!.globalAlpha = a;
          ctx!.beginPath();
          ctx!.arc(dots[i], dots[i + 1], dotR * (0.4 + 0.6 * a), 0, Math.PI * 2);
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
      live.current.hubs.forEach((hub, index) => {
        if (!routeAlpha) return;
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
          ctx!.fillStyle = live.current.theme === 'light' ? '#fff' : live.current.theme === 'blue' ? '#1B1E24' : '#1B1E24';
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
          drawLabel(hub.name, x, y, pal);
        });
      }

      const moving = doAnimate || !introDone || [...drawState.values()].some((v) => v > 0.001 && v < 0.999);
      if (visible && moving && !document.hidden) raf = requestAnimationFrame(frame);
    }

    function kick() {
      if (!raf && visible) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }
    redrawRef.current = kick;

    function hubAt(clientX: number, clientY: number): Hub | null {
      const rect = canvas!.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      let best: Hub | null = null;
      let bestD = 20;
      for (const hub of live.current.hubs) {
        const [x, y] = project(layout, hub.lon, hub.lat);
        const d = Math.hypot(mx - x, my - y);
        if (d < bestD) {
          bestD = d;
          best = hub;
        }
      }
      return best;
    }

    const onMove = (event: PointerEvent) => {
      const h = hubAt(event.clientX, event.clientY);
      if (h !== hover) {
        hover = h;
        canvas.style.cursor = h ? 'pointer' : '';
        kick();
      }
    };
    const onLeave = () => {
      hover = null;
      canvas.style.cursor = '';
      kick();
    };
    const onClick = (event: MouseEvent) => {
      const h = hubAt(event.clientX, event.clientY);
      if (h) live.current.onHubSelect?.(h);
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

    if (interactive) {
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerleave', onLeave);
      canvas.addEventListener('click', onClick);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick);
    };
  }, [animated, intro, interactive, density, fit, focusX]);

  return <canvas ref={canvasRef} role="img" aria-label={label} className={`block h-full w-full ${className}`} />;
}
