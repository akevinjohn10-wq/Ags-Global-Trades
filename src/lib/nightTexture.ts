/**
 * Flat night-Earth texture for the 2D network map, drawn entirely in code (no image downloads) so it
 * is clean and consistent: smooth rounded coastlines from the land mask, a soft blue land gradient with
 * a light coastal rim, and warm amber city lights with a gentle glow. The sea is left clear.
 */
import { getLandMask, MASK_H, MASK_W } from '@/lib/landMask';

export interface NightTexture {
  base: HTMLCanvasElement;
  /** Soft city glow, drawn on top with a slow pulse */
  glow: HTMLCanvasElement;
  /** City points (x, y in 0-1 of the texture) used for twinkles */
  sparks: Float32Array;
}

interface MapWindow { lonMin: number; latMax: number; lonSpan: number; latSpan: number }

const PX_PER_DEG = 8;

// Major cities and trade hubs [lon, lat, brightness 0-1]
const CITIES: [number, number, number][] = [
  [77.2, 28.6, 1], [72.9, 19.1, 1], [88.4, 22.6, 0.8], [80.3, 13.1, 0.75], [77.6, 13.0, 0.75], [78.5, 17.4, 0.7], [72.6, 23.0, 0.6], [75.8, 26.9, 0.5], [80.9, 26.8, 0.55],
  [67.0, 24.9, 0.7], [74.3, 31.5, 0.6], [90.4, 23.8, 0.75], [55.3, 25.2, 0.85], [51.5, 25.3, 0.5], [46.7, 24.7, 0.6], [39.2, 21.5, 0.5], [51.4, 35.7, 0.7], [44.4, 33.3, 0.5],
  [121.5, 31.2, 1], [116.4, 39.9, 1], [113.3, 23.1, 0.95], [114.1, 22.5, 0.9], [120.1, 29.3, 0.6], [104.1, 30.7, 0.7], [106.5, 29.6, 0.7], [114.3, 30.6, 0.7], [117.2, 39.1, 0.7], [108.9, 34.3, 0.6],
  [139.7, 35.7, 1], [135.5, 34.7, 0.9], [136.9, 35.2, 0.7], [126.9, 37.6, 0.95], [129.1, 35.2, 0.7], [121.6, 25.0, 0.8], [100.5, 13.8, 0.8], [106.6, 10.8, 0.75], [105.8, 21.0, 0.65],
  [103.8, 1.35, 0.85], [106.8, -6.2, 0.9], [112.7, -7.3, 0.6], [101.7, 3.1, 0.7], [121.0, 14.6, 0.85], [151.2, -33.9, 0.8], [145.0, -37.8, 0.75], [153.0, -27.5, 0.5], [115.9, -32.0, 0.5], [174.8, -36.8, 0.45],
  [-0.1, 51.5, 1], [2.35, 48.9, 1], [4.9, 52.4, 0.75], [4.5, 51.9, 0.7], [13.4, 52.5, 0.8], [9.99, 53.6, 0.65], [11.6, 48.1, 0.65], [8.7, 50.1, 0.65], [9.2, 45.5, 0.8], [12.5, 41.9, 0.7],
  [-3.7, 40.4, 0.8], [2.2, 41.4, 0.7], [-9.1, 38.7, 0.5], [16.4, 48.2, 0.6], [17.1, 48.15, 0.45], [19.0, 47.5, 0.55], [21.0, 52.2, 0.6], [14.4, 50.1, 0.55], [18.1, 59.3, 0.5], [12.6, 55.7, 0.5],
  [37.6, 55.8, 0.9], [30.3, 59.9, 0.6], [30.5, 50.4, 0.6], [28.98, 41.0, 0.85], [32.9, 39.9, 0.55], [23.7, 37.98, 0.55], [26.1, 44.4, 0.5], [-6.3, 53.3, 0.45], [-2.2, 53.5, 0.6],
  [31.2, 30.0, 0.9], [3.4, 6.5, 0.85], [-0.2, 5.6, 0.55], [-7.6, 33.6, 0.65], [3.1, 36.7, 0.55], [10.2, 36.8, 0.45], [36.8, -1.3, 0.6], [39.7, -4.0, 0.45], [39.3, -6.8, 0.5], [38.7, 9.0, 0.5],
  [28.0, -26.2, 0.8], [31.0, -29.9, 0.6], [18.4, -33.9, 0.6], [15.3, -4.3, 0.55], [32.6, 0.35, 0.45], [-17.4, 14.7, 0.45], [7.5, 9.1, 0.45], [13.2, -8.8, 0.45],
  [-74.0, 40.7, 1], [-87.6, 41.9, 0.85], [-118.2, 34.1, 0.95], [-122.4, 37.8, 0.75], [-95.4, 29.8, 0.75], [-96.8, 32.8, 0.7], [-80.2, 25.8, 0.7], [-84.4, 33.7, 0.65], [-77.0, 38.9, 0.7], [-71.1, 42.4, 0.65],
  [-122.3, 47.6, 0.55], [-112.1, 33.4, 0.55], [-104.99, 39.7, 0.45], [-79.4, 43.7, 0.75], [-73.6, 45.5, 0.6], [-123.1, 49.3, 0.5], [-99.1, 19.4, 0.9], [-103.3, 20.7, 0.55], [-100.3, 25.7, 0.55],
  [-46.6, -23.6, 1], [-43.2, -22.9, 0.85], [-58.4, -34.6, 0.85], [-70.7, -33.4, 0.65], [-77.0, -12.0, 0.65], [-74.1, 4.7, 0.65], [-66.9, 10.5, 0.5], [-47.9, -15.8, 0.5], [-38.5, -12.97, 0.5], [-79.5, 9.0, 0.4],
];

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function build(win: MapWindow): NightTexture {
  const { lonMin, latMax, lonSpan, latSpan } = win;
  const W = Math.round(lonSpan * PX_PER_DEG), H = Math.round(latSpan * PX_PER_DEG);
  const lonToX = (lon: number) => ((((lon - lonMin) % 360) + 360) % 360) * PX_PER_DEG;
  const latToY = (lat: number) => (latMax - lat) * PX_PER_DEG;

  // 1) Land mask upscaled into our window and blurred, so the 1-degree steps become smooth curves
  const small = document.createElement('canvas');
  small.width = MASK_W;
  small.height = MASK_H;
  const sg = small.getContext('2d')!;
  const m = getLandMask();
  const mi = sg.createImageData(MASK_W, MASK_H);
  for (let i = 0; i < m.length; i++) {
    const v = m[i] ? 255 : 0;
    mi.data[i * 4] = mi.data[i * 4 + 1] = mi.data[i * 4 + 2] = v;
    mi.data[i * 4 + 3] = 255;
  }
  sg.putImageData(mi, 0, 0);
  const field = document.createElement('canvas');
  field.width = W;
  field.height = H;
  const fg = field.getContext('2d', { willReadFrequently: true })!;
  fg.imageSmoothingEnabled = true;
  fg.imageSmoothingQuality = 'high';
  fg.filter = `blur(${Math.round(PX_PER_DEG * 0.9)}px)`;
  // the mask spans lon -180..180 and lat 90..-90; place it (wrapping across the date line) in our window
  const fullW = 360 * PX_PER_DEG, fullH = 180 * PX_PER_DEG;
  const left = (-180 - lonMin) * PX_PER_DEG;
  for (const dx of [left - fullW, left, left + fullW]) fg.drawImage(small, dx, -(90 - latMax) * PX_PER_DEG, fullW, fullH);
  const fd = fg.getImageData(0, 0, W, H).data;

  // 2) Land: smooth blue gradient with gentle tonal variation and a thin light rim along the coast
  const base = document.createElement('canvas');
  base.width = W;
  base.height = H;
  const g = base.getContext('2d')!;
  const img = g.createImageData(W, H);
  const px = img.data;
  const smooth = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const NX = 48, NY = 20;
  const grid = new Float32Array((NX + 1) * (NY + 1)).map((_, i) => hash(i % (NX + 1), Math.floor(i / (NX + 1))));
  const vnoise = (u: number, v: number) => {
    const gx = u * NX, gy = v * NY;
    const ix = Math.min(NX - 1, Math.floor(gx)), iy = Math.min(NY - 1, Math.floor(gy));
    const fx = gx - ix, fy = gy - iy;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = grid[iy * (NX + 1) + ix], b = grid[iy * (NX + 1) + ix + 1];
    const c = grid[(iy + 1) * (NX + 1) + ix], d = grid[(iy + 1) * (NX + 1) + ix + 1];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x, j = i * 4;
      const f = fd[j] / 255;
      const a = smooth(0.44, 0.56, f); // crisp, anti-aliased coastline
      if (a <= 0) continue;
      const rim = smooth(0.5, 0.56, f) * (1 - smooth(0.6, 0.78, f));
      const t = 0.35 + 0.4 * vnoise(x / W, y / H);
      px[j] = 22 + t * 30 + rim * 60;
      px[j + 1] = 34 + t * 40 + rim * 80;
      px[j + 2] = 78 + t * 62 + rim * 110;
      px[j + 3] = a * 255;
    }
  }
  g.putImageData(img, 0, 0);

  // 3) City lights: a soft warm pool and a scatter of small lights around each city, kept on land
  const lights = document.createElement('canvas');
  lights.width = W;
  lights.height = H;
  const lg = lights.getContext('2d')!;
  const sparks: number[] = [];
  const onLand = (x: number, y: number) => {
    const xi = Math.min(W - 1, Math.max(0, x | 0)), yi = Math.min(H - 1, Math.max(0, y | 0));
    return fd[(yi * W + xi) * 4] > 140;
  };
  CITIES.forEach(([lon, lat, b], ci) => {
    const cx = lonToX(lon), cy = latToY(lat);
    if (cy < 0 || cy > H) return;
    sparks.push(cx / W, cy / H);
    const R = 10 + b * 26;
    const pool = lg.createRadialGradient(cx, cy, 0, cx, cy, R);
    pool.addColorStop(0, `rgba(255,214,150,${(0.55 * b).toFixed(3)})`);
    pool.addColorStop(0.4, `rgba(255,170,80,${(0.22 * b).toFixed(3)})`);
    pool.addColorStop(1, 'rgba(255,150,60,0)');
    lg.fillStyle = pool;
    lg.beginPath();
    lg.arc(cx, cy, R, 0, Math.PI * 2);
    lg.fill();
    const n = Math.round(10 + b * 34);
    for (let k = 0; k < n; k++) {
      const ang = hash(ci, k) * Math.PI * 2;
      const dist = Math.pow(hash(k, ci + 7), 1.8) * R * 1.4;
      const x = cx + Math.cos(ang) * dist, y = cy + Math.sin(ang) * dist * 0.8;
      if (!onLand(x, y)) continue;
      lg.fillStyle = `rgba(255,${200 + Math.round(hash(k, k) * 40)},${130 + Math.round(hash(ci, ci + k) * 80)},${(0.5 + 0.5 * b).toFixed(3)})`;
      lg.beginPath();
      lg.arc(x, y, 0.6 + hash(k + 3, ci) * 1.3 * b, 0, Math.PI * 2);
      lg.fill();
    }
    lg.fillStyle = 'rgba(255,240,215,0.95)';
    lg.beginPath();
    lg.arc(cx, cy, 1.2 + b * 1.6, 0, Math.PI * 2);
    lg.fill();
  });
  lg.globalCompositeOperation = 'destination-in'; // keep the lights inside the land shape
  lg.drawImage(base, 0, 0);
  lg.globalCompositeOperation = 'source-over';
  g.drawImage(lights, 0, 0);

  // 4) Wide soft glow of the lights, for the pulsing haze
  const glow = document.createElement('canvas');
  glow.width = Math.round(W / 2);
  glow.height = Math.round(H / 2);
  const gl = glow.getContext('2d')!;
  gl.filter = 'blur(8px)';
  gl.drawImage(lights, 0, 0, glow.width, glow.height);

  return { base, glow, sparks: new Float32Array(sparks) };
}

const cache = new Map<string, NightTexture>();

/** Calls back with the texture for this map window (built once, on the next tick). */
export function subscribeNightTexture(cb: (t: NightTexture) => void, win: MapWindow) {
  const key = `${win.lonMin},${win.latMax},${win.lonSpan},${win.latSpan}`;
  let alive = true;
  const hit = cache.get(key);
  if (hit) cb(hit);
  else
    setTimeout(() => {
      if (!alive) return;
      const t = cache.get(key) ?? build(win);
      cache.set(key, t);
      cb(t);
    }, 0);
  return () => {
    alive = false;
  };
}
