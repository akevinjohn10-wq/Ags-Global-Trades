import { useEffect, useRef } from 'react';
import { allHubs as tradeHubs, homeHub, type Hub } from '@/data/globe';
import { getLandMask, isLand } from '@/lib/landMask';

/**
 * Animated dotted globe drawn on a <canvas> (no libraries), in the AGS blue palette.
 * - Rendered at up to 2x device pixel ratio, so it stays crisp on 4K screens.
 * - Auto-rotates, can be dragged, and shows animated trade routes from the home hub.
 * - Pauses when off-screen / tab hidden; respects prefers-reduced-motion.
 */

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const PITCH = 20 * DEG;
const COS_P = Math.cos(PITCH);
const SIN_P = Math.sin(PITCH);
const DOT_STEP = 1.7; // degrees between land dots
const ARC_POINTS = 72;
const AUTO_SPEED = 4.5; // degrees per second
const START_LON = 92; // longitude facing the viewer initially

type Vec3 = [number, number, number];

function toVec(lat: number, lon: number, radius = 1): Vec3 {
  const la = lat * DEG;
  const lo = lon * DEG;
  return [Math.cos(la) * Math.sin(lo) * radius, Math.sin(la) * radius, Math.cos(la) * Math.cos(lo) * radius];
}

function normalise(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

/** Points along a great circle between two hubs, lifted above the surface like a flight path. */
function buildArc(a: Hub, b: Hub): Float32Array {
  const va = toVec(a.lat, a.lon);
  const vb = toVec(b.lat, b.lon);
  const dot = Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
  const ang = Math.acos(dot);
  const sinAng = Math.sin(ang) || 1;
  const lift = 0.05 + 0.2 * (ang / Math.PI);
  const out = new Float32Array(ARC_POINTS * 3);
  for (let i = 0; i < ARC_POINTS; i++) {
    const t = i / (ARC_POINTS - 1);
    const wa = Math.sin((1 - t) * ang) / sinAng;
    const wb = Math.sin(t * ang) / sinAng;
    const p = normalise([wa * va[0] + wb * vb[0], wa * va[1] + wb * vb[1], wa * va[2] + wb * vb[2]]);
    const r = 1 + lift * Math.sin(Math.PI * t);
    out[i * 3] = p[0] * r;
    out[i * 3 + 1] = p[1] * r;
    out[i * 3 + 2] = p[2] * r;
  }
  return out;
}

function chipPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

interface GlobeProps {
  className?: string;
}

export default function Globe({ className = '' }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- Static data -------------------------------------------------------
    const mask = getLandMask();
    const dotList: number[] = [];
    for (let lat = -86; lat <= 86; lat += DOT_STEP) {
      const n = Math.max(1, Math.round((360 * Math.cos(lat * DEG)) / DOT_STEP));
      for (let i = 0; i < n; i++) {
        const lon = -180 + ((i + 0.5) * 360) / n;
        if (isLand(mask, lon, lat)) {
          const v = toVec(lat, lon);
          dotList.push(v[0], v[1], v[2]);
        }
      }
    }
    const dots = new Float32Array(dotList);
    const dotCount = dots.length / 3;

    const arcs = tradeHubs.map((hub, index) => ({
      hub,
      pts: buildArc(homeHub, hub),
      phase: index / tradeHubs.length,
      speed: 0.11 + (index % 3) * 0.02,
    }));
    const hubs: { hub: Hub; vec: Vec3; home: boolean; phase: number }[] = [
      { hub: homeHub, vec: toVec(homeHub.lat, homeHub.lon, 1.004), home: true, phase: 0 },
      ...tradeHubs.map((hub, i) => ({ hub, vec: toVec(hub.lat, hub.lon, 1.004), home: false, phase: (i * 0.37) % 1 })),
    ];

    // Per-frame scratch buffers
    const BUCKETS = 4;
    const bucketXY = Array.from({ length: BUCKETS }, () => new Float32Array(dotCount * 3));
    const bucketN = new Int32Array(BUCKETS);
    const bucketAlpha = [0.22, 0.42, 0.68, 0.95];
    const arcScreen = new Float32Array(ARC_POINTS * 3); // x, y, z per arc point

    // ---- Size / state ------------------------------------------------------
    let w = 0;
    let h = 0;
    let dpr = 1;
    let centerLon = START_LON;
    let velocity = 0; // deg per second, from dragging
    let dragging = false;
    let lastX = 0;
    let lastMove = 0;
    let visible = true;
    let raf = 0;
    let prev = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
    };

    const project = (v: Vec3, cLon: number, cx: number, cy: number, R: number, out: Float32Array, o: number) => {
      const c = Math.cos(cLon * DEG);
      const s = Math.sin(cLon * DEG);
      const x1 = v[0] * c - v[2] * s;
      const z1 = v[0] * s + v[2] * c;
      const y2 = v[1] * COS_P - z1 * SIN_P;
      const z2 = v[1] * SIN_P + z1 * COS_P;
      out[o] = cx + x1 * R;
      out[o + 1] = cy - y2 * R;
      out[o + 2] = z2;
    };

    // ---- Drawing -----------------------------------------------------------
    const draw = (now: number) => {
      const time = reduced ? 0 : now / 1000;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.43;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Atmosphere glow behind the sphere
      const halo = ctx.createRadialGradient(cx + R * 0.12, cy + R * 0.18, R * 0.94, cx, cy, R * 1.45);
      halo.addColorStop(0, 'rgba(37,70,224,0.55)');
      halo.addColorStop(0.3, 'rgba(2,41,213,0.22)');
      halo.addColorStop(1, 'rgba(2,41,213,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.45, 0, TAU);
      ctx.fill();

      // Sphere body
      const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.08, cx, cy, R);
      body.addColorStop(0, '#0B1430');
      body.addColorStop(0.6, '#060A1A');
      body.addColorStop(1, '#03050D');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.clip();

      // Graticule
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = 'rgba(174,189,243,0.07)';
      const tmp = new Float32Array(3);
      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath();
        let pen = false;
        for (let lat = -90; lat <= 90; lat += 4) {
          project(toVec(lat, lon), centerLon, cx, cy, R, tmp, 0);
          if (tmp[2] > 0) {
            if (pen) ctx.lineTo(tmp[0], tmp[1]);
            else ctx.moveTo(tmp[0], tmp[1]);
            pen = true;
          } else pen = false;
        }
        ctx.stroke();
      }
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let pen = false;
        for (let lon = -180; lon <= 180; lon += 4) {
          project(toVec(lat, lon), centerLon, cx, cy, R, tmp, 0);
          if (tmp[2] > 0) {
            if (pen) ctx.lineTo(tmp[0], tmp[1]);
            else ctx.moveTo(tmp[0], tmp[1]);
            pen = true;
          } else pen = false;
        }
        ctx.stroke();
      }

      // Land dots (bucketed by depth so we only change fill style 4 times)
      bucketN.fill(0);
      const c = Math.cos(centerLon * DEG);
      const s = Math.sin(centerLon * DEG);
      for (let i = 0; i < dotCount; i++) {
        const x = dots[i * 3];
        const y = dots[i * 3 + 1];
        const z = dots[i * 3 + 2];
        const x1 = x * c - z * s;
        const z1 = x * s + z * c;
        const z2 = y * SIN_P + z1 * COS_P;
        if (z2 <= 0.02) continue;
        const y2 = y * COS_P - z1 * SIN_P;
        const b = z2 < 0.25 ? 0 : z2 < 0.5 ? 1 : z2 < 0.75 ? 2 : 3;
        const arr = bucketXY[b];
        const k = bucketN[b]++ * 3;
        arr[k] = cx + x1 * R;
        arr[k + 1] = cy - y2 * R;
        arr[k + 2] = z2;
      }
      for (let b = 0; b < BUCKETS; b++) {
        const arr = bucketXY[b];
        const n = bucketN[b];
        ctx.fillStyle = `rgba(214,224,250,${bucketAlpha[b]})`;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const px = arr[i * 3];
          const py = arr[i * 3 + 1];
          const r = R * 0.0036 * (0.55 + 0.6 * arr[i * 3 + 2]);
          ctx.moveTo(px + r, py);
          ctx.arc(px, py, r, 0, TAU);
        }
        ctx.fill();
      }

      // Soft light on the upper-left limb
      const light = ctx.createRadialGradient(cx - R * 0.8, cy - R * 0.8, R * 0.05, cx - R * 0.8, cy - R * 0.8, R * 1.1);
      light.addColorStop(0, 'rgba(150,205,255,0.26)');
      light.addColorStop(1, 'rgba(150,205,255,0)');
      ctx.fillStyle = light;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      // Bright limb (fresnel-style rim)
      const rim = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R);
      rim.addColorStop(0, 'rgba(37,70,224,0)');
      rim.addColorStop(0.7, 'rgba(37,70,224,0.16)');
      rim.addColorStop(1, 'rgba(120,150,255,0.85)');
      ctx.fillStyle = rim;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.restore();

      // Trade routes
      ctx.lineCap = 'round';
      for (const arc of arcs) {
        for (let i = 0; i < ARC_POINTS; i++) {
          project([arc.pts[i * 3], arc.pts[i * 3 + 1], arc.pts[i * 3 + 2]], centerLon, cx, cy, R, arcScreen, i * 3);
        }

        // Faint full route
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(174,189,243,0.22)';
        ctx.beginPath();
        let pen = false;
        for (let i = 0; i < ARC_POINTS; i++) {
          if (arcScreen[i * 3 + 2] > 0) {
            if (pen) ctx.lineTo(arcScreen[i * 3], arcScreen[i * 3 + 1]);
            else ctx.moveTo(arcScreen[i * 3], arcScreen[i * 3 + 1]);
            pen = true;
          } else pen = false;
        }
        ctx.stroke();

        // Travelling comet
        const u = reduced ? 0.6 : (time * arc.speed + arc.phase) % 1.35;
        const head = Math.min(u, 1) * (ARC_POINTS - 1);
        const tail = Math.max(0, head - 0.28 * (ARC_POINTS - 1));
        const i0 = Math.floor(tail);
        const i1 = Math.floor(head);
        for (let i = i0; i < i1; i++) {
          if (arcScreen[i * 3 + 2] <= 0 || arcScreen[(i + 1) * 3 + 2] <= 0) continue;
          const f = (i - i0 + 1) / Math.max(1, i1 - i0);
          ctx.strokeStyle = `rgba(255,255,255,${(0.1 + 0.9 * f).toFixed(3)})`;
          ctx.lineWidth = 1.2 + 1.4 * f;
          ctx.beginPath();
          ctx.moveTo(arcScreen[i * 3], arcScreen[i * 3 + 1]);
          ctx.lineTo(arcScreen[(i + 1) * 3], arcScreen[(i + 1) * 3 + 1]);
          ctx.stroke();
        }
        if (u <= 1 && arcScreen[i1 * 3 + 2] > 0) {
          const hx = arcScreen[i1 * 3];
          const hy = arcScreen[i1 * 3 + 1];
          ctx.fillStyle = 'rgba(120,150,255,0.4)';
          ctx.beginPath();
          ctx.arc(hx, hy, 6, 0, TAU);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(hx, hy, 2.2, 0, TAU);
          ctx.fill();
        }
      }

      // Hub markers + labels
      ctx.font = '600 10.5px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textBaseline = 'middle';
      const pos = new Float32Array(3);
      for (const hub of hubs) {
        project(hub.vec, centerLon, cx, cy, R, pos, 0);
        if (pos[2] < 0.06) continue;
        const fade = Math.min(1, (pos[2] - 0.06) / 0.25);
        const px = pos[0];
        const py = pos[1];

        const pulse = reduced ? 0.5 : (time * 0.55 + hub.phase) % 1;
        ctx.strokeStyle = `rgba(255,255,255,${((1 - pulse) * 0.5 * fade).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(px, py, (hub.home ? 7 : 5) + pulse * (hub.home ? 22 : 15), 0, TAU);
        ctx.stroke();

        ctx.fillStyle = hub.home ? `rgba(2,41,213,${fade})` : `rgba(255,255,255,${fade})`;
        ctx.beginPath();
        ctx.arc(px, py, hub.home ? 5 : 3.6, 0, TAU);
        ctx.fill();
        ctx.fillStyle = hub.home ? `rgba(255,255,255,${fade})` : `rgba(2,41,213,${fade})`;
        ctx.beginPath();
        ctx.arc(px, py, hub.home ? 2.1 : 1.4, 0, TAU);
        ctx.fill();

        if (pos[2] > 0.3 && w > 420) {
          const label = hub.hub.name.toUpperCase();
          const tw = ctx.measureText(label).width;
          const bx = px + 11;
          const by = py - 26;
          ctx.globalAlpha = fade;
          chipPath(ctx, bx, by, tw + 16, 20, 2);
          ctx.fillStyle = hub.home ? '#0229D5' : 'rgba(255,255,255,0.92)';
          ctx.fill();
          ctx.fillStyle = hub.home ? '#FFFFFF' : '#1B1E24';
          ctx.fillText(label, bx + 8, by + 10.5);
          ctx.globalAlpha = 1;
        }
      }
    };

    // ---- Loop --------------------------------------------------------------
    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;

      if (!dragging) {
        if (Math.abs(velocity) > 0.05) {
          centerLon += velocity * dt;
          velocity *= Math.pow(0.04, dt); // inertia decays over ~1s
        } else if (!reduced) {
          centerLon += AUTO_SPEED * dt;
        }
      }
      draw(now);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!raf && visible && !document.hidden) {
        prev = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    // ---- Interaction -------------------------------------------------------
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastMove = performance.now();
      velocity = 0;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const R = Math.min(w, h) * 0.43;
      const now = performance.now();
      const dLon = ((e.clientX - lastX) / R) * (180 / Math.PI) * -1;
      centerLon += dLon;
      const dtMove = Math.max(1, now - lastMove) / 1000;
      velocity = Math.max(-120, Math.min(120, dLon / dtMove));
      lastX = e.clientX;
      lastMove = now;
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      if (performance.now() - lastMove > 90) velocity = 0;
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVisibility = () => {
      if (!document.hidden) start();
    };
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    draw(performance.now());
    start();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Rotating globe with routes from New Delhi to sourcing and delivery cities around the world. Drag to turn it."
      className={`block h-full w-full cursor-grab touch-pan-y active:cursor-grabbing ${className}`}
    />
  );
}
