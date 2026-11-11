/**
 * Flat (equirectangular) version of the hero globe's night-Earth look, for the 2D network map:
 * navy sea with a faint grid, blue-grey land with relief, and amber city lights with a soft glow.
 * Built once on a canvas and shared. Starts from the built-in land mask, then upgrades itself when the
 * NASA-derived maps (water mask, elevation, night lights) have loaded.
 */
import { getLandMask, isLand } from '@/lib/landMask';

export interface NightTexture {
  base: HTMLCanvasElement;
  /** Blurred city lights, drawn on top with a slow pulse */
  glow: HTMLCanvasElement;
  /** Bright city points (x, y in 0-1 of the texture) used for twinkles */
  sparks: Float32Array;
  lonMin: number;
  latMax: number;
  lonSpan: number;
  latSpan: number;
}

const IMG_BASES = ['https://cdn.jsdelivr.net/npm/three-globe@2.43.0/example/img/', 'https://unpkg.com/three-globe@2.43.0/example/img/'];
const PX_PER_DEG = 8;

let current: NightTexture | null = null;
const listeners = new Set<(t: NightTexture) => void>();
let started = false;
let bounds = { lonMin: -170, latMax: 80, lonSpan: 360, latSpan: 138 };

function loadImg(name: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    let i = 0;
    const next = () => {
      if (i >= IMG_BASES.length) return rej(new Error(name));
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.decoding = 'async';
      im.onload = () => res(im);
      im.onerror = () => { i++; next(); };
      im.src = IMG_BASES[i] + name;
    };
    next();
  });
}

/** Samples a full-world equirectangular image into our map's window, as a Uint8 luminance array. */
function sample(img: HTMLImageElement | null, W: number, H: number): Uint8ClampedArray | null {
  if (!img) return null;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return null;
  const { lonMin, latMax, lonSpan, latSpan } = bounds;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const sx = ((lonMin + 180) / 360) * iw;
  const sy = ((90 - latMax) / 180) * ih;
  const sw = (lonSpan / 360) * iw;
  const shh = (latSpan / 180) * ih;
  // the window crosses the date line, so draw it in two pieces
  const first = Math.min(sw, iw - sx);
  g.drawImage(img, sx, sy, first, shh, 0, 0, (first / sw) * W, H);
  if (first < sw) g.drawImage(img, 0, sy, sw - first, shh, (first / sw) * W, 0, ((sw - first) / sw) * W, H);
  const d = g.getImageData(0, 0, W, H).data;
  const out = new Uint8ClampedArray(W * H);
  for (let i = 0, j = 0; i < out.length; i++, j += 4) out[i] = (d[j] * 0.3 + d[j + 1] * 0.5 + d[j + 2] * 0.2) | 0;
  return out;
}

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function build(water: HTMLImageElement | null, topo: HTMLImageElement | null, night: HTMLImageElement | null): NightTexture {
  const { lonMin, latMax, lonSpan, latSpan } = bounds;
  const W = Math.round(lonSpan * PX_PER_DEG), H = Math.round(latSpan * PX_PER_DEG);
  const wat = sample(water, W, H), top = sample(topo, W, H), lig = sample(night, W, H);
  const mask = getLandMask();

  const base = document.createElement('canvas');
  base.width = W; base.height = H;
  const g = base.getContext('2d')!;
  const img = g.createImageData(W, H);
  const px = img.data;
  const lights = document.createElement('canvas');
  lights.width = W; lights.height = H;
  const lg = lights.getContext('2d')!;
  const limg = lg.createImageData(W, H);
  const lp = limg.data;
  const sparks: number[] = [];

  for (let y = 0; y < H; y++) {
    const lat = latMax - (y + 0.5) / PX_PER_DEG;
    for (let x = 0; x < W; x++) {
      const i = y * W + x, j = i * 4;
      const lon = lonMin + (x + 0.5) / PX_PER_DEG;
      const land = wat ? (255 - wat[i]) / 255 : isLand(mask, lon > 180 ? lon - 360 : lon, lat) ? 1 : 0;
      const elev = top ? top[i] / 255 : 0.3 + 0.2 * hash(Math.floor(x / 6), Math.floor(y / 6));
      const n = hash(x, y);
      // sea: deep navy, a touch lighter toward the equator
      const eq = 1 - Math.abs(lat) / 90;
      let r = 4 + eq * 6, gg = 9 + eq * 10, b = 26 + eq * 22;
      // land: blue-grey relief
      const rel = Math.min(1, 0.25 + elev * 1.6);
      const lr = 14 + rel * 26, lgc = 22 + rel * 34, lb = 48 + rel * 58;
      r = r + (lr - r) * land; gg = gg + (lgc - gg) * land; b = b + (lb - b) * land;
      // grain
      const gr = (n - 0.5) * 5;
      px[j] = r + gr; px[j + 1] = gg + gr; px[j + 2] = b + gr; px[j + 3] = 255;
      // city lights
      const L = lig ? lig[i] / 255 : 0;
      if (L > 0.06) {
        const a = Math.min(1, (L - 0.06) * 1.6);
        lp[j] = 255; lp[j + 1] = 170 + a * 70; lp[j + 2] = 90 + a * 110; lp[j + 3] = a * 255;
        if (L > 0.55 && n > 0.985) sparks.push(x / W, y / H);
      }
    }
  }
  g.putImageData(img, 0, 0);

  // faint sea grid every 10 degrees
  g.strokeStyle = 'rgba(120,150,230,0.07)';
  g.lineWidth = 1;
  g.beginPath();
  for (let lon = Math.ceil(lonMin / 10) * 10; lon < lonMin + lonSpan; lon += 10) {
    const x = (lon - lonMin) * PX_PER_DEG + 0.5;
    g.moveTo(x, 0); g.lineTo(x, H);
  }
  for (let lat = Math.floor(latMax / 10) * 10; lat > latMax - latSpan; lat -= 10) {
    const y = (latMax - lat) * PX_PER_DEG + 0.5;
    g.moveTo(0, y); g.lineTo(W, y);
  }
  g.stroke();

  lg.putImageData(limg, 0, 0);
  g.drawImage(lights, 0, 0);

  // soft glow version of the lights
  const glow = document.createElement('canvas');
  glow.width = Math.round(W / 2); glow.height = Math.round(H / 2);
  const gl = glow.getContext('2d')!;
  gl.filter = 'blur(5px)';
  gl.drawImage(lights, 0, 0, glow.width, glow.height);
  gl.filter = 'none';
  gl.globalCompositeOperation = 'lighter';
  gl.filter = 'blur(14px)';
  gl.drawImage(lights, 0, 0, glow.width, glow.height);

  // fall back to evenly spread twinkles when there is no night-lights map yet
  if (!sparks.length) {
    for (let k = 0; k < 4000 && sparks.length < 160; k++) {
      const x = hash(k, 1), y = hash(k, 2);
      const lon = lonMin + x * lonSpan, lat = latMax - y * latSpan;
      if (isLand(mask, lon > 180 ? lon - 360 : lon, lat)) sparks.push(x, y);
    }
  }
  // keep a manageable number
  const sp = new Float32Array(sparks.slice(0, 2 * 260));
  return { base, glow, sparks: sp, ...bounds };
}

/** Subscribe to the texture; the callback runs now (if ready) and again when it upgrades. */
export function subscribeNightTexture(cb: (t: NightTexture) => void, window_?: { lonMin: number; latMax: number; lonSpan: number; latSpan: number }) {
  if (window_) bounds = window_;
  listeners.add(cb);
  if (current) cb(current);
  if (!started) {
    started = true;
    const publish = (t: NightTexture) => { current = t; listeners.forEach((l) => l(t)); };
    // quick first version from the land mask, off the main frame
    setTimeout(() => publish(build(null, null, null)), 0);
    const opt = (n: string) => loadImg(n).catch(() => null);
    Promise.all([opt('earth-water.png'), opt('earth-topology.png'), opt('earth-night.jpg')]).then(([w, t, n]) => {
      if (w || n) publish(build(w, t, n));
    });
  }
  return () => { listeners.delete(cb); };
}
