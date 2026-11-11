// @ts-nocheck
/**
 * Interactive night-Earth globe (WebGL2). Ported from the standalone preview.
 * Imagery: NASA-derived water, elevation and night-lights maps, as packaged with the open-source three-globe library.
 * Falls back to the built-in land mask until (or if) the imagery loads.
 */
import { PACKED } from '@/lib/landMask';

export interface GlobeHub { name: string; lat: number; lon: number; country?: string; note?: string; region?: string }
export interface GlobeHandle { flyTo(hub: GlobeHub): void; reset(): void; setRunning(on: boolean): void; destroy(): void }
export interface GlobeOptions {
  home: GlobeHub;
  hubs: GlobeHub[];
  onSelect?: (hub: GlobeHub | null) => void;
  interactive?: boolean;
  reduce?: boolean;
  /** Horizontal position of the globe on wide screens, 0-1 of the container width */
  centerX?: number;
}

export function createGlobe(root: HTMLElement, opts: GlobeOptions): GlobeHandle | null {
const { home: HOME, hubs: HUBS, onSelect, interactive = true, reduce = false, centerX = 0.66 } = opts;


const stage = root;
const glCanvas = document.createElement('canvas');
const fx = document.createElement('canvas');
for (const c of [glCanvas, fx]) { c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'; }
fx.style.pointerEvents = 'none';
glCanvas.style.touchAction = interactive ? 'none' : 'auto';
glCanvas.setAttribute('aria-hidden', 'true');
root.appendChild(glCanvas); root.appendChild(fx);
const gl = glCanvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
if (!gl) { root.removeChild(glCanvas); root.removeChild(fx); return null; }
const ctx = fx.getContext('2d');

/* ---------- land texture from the 1° mask ---------- */
function landTexture() {
  const bin = atob(PACKED);
  const W = 360, H = 180;
  const small = document.createElement('canvas'); small.width = W; small.height = H;
  const sc = small.getContext('2d');
  const img = sc.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const v = (bin.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v ? 255 : 0; img.data[i * 4 + 3] = 255;
  }
  sc.putImageData(img, 0, 0);
  const big = document.createElement('canvas'); big.width = 2048; big.height = 1024;
  const bc = big.getContext('2d');
  bc.imageSmoothingEnabled = true; bc.imageSmoothingQuality = 'high';
  bc.filter = 'blur(3px)';
  // draw with wrap so the blur is seamless at the date line
  bc.drawImage(small, -2048, 0, 2048, 1024); bc.drawImage(small, 0, 0, 2048, 1024); bc.drawImage(small, 2048, 0, 2048, 1024);
  return big;
}

/* ---------- renderer: WebGL2, NASA imagery when it loads, procedural fallback until then ---------- */
const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
const FS = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes; uniform vec2 uCenter; uniform float uScale;
uniform vec3 uCam; uniform vec3 uTarget; uniform mat3 uRot; uniform vec3 uSun;
uniform float uTime; uniform float uReal; uniform float uHasWater; uniform float uHasTopo; uniform float uHasNight;
uniform sampler2D uLand; uniform sampler2D uDay; uniform sampler2D uNight; uniform sampler2D uWater; uniform sampler2D uTopo;
const float PI = 3.14159265;

float h31(vec3 p){ p = fract(p*0.3183099+.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x), mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x), mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<4;i++){ s+=a*noise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; } return s; }
vec3 toLin(vec3 c){ return pow(c, vec3(2.2)); }
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }

void main(){
  vec2 uv = (gl_FragCoord.xy - uCenter) / (uRes.y * uScale);
  vec3 f = normalize(uTarget - uCam);
  vec3 r = normalize(cross(f, vec3(0,1,0)));
  vec3 u = cross(r, f);
  vec3 rd = normalize(f*1.9 + uv.x*r + uv.y*u);
  vec3 ro = uCam;
  vec3 sun = normalize(uSun);

  float b = dot(ro, rd);
  float c = dot(ro, ro) - 1.0;
  float hd = b*b - c;
  float dmin = sqrt(max(dot(ro,ro) - b*b, 0.0));

  // surface point (or the closest point on the limb, so screen derivatives stay smooth)
  float t = -b - sqrt(max(hd, 0.0));
  vec3 n = normalize(ro + rd*t);
  vec3 l = n * uRot;                       // world -> globe space
  float lat = asin(clamp(l.y,-1.,1.)), lon = atan(l.x, l.z);
  vec2 tuv = vec2((lon+PI)/(2.*PI), (PI*.5-lat)/PI);
  // seam-safe gradients for mip selection
  float uB = fract(tuv.x + 0.5);
  vec2 dx = vec2(abs(dFdx(tuv.x)) < abs(dFdx(uB)) ? dFdx(tuv.x) : dFdx(uB), dFdx(tuv.y));
  vec2 dy = vec2(abs(dFdy(tuv.x)) < abs(dFdy(uB)) ? dFdy(tuv.x) : dFdy(uB), dFdy(tuv.y));

  // --- space ---
  vec3 col = mix(vec3(0.0015,0.004,0.012), vec3(0.006,0.013,0.035), smoothstep(-0.6, 0.9, rd.y*0.5 + dot(rd, sun)*0.5));
  vec3 sc = rd * 300.0; vec3 cell = floor(sc); float sh = h31(cell);
  if (sh > 0.9968) {
    vec3 sp = cell + 0.5 + (vec3(h31(cell+3.1), h31(cell+7.7), h31(cell+1.3))-0.5)*0.6;
    float tw = 0.7 + 0.3*sin(uTime*1.4 + sh*90.0);
    vec3 tint = mix(vec3(1.0,0.85,0.7), vec3(0.7,0.8,1.0), h31(cell+5.0));
    col += tint * smoothstep(0.5, 0.0, length(sc - sp)) * (sh-0.9968)/0.0032 * 1.6 * tw;
  }
  vec3 sc2 = rd * 760.0; vec3 c2 = floor(sc2); float s2 = h31(c2+11.0);
  if (s2 > 0.9982) col += vec3(0.6,0.68,0.9) * smoothstep(0.5, 0.0, length(sc2 - c2 - 0.5)) * 0.45;
  float sd = max(dot(rd, sun), 0.0);

  if (hd > 0.0) {
    // ---- night Earth: near-black globe, continents traced in amber city lights ----
    float ndl = dot(n, sun);
    float m = texture(uLand, tuv).r;
    float coast = (fbm(l*11.0) - 0.5) * 0.22 + (noise(l*48.0) - 0.5) * 0.08;
    float landMask = smoothstep(0.475, 0.525, m + coast);
    float relief = fbm(l*22.0);
    float cityFb = smoothstep(0.50, 0.78, fbm(l*6.0 + 4.0)) * smoothstep(0.85, 0.6, abs(l.y));
    float city = cityFb, cityGlow = cityFb * 0.5;
    if (uReal > 0.001) {
      float water = uHasWater > 0.5 ? textureGrad(uWater, tuv, dx, dy).r : 1.0 - landMask;
      float elev = uHasTopo > 0.5 ? textureGrad(uTopo, tuv, dx, dy).r : relief;
      landMask = mix(landMask, 1.0 - water, uReal);
      relief = mix(relief, 0.25 + 0.75*smoothstep(0.0, 0.55, elev) + (relief-0.5)*0.25, uReal);
      if (uHasNight > 0.5) {
        float nl = dot(textureGrad(uNight, tuv, dx, dy).rgb, vec3(0.3,0.5,0.2));
        float ng = dot(textureGrad(uNight, tuv, dx*10.0, dy*10.0).rgb, vec3(0.3,0.5,0.2));   // wide, soft version for the glow
        city = mix(city, smoothstep(0.03, 0.55, nl), uReal);
        cityGlow = mix(cityGlow, smoothstep(0.02, 0.35, ng), uReal);
      }
    }
    float land = landMask;

    float key = smoothstep(-0.25, 0.9, ndl);            // lit only toward the sun; the rest stays night
    vec3 sea = vec3(0.016,0.030,0.080);
    vec3 ground = mix(vec3(0.050,0.075,0.150), vec3(0.090,0.120,0.220), relief);
    vec3 base = mix(sea, ground, land) * (0.75 + 1.3*key);

    // faint sea mesh keeps a little of the technical feel
    vec2 ll2 = vec2(lon, lat) * (180.0/PI) / 3.0;
    vec2 gw = fwidth(ll2) + 1e-4;
    vec2 gl2 = abs(fract(ll2 - 0.5) - 0.5) / gw;
    base += vec3(0.30,0.40,0.80) * (1.0 - min(min(gl2.x, gl2.y), 1.0)) * (1.0 - land) * 0.06;

    // amber light points on an even grid: dim over all land, bright where the cities are
    float cs = 0.62 * PI / 180.0;
    float cl = max(cos(lat), 0.05);
    vec2 g = vec2(lon * cl, lat) / cs;
    vec2 id = floor(g); vec2 fr = fract(g) - 0.5;
    float rnd = h31(vec3(id, 3.0));
    float aa = max(fwidth(g.x), fwidth(g.y)) + 1e-4;
    float rad = 0.12 + 0.16 * city;
    float dotA = smoothstep(rad + aa, rad - aa, length(fr)) * smoothstep(0.4, 0.6, land) * smoothstep(1.4, 0.5, aa);
    float bright = 0.20 + 3.2 * city * (0.5 + 0.5*rnd);
    float tw = 0.8 + 0.2*sin(uTime*2.2 + rnd*40.0);
    // quiet land points stay cool and pale; city points burn gold to near-white
    vec3 amber = mix(vec3(0.62,0.72,1.0), mix(vec3(1.0,0.62,0.18), vec3(1.0,0.90,0.68), smoothstep(0.45, 0.95, city*rnd)), smoothstep(0.08, 0.35, city));
    col = base + amber * dotA * bright * tw;
    col += vec3(1.0,0.62,0.22) * pow(cityGlow, 1.4) * 0.50;            // soft bloom around the brightest cities
    col += vec3(1.0,0.70,0.30) * city * land * (1.0 - dotA) * 0.03;

    // drifting grey cloud on the sunlit side
    vec3 cp = l*3.4 + vec3(uTime*0.010, 0.0, uTime*0.005);
    float clouds = smoothstep(0.55, 0.85, fbm(cp + fbm(cp*2.1)*0.7));
    col = mix(col, vec3(0.70,0.76,0.88) * key, clouds * 0.30 * key);
    col = toLin(col) * 1.7;

    // thin cool rim, bright where the sun grazes the edge
    float mu = max(dot(n, -rd), 0.0);
    float fres = pow(1.0 - mu, 4.0);
    col = col * (1.0 - fres*0.3) + mix(vec3(0.22,0.38,0.95), vec3(0.75,0.86,1.0), smoothstep(0.0, 0.7, ndl)) * fres * (0.35 + 1.2*smoothstep(-0.2,0.7,ndl));
    col += vec3(0.10,0.18,0.45) * pow(1.0-mu, 1.5) * 0.25;
    col += vec3(0.90,0.95,1.0) * pow(1.0-mu, 8.0) * pow(sd, 3.0) * 2.5;
  } else {
    float hgt = dmin - 1.0;
    vec3 pc = normalize(ro + rd*(-b));
    float sunSide = smoothstep(-0.45, 0.6, dot(pc, sun));
    float front = step(0.0, -b);
    float halo = exp(-hgt*42.0) * (0.15 + 2.3*sunSide) + exp(-hgt*10.0) * 0.10 * (0.25 + sunSide);
    col += mix(vec3(0.20,0.34,0.90), vec3(0.70,0.82,1.0), sunSide) * (halo * 0.42) * front;
    col += vec3(0.88,0.94,1.0) * exp(-hgt*70.0) * pow(sd, 3.0) * 2.0 * front;
    col += vec3(1.0, 0.97, 0.92) * pow(sd, 2600.0) * 40.0 + vec3(0.55,0.7,1.0) * pow(sd, 70.0) * 0.5 + vec3(0.3,0.45,0.9) * pow(sd, 8.0) * 0.10;
  }

  // lens: streak + bloom from the sun when it is not behind the planet
  float sz = dot(sun, f);
  if (sz > 0.0) {
    vec2 sunScreen = vec2(dot(sun, r), dot(sun, u)) / sz * 1.9;
    vec2 dv = uv - sunScreen;
    float bb = dot(ro, sun); float occ = step(0.0, bb*bb - c) * step(bb, 0.0);
    float streak = exp(-abs(dv.y)*110.0) * exp(-abs(dv.x)*2.0) * 0.4;
    float bloom = exp(-length(dv)*7.0) * 0.25;
    col += vec3(0.55,0.7,1.0) * (streak + bloom) * (1.0 - occ) * smoothstep(0.0, 0.2, sz);
  }

  col = aces(col * 1.15);
  col = pow(col, vec3(1.0/2.2));
  vec2 q = gl_FragCoord.xy / uRes; col *= 0.84 + 0.16*smoothstep(1.2, 0.3, length(q-0.5));
  col += (h31(vec3(gl_FragCoord.xy, uTime)) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}`;

function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
const prog = gl.createProgram();
gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
gl.useProgram(prog);
const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
const U = {}; ['uRes','uCenter','uScale','uCam','uTarget','uRot','uSun','uTime','uLand','uDay','uNight','uWater','uTopo','uReal','uHasWater','uHasTopo','uHasNight'].forEach(k => U[k] = gl.getUniformLocation(prog, k));
const aniso = gl.getExtension('EXT_texture_filter_anisotropic');

function makeTex(unit, source, opts = {}) {
  const tx = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tx);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, opts.fmt || gl.RGBA, opts.fmt || gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  return tx;
}
// 1x1 placeholders so every sampler is valid before the imagery arrives
const px = (unit) => { const tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tx); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255])); };
makeTex(0, landTexture()); px(1); px(2); px(3); px(4);
gl.uniform1i(U.uLand, 0); gl.uniform1i(U.uDay, 1); gl.uniform1i(U.uNight, 2); gl.uniform1i(U.uWater, 3); gl.uniform1i(U.uTopo, 4);

// NASA-derived water mask and elevation maps, as packaged with the open-source three-globe library
const IMG_BASES = ['https://cdn.jsdelivr.net/npm/three-globe@2.43.0/example/img/', 'https://unpkg.com/three-globe@2.43.0/example/img/'];
function loadImg(name) {
  return new Promise((res, rej) => {
    let i = 0;
    const tryNext = () => {
      if (i >= IMG_BASES.length) return rej(new Error(name));
      const im = new Image(); im.crossOrigin = 'anonymous'; im.decoding = 'async';
      im.onload = () => res(im); im.onerror = () => { i++; tryNext(); };
      im.src = IMG_BASES[i] + name;
    };
    tryNext();
  });
}
const R_STATE = { real: 0, target: 0, water: 0, topo: 0, night: 0 };
loadImg('earth-water.png').then(w => {
  makeTex(3, w); R_STATE.water = 1; R_STATE.target = 1;
  loadImg('earth-topology.png').then(t => { makeTex(4, t); R_STATE.topo = 1; }).catch(() => {});
  loadImg('earth-night.jpg').then(t => { makeTex(2, t); R_STATE.night = 1; }).catch(() => {});
}).catch(() => { /* stays on the shaded land-mask fallback */ });

/* ---------- maths ---------- */
const D2R = Math.PI / 180;
const norm = v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0]/l, v[1]/l, v[2]/l]; };
const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ll = (lat, lon) => [Math.sin(lon*D2R)*Math.cos(lat*D2R), Math.sin(lat*D2R), Math.cos(lon*D2R)*Math.cos(lat*D2R)];
function slerp(a, b, t) {
  const d = clamp(dot(a, b), -1, 1), w = Math.acos(d);
  if (w < 1e-4) return a;
  const s = Math.sin(w), k1 = Math.sin((1-t)*w)/s, k2 = Math.sin(t*w)/s;
  return [a[0]*k1+b[0]*k2, a[1]*k1+b[1]*k2, a[2]*k1+b[2]*k2];
}
// globe rotation: world = Rx(pitch) * Ry(yaw) * local
function rotMat(yaw, pitch) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  // rows of M
  const r0 = [cy, 0, sy];
  const r1 = [sp*sy, cp, -sp*cy];
  const r2 = [-cp*sy, sp, cp*cy];
  return [r0, r1, r2];
}
const apply = (M, v) => [dot(M[0], v), dot(M[1], v), dot(M[2], v)];

/* ---------- state ---------- */
const HOME_YAW = -72 * D2R;
// on phones the globe rises from the bottom edge like a horizon, so tilt Delhi up onto the visible cap
const homePitch = () => (mobile ? -20 * D2R : 16 * D2R);
const S = {
  yaw: -18 * D2R, pitch: 34 * D2R, vy: 0, vp: 0,
  dragging: false, lastX: 0, lastY: 0, idle: 0, flying: null,
  intro: reduce ? 1 : 0, t0: performance.now(), time: 0,
  hover: null, selected: null,
};
const SUN0 = norm([-0.18, 0.60, -0.78]);
const SUN1 = norm([-0.45, 0.80, -0.10]);

let quality = 1, slow = 0, fast = 0;
let W = 0, H = 0, DPR = 1, center = [0, 0], scale = 1, mobile = false;
function resize() {
  const r = stage.getBoundingClientRect();
  W = r.width; H = r.height; mobile = W < 900;
  DPR = Math.min(window.devicePixelRatio || 1, 2) * quality;
  const maxPx = 8.3e6; if (W*H*DPR*DPR > maxPx) DPR = Math.sqrt(maxPx/(W*H));   // up to a full 4K frame
  glCanvas.width = Math.round(W*DPR); glCanvas.height = Math.round(H*DPR);
  const fd = Math.min(window.devicePixelRatio || 1, 2);
  fx.width = Math.round(W*fd); fx.height = Math.round(H*fd); ctx.setTransform(fd, 0, 0, fd, 0, 0);
  gl.viewport(0, 0, glCanvas.width, glCanvas.height);
}
const ro = new ResizeObserver(() => resize()); ro.observe(root); resize();

function camera() {
  const k = ease(clamp(S.intro, 0, 1));
  // globe radius as a share of the screen height, then the camera distance that gives it
  const R = mobile ? 0.62 * W / H : 0.41;
  const dist = lerp(1.16, Math.sqrt(Math.pow(1.9 / R, 2) + 1), k);
  const ty = lerp(1.02, 0, k);
  const cam = [0, lerp(0.15, 0, k), dist];
  const target = [0, ty, 0];
  const sun = norm(slerp(SUN0, SUN1, k));
  // screen placement of the globe: right of centre on desktop, low centre on phones
  const cx = mobile ? 0.5 : lerp(0.5, centerX, k);
  const cyy = mobile ? lerp(0.5, 0.25 - R, k) : 0.5;
  return { cam, target, sun, cx, cy: cyy, k };
}

function basis(cam, target) {
  const f = norm(sub(target, cam));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  return { f, r, u };
}

// project a world point; returns screen px and whether the planet hides it
function project(P, C, B) {
  const v = sub(P, C.cam);
  const z = dot(v, B.f); if (z <= 0.01) return null;
  const x = dot(v, B.r) / z * 1.9, y = dot(v, B.u) / z * 1.9;
  const sx = C.cx * W + x * H * scale, sy = H - (C.cy * H + y * H * scale);
  // occlusion: does the segment camera->P hit the unit sphere first?
  const len = Math.hypot(v[0], v[1], v[2]); const d = [v[0]/len, v[1]/len, v[2]/len];
  const b = dot(C.cam, d), c = dot(C.cam, C.cam) - 1, h = b*b - c;
  let hidden = false;
  if (h > 0) { const t = -b - Math.sqrt(h); hidden = t > 0 && t < len - 1e-3; }
  return { x: sx, y: sy, hidden, z };
}

/* ---------- routes ---------- */
const homeL = ll(HOME.lat, HOME.lon);
const routes = HUBS.map((hub, i) => {
  const L = ll(hub.lat, hub.lon);
  const ang = Math.acos(clamp(dot(homeL, L), -1, 1));
  const N = 64, pts = [];
  for (let j = 0; j <= N; j++) {
    const t = j / N, p = slerp(homeL, L, t), alt = 1 + Math.sin(Math.PI*t) * (0.03 + Math.min(ang, 1.6)*0.075);
    pts.push([p[0]*alt, p[1]*alt, p[2]*alt]);
  }
  return { hub, L, pts, delay: 0.25 + i * 0.15, speed: 0.22 + (i % 3) * 0.05, phase: i * 0.37 };
});


/* ---------- decoration: data spikes off the land, orbit rings, sparkles ---------- */
const MASKBIN = atob(PACKED);
const isLandLL = (lat, lon) => { const x = Math.min(359, Math.max(0, Math.floor(lon + 180))), y = Math.min(179, Math.max(0, Math.floor(90 - lat))); const i = y * 360 + x; return (MASKBIN.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1; };
let seed = 7; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const spikes = [];
while (spikes.length < 1400) {
  const z = rand() * 2 - 1, lon = rand() * 360 - 180, lat = Math.asin(z) / D2R;
  const onLand = isLandLL(lat, lon);
  if (!onLand && rand() > 0.12) continue;           // mostly over land, a few over the sea
  const L = ll(lat, lon);
  spikes.push({ L, h: 0.015 + Math.pow(rand(), 3) * (onLand ? 0.16 : 0.07), a: 0.4 + rand() * 0.55 });
}
const sparkles = spikes.filter((_, i) => i % 31 === 0).map(s => ({ L: s.L, ph: rand() * 6.28, sp: 0.6 + rand() * 1.2 }));
const rings = Array.from({ length: 7 }, (_, i) => {
  const ax = norm([rand() - 0.5, 1.6 + rand(), rand() - 0.5].map((v, k) => k === 1 ? v * (i % 2 ? 1 : 0.35) : v));
  const a = norm(cross(ax, [0.3, 0.1, 0.9])), b = cross(ax, a);
  return { a, b, r: 1.05 + rand() * 0.16, len: 0.45 + rand() * 0.4, speed: (0.04 + rand() * 0.06) * (i % 2 ? 1 : -1), off: rand() * 6.28, w: 0.8 + rand() * 0.6 };
});

function drawDeco(C, B, M, alpha) {
  if (alpha <= 0) return;
  const camDir = (P) => norm(sub(C.cam, P));
  // spikes: short light bars standing on the surface; edge-on near the limb they read as a corona
  ctx.lineCap = 'round';
  for (const s of spikes) {
    const P = apply(M, s.L);
    const a = project(P, C, B); if (!a || a.hidden) continue;
    const top = [P[0] * (1 + s.h), P[1] * (1 + s.h), P[2] * (1 + s.h)];
    const b = project(top, C, B); if (!b) continue;
    const edge = 1 - Math.abs(dot(P, camDir(P)));            // brighter toward the limb
    const al = s.a * alpha * (0.35 + 0.65 * edge);
    const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    g.addColorStop(0, `rgba(255,190,120,${(al*0.55).toFixed(3)})`); g.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  // orbit rings: partial loops sliding round the globe, hidden where they pass behind it
  for (const R of rings) {
    const N = 90, start = R.off + S.time * R.speed;
    let prev = null;
    for (let j = 0; j <= N; j++) {
      const t = j / N, ang = start + t * R.len * Math.PI * 2;
      const P = [ (R.a[0] * Math.cos(ang) + R.b[0] * Math.sin(ang)) * R.r, (R.a[1] * Math.cos(ang) + R.b[1] * Math.sin(ang)) * R.r, (R.a[2] * Math.cos(ang) + R.b[2] * Math.sin(ang)) * R.r ];
      const p = project(P, C, B);
      if (prev && p && !p.hidden && !prev.hidden) {
        const k = Math.sin(Math.PI * t);
        ctx.strokeStyle = `rgba(210,215,235,${(k * 0.30 * alpha).toFixed(3)})`; ctx.lineWidth = R.w;
        ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      prev = p;
    }
  }
  // sparkles: small twinkling nodes with a cross glint
  for (const s of sparkles) {
    const P = apply(M, s.L); const p = project(P, C, B); if (!p || p.hidden) continue;
    const tw = Math.max(0, Math.sin(S.time * s.sp + s.ph)); const a = tw * tw * alpha;
    if (a < 0.05) continue;
    const r = 2 + tw * 5;
    ctx.strokeStyle = `rgba(255,200,140,${(a * 0.8).toFixed(3)})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(p.x - r, p.y); ctx.lineTo(p.x + r, p.y); ctx.moveTo(p.x, p.y - r); ctx.lineTo(p.x, p.y + r); ctx.stroke();
    ctx.fillStyle = `rgba(255,235,200,${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2); ctx.fill();
  }
}

/* ---------- interaction ---------- */
function pointer(e) { const r = fx.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
let downAt = null;
if (interactive) glCanvas.addEventListener('pointerdown', e => {
  glCanvas.setPointerCapture(e.pointerId);
  S.dragging = true; S.flying = null; glCanvas.style.cursor = 'grabbing';
  [S.lastX, S.lastY] = pointer(e); downAt = [S.lastX, S.lastY, performance.now()];
  S.vy = S.vp = 0;
});
if (interactive) glCanvas.addEventListener('pointermove', e => {
  const [x, y] = pointer(e);
  if (S.dragging) {
    const k = 0.0042 * (mobile ? 1.3 : 1) / scale;
    const dx = (x - S.lastX) * k, dy = (y - S.lastY) * k;
    S.yaw += dx; S.pitch = clamp(S.pitch + dy, -1.1, 1.1);
    S.vy = dx; S.vp = dy; S.idle = 0;
    S.lastX = x; S.lastY = y;
  } else {
    S.hover = pick(x, y);
    glCanvas.style.cursor = S.hover ? 'pointer' : 'grab';
  }
});
function endDrag(e) {
  if (!S.dragging) return;
  S.dragging = false; glCanvas.style.cursor = 'grab';
  const [x, y] = pointer(e);
  if (downAt && Math.hypot(x - downAt[0], y - downAt[1]) < 5 && performance.now() - downAt[2] < 400) {
    const hit = pick(x, y);
    if (hit) select(hit); else if (S.selected) deselect();
    S.vy = S.vp = 0;
  }
}
glCanvas.addEventListener('pointerup', endDrag);
glCanvas.addEventListener('pointercancel', endDrag);
glCanvas.addEventListener('pointerleave', () => { if (!S.dragging) S.hover = null; });

let screenPins = [];
function pick(x, y) {
  let best = null, bd = 18;
  for (const p of screenPins) { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p.hub; } }
  return best;
}

function flyTo(hub) {
  S.flying = { yaw: -hub.lon * D2R, pitch: clamp(hub.lat * D2R, -0.9, 0.9) };
}
function select(hub) { S.selected = hub; flyTo(hub); onSelect && onSelect(hub); }
function deselect() { S.selected = null; onSelect && onSelect(null); }

let last = performance.now();
const INTRO_MS = 4200;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  S.time += dt;
  // keep it smooth: drop render resolution a step if frames run long, raise it again when there is headroom
  if (dt > 0.024) slow++; else slow = Math.max(0, slow - 1);
  if (dt < 0.012) fast++; else fast = 0;
  if (slow > 40 && quality > 0.5) { quality -= 0.15; slow = 0; resize(); }
  if (fast > 240 && quality < 1) { quality = Math.min(1, quality + 0.15); fast = 0; resize(); }
  R_STATE.real += (R_STATE.target - R_STATE.real) * Math.min(1, dt * 2.2);
  if (S.intro < 1) {
    S.intro = clamp((now - S.t0) / INTRO_MS, 0, 1);
    const k = ease(S.intro);
    S.yaw = lerp(-18*D2R, HOME_YAW, k); S.pitch = lerp(34*D2R, homePitch(), k);
  } else if (S.flying) {
    S.yaw += (S.flying.yaw - S.yaw) * Math.min(1, dt * 3.2);
    S.pitch += (S.flying.pitch - S.pitch) * Math.min(1, dt * 3.2);
    if (Math.abs(S.flying.yaw - S.yaw) < 1e-3 && Math.abs(S.flying.pitch - S.pitch) < 1e-3) S.flying = null;
  } else if (!S.dragging) {
    // inertia, then a slow drift back and forth around Delhi
    S.yaw += S.vy; S.pitch = clamp(S.pitch + S.vp, -1.1, 1.1);
    S.vy *= Math.pow(0.04, dt); S.vp *= Math.pow(0.04, dt);
    S.idle += dt;
    if (!S.selected && S.idle > 3.5 && !reduce) {
      const w = Math.min(1, (S.idle - 3.5) / 4) * dt * 0.22;
      S.yaw += w * 0.5;   // slow eastward spin so every region comes into view
      S.pitch += (homePitch() - S.pitch) * w;
    }
  }

  scale = 1;
  const C = camera(); const B = basis(C.cam, C.target);
  const M = rotMat(S.yaw, S.pitch);

  gl.uniform2f(U.uRes, glCanvas.width, glCanvas.height);
  gl.uniform2f(U.uCenter, C.cx * glCanvas.width, C.cy * glCanvas.height);
  gl.uniform1f(U.uScale, scale);
  gl.uniform3fv(U.uCam, C.cam); gl.uniform3fv(U.uTarget, C.target); gl.uniform3fv(U.uSun, C.sun);
  // column-major upload of M so that  n * uRot  ==  M^T n  (world -> local)
  gl.uniformMatrix3fv(U.uRot, false, new Float32Array([M[0][0], M[1][0], M[2][0], M[0][1], M[1][1], M[2][1], M[0][2], M[1][2], M[2][2]]));
  gl.uniform1f(U.uTime, S.time);
  gl.uniform1f(U.uReal, R_STATE.real); gl.uniform1f(U.uHasWater, R_STATE.water); gl.uniform1f(U.uHasTopo, R_STATE.topo); gl.uniform1f(U.uHasNight, R_STATE.night);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  drawOverlay(C, B, M);
  raf = running ? requestAnimationFrame(frame) : 0;
}

function drawOverlay(C, B, M) {
  ctx.clearRect(0, 0, W, H);
  drawDeco(C, B, M, clamp((S.intro - 0.35) / 0.4, 0, 1));
  const reveal = clamp((S.intro - 0.62) / 0.38, 0, 1); // pins and routes come in as the camera settles
  screenPins = [];
  if (reveal <= 0) return;
  const t = S.time;

  // routes
  ctx.lineCap = 'round';
  for (const R of routes) {
    const grow = clamp((reveal - R.delay * 0.5) / 0.5, 0, 1);
    if (grow <= 0) continue;
    const n = Math.floor(grow * (R.pts.length - 1));
    const proj = R.pts.slice(0, n + 1).map(p => project(apply(M, p), C, B));
    const lit = S.selected && (S.selected === R.hub || S.selected === HOME);
    ctx.lineWidth = lit ? 1.8 : 1.2;
    for (let j = 1; j < proj.length; j++) {
      const a = proj[j-1], b = proj[j]; if (!a || !b || a.hidden || b.hidden) continue;
      const fade = Math.sin(Math.PI * j / (R.pts.length - 1));
      ctx.strokeStyle = `rgba(255,214,170,${((lit ? 0.85 : 0.35) + fade * 0.2).toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    // travelling light along the route
    if (grow >= 1) {
      const head = ((t * R.speed + R.phase) % 1.3);
      if (head < 1) {
        const len = 10;
        const hi = Math.floor(head * (R.pts.length - 1));
        for (let j = Math.max(1, hi - len); j <= hi; j++) {
          const a = project(apply(M, R.pts[j-1]), C, B), b = project(apply(M, R.pts[j]), C, B);
          if (!a || !b || a.hidden || b.hidden) continue;
          const k = 1 - (hi - j) / len;
          ctx.strokeStyle = `rgba(255,190,110,${(k * 0.95).toFixed(3)})`; ctx.lineWidth = 1.2 + k * 1.6;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
  }

  // pins
  const all = [{ hub: HOME, L: homeL, home: true }, ...routes.map(r => ({ hub: r.hub, L: r.L }))];
  for (const p of all) {
    const W3 = apply(M, p.L);
    const s = project([W3[0]*1.003, W3[1]*1.003, W3[2]*1.003], C, B);
    if (!s || s.hidden) continue;
    // fade pins near the limb
    const facing = dot(W3, norm(sub(C.cam, W3)));
    const a = clamp(facing * 4, 0, 1) * reveal;
    if (a <= 0.02) continue;
    screenPins.push({ x: s.x, y: s.y, hub: p.hub });
    const active = S.selected === p.hub || S.hover === p.hub;
    if (p.home) {
      for (let k = 0; k < 2; k++) {
        const ph = (t * 0.6 + k * 0.5) % 1;
        ctx.strokeStyle = `rgba(255,255,255,${((1 - ph) * 0.6 * a).toFixed(3)})`; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(s.x, s.y, 5 + ph * 22, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(s.x, s.y, 4.5, 0, Math.PI*2); ctx.fill();
      ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
      const label = 'NEW DELHI · HQ';
      const w = ctx.measureText(label).width + 16;
      ctx.fillStyle = `rgba(35,64,142,${0.88 * a})`; ctx.fillRect(s.x + 14, s.y - 11, w, 22);
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillText(label, s.x + 22, s.y + 4);
    } else {
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, active ? 16 : 11);
      g.addColorStop(0, `rgba(255,170,90,${0.6 * a})`); g.addColorStop(1, 'rgba(255,150,70,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, active ? 16 : 11, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = `rgba(255,230,195,${a})`; ctx.beginPath(); ctx.arc(s.x, s.y, active ? 4 : 3, 0, Math.PI*2); ctx.fill();
      if (active) { ctx.strokeStyle = `rgba(255,255,255,${0.8*a})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(s.x, s.y, 8, 0, Math.PI*2); ctx.stroke(); }
      // always-on region label
      for (let k = 0; k < 1; k++) {
        const ph = (S.time * 0.5 + p.hub.lat * 0.01) % 1;
        ctx.strokeStyle = `rgba(255,190,120,${((1 - ph) * 0.5 * a).toFixed(3)})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(s.x, s.y, 4 + ph * 16, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
      const lab = p.hub.name.toUpperCase();
      const lw = ctx.measureText(lab).width + 14;
      ctx.fillStyle = `rgba(10,22,64,${0.78 * a})`; ctx.fillRect(s.x + 12, s.y - 10, lw, 20);
      ctx.strokeStyle = `rgba(143,176,255,${0.35 * a})`; ctx.strokeRect(s.x + 12.5, s.y - 9.5, lw - 1, 19);
      ctx.fillStyle = `rgba(235,240,255,${a})`; ctx.fillText(lab, s.x + 19, s.y + 4);
    }
  }


}
let running = true, raf = requestAnimationFrame(frame);
return {
  flyTo(hub) { S.selected = hub; S.idle = 0; flyTo(hub); },
  reset() { S.selected = null; S.idle = 0; S.flying = { yaw: HOME_YAW, pitch: homePitch() }; },
  setRunning(on) { if (on === running) return; running = on; if (on) { last = performance.now(); raf = requestAnimationFrame(frame); } else if (raf) { cancelAnimationFrame(raf); raf = 0; } },
  destroy() { running = false; if (raf) cancelAnimationFrame(raf); ro.disconnect(); const lose = gl.getExtension('WEBGL_lose_context'); lose && lose.loseContext(); root.removeChild(glCanvas); root.removeChild(fx); },
};

}
