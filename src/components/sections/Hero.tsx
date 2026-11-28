import { useEffect, useRef, useState } from 'react';
import { onReady } from '@/lib/ready';
import { corridors, homeHub } from '@/data/globe';
import './hero-globe.css';

/**
 * Full-viewport hero over a looping dotted-globe video (two copies cross-fade at the loop
 * point so the jump never shows). Country markers are projected onto the globe every frame
 * from the video's own clock, so they turn with the continents.
 */

// Globe geometry inside the 1920x1080 clip, solved against the footage:
// centre x/y, radius (px), view tilt (deg) — used for an orthographic projection.
const G = { cx: 994.57, cy: 1017.61, r: 529.95, tilt: -1.97 };
const VW = 1920;
const VH = 1080;
// Longitude at the centre of the view for a clip time (s). The clip pans, dissolves to a
// second pan at ~5.7s, then pans again; markers fade through the dissolve.
const centreLon = (t: number) => (t < 5.7 ? 28.5 - 18.5 * t : 78.5 - 17.75 * (t - 6));
const dissolve = (t: number) => {
  const a = 5.4;
  const b = 6.0;
  if (t < a || t > b) return 1;
  return Math.abs((t - (a + b) / 2) / ((b - a) / 2));
};

interface Marker {
  label: string;
  lat: number;
  lon: number;
  home?: boolean;
}
const hub = (name: string) => {
  const h = corridors.flatMap((c) => c.hubs).find((x) => x.name === name)!;
  return { lat: h.lat, lon: h.lon };
};
const MARKERS: Marker[] = [
  { label: 'New Delhi · HQ', lat: homeHub.lat, lon: homeHub.lon, home: true },
  { label: 'China', ...hub('Shenzhen') },
  { label: 'Japan', ...hub('Tokyo') },
  { label: 'Indonesia', ...hub('Jakarta') },
  { label: 'Italy', ...hub('Milan') },
  { label: 'Slovakia', ...hub('Bratislava') },
  { label: 'Kenya', ...hub('Mombasa') },
  { label: 'South Africa', ...hub('Cape Town') },
  { label: 'UAE', lat: 25.2, lon: 55.27 },
  { label: 'United Kingdom', lat: 51.5, lon: -0.12 },
  { label: 'USA', lat: 40.7, lon: -74.0 },
  { label: 'Brazil', lat: -23.55, lon: -46.63 },
];

const D = Math.PI / 180;
function project(lat: number, lon: number, lon0: number) {
  const f = lat * D;
  const d = (lon - lon0) * D;
  const f0 = G.tilt * D;
  const x = G.cx + G.r * Math.cos(f) * Math.sin(d);
  const y = G.cy - G.r * (Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(d));
  const z = Math.cos(f0) * Math.cos(f) * Math.cos(d) + Math.sin(f0) * Math.sin(f);
  return { x, y, z };
}

const Arrow = () => (
  <svg className="arw" viewBox="0 0 12 10" fill="none" aria-hidden="true">
    <path d="M0.8 5h10M7.1 1.4 10.9 5l-3.8 3.6" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Hero() {
  const bgRef = useRef<HTMLDivElement>(null);
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  const pinRefs = useRef<(HTMLDivElement | null)[]>([]);
  const innerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'wait' | 'go' | 'done'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'done' : 'wait',
  );

  // Entrance: plays once the preloader and fonts are ready, then the classes come off.
  useEffect(() => {
    if (phase !== 'wait') return;
    let safety = 0;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      setPhase('go');
      safety = window.setTimeout(() => setPhase('done'), 2600);
    };
    const off = onReady(() => {
      const ceiling = window.setTimeout(start, 900);
      const f = document.fonts;
      if (f?.ready) f.ready.then(() => { clearTimeout(ceiling); start(); }, start);
      else start();
    });
    return () => {
      off();
      clearTimeout(safety);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Two-copy cross-fade loop + marker tracking.
  useEffect(() => {
    const A = aRef.current;
    const B = bRef.current;
    const box = bgRef.current;
    if (!A || !B || !box) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const play = (v: HTMLVideoElement) => {
      const p = v.play();
      if (p) p.catch(() => {});
    };
    const FADE = 0.9;
    let cur = A;
    let nxt = B;
    let swapping = false;
    let timer = 0;
    const tick = () => {
      if (swapping || !cur.duration) return;
      if (cur.duration - cur.currentTime > FADE) return;
      swapping = true;
      const out = cur;
      nxt.currentTime = 0;
      play(nxt);
      nxt.classList.add('is-active');
      out.classList.remove('is-active');
      cur = nxt;
      nxt = out;
      timer = window.setTimeout(() => {
        out.pause();
        out.currentTime = 0;
        swapping = false;
      }, FADE * 1000 + 100);
    };

    if (reduce) {
      A.removeAttribute('autoplay');
      A.pause();
      B.pause();
      try {
        A.currentTime = 0;
      } catch {
        /* not seekable yet */
      }
    } else {
      play(A);
      A.addEventListener('timeupdate', tick);
      B.addEventListener('timeupdate', tick);
    }

    // Place the markers every frame from the active clip's time.
    let raf = 0;
    // text lines (relative to the bleed box) that a marker label must not sit on
    type Box = { l: number; t: number; r: number; b: number };
    let keep: Box[] = [];
    let widths: number[] = [];
    const measure = () => {
      const inner = innerRef.current;
      if (!inner) return;
      const bb = box.getBoundingClientRect();
      const nodes = inner.querySelectorAll<HTMLElement>('.agsh-eyebrow, .ln-i, .ctas .btn');
      const rects: DOMRect[] = [];
      nodes.forEach((n) => rects.push(...Array.from(n.getClientRects())));
      // each rendered line of the paragraph
      const sub = inner.querySelector('.sub');
      if (sub) {
        const range = document.createRange();
        range.selectNodeContents(sub);
        rects.push(...Array.from(range.getClientRects()));
      }
      keep = rects.map((r) => ({ l: r.left - bb.left - 6, t: r.top - bb.top - 4, r: r.right - bb.left + 6, b: r.bottom - bb.top + 4 }));
      widths = pinRefs.current.map((el) => (el ? el.offsetWidth : 0));
    };
    measure();
    const remeasure = window.setTimeout(measure, 1500);
    const place = () => {
      const W = box.clientWidth;
      const H = box.clientHeight;
      const s = Math.max(W / VW, H / VH); // object-fit: cover
      const ox = (W - VW * s) * 0.51; // object-position: 51% 8%
      const oy = (H - VH * s) * 0.08;
      const t = reduce ? 0 : cur.currentTime || 0;
      const lon0 = centreLon(t);
      const k = dissolve(t);
      MARKERS.forEach((m, i) => {
        const el = pinRefs.current[i];
        if (!el) return;
        const { x, y, z } = project(m.lat, m.lon, lon0);
        // fade in from the limb, gone on the far side
        const px = ox + x * s;
        const py = oy + y * s;
        const w = widths[i] || 120;
        const behindText = keep.some((r) => px - 8 < r.r && px + w > r.l && py - 11 < r.b && py + 11 > r.t);
        const vis = Math.max(0, Math.min(1, (z - 0.12) / 0.25)) * k * (behindText ? 0 : 1);
        el.style.opacity = vis.toFixed(3);
        el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
      });
      if (!reduce) raf = requestAnimationFrame(place);
    };
    place();
    const onResize = () => {
      measure();
      place();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      clearTimeout(remeasure);
      A.removeEventListener('timeupdate', tick);
      B.removeEventListener('timeupdate', tick);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section id="home" aria-label="Introduction" className={`agsh ${phase === 'done' ? '' : 'anim'} ${phase === 'go' ? 'go' : ''}`}>
      <div className="agsh-bg" ref={bgRef} role="img" aria-label="Dotted globe of the Earth turning slowly, with New Delhi and the countries AGS sources from marked">
        <video ref={aRef} className="agsh-video is-active" autoPlay muted loop playsInline preload="auto" disablePictureInPicture aria-hidden="true" poster="/videos/hero-globe.jpg">
          <source src="/videos/hero-globe.mp4" type="video/mp4" />
        </video>
        <video ref={bRef} className="agsh-video" muted loop playsInline preload="auto" disablePictureInPicture aria-hidden="true" poster="/videos/hero-globe.jpg">
          <source src="/videos/hero-globe.mp4" type="video/mp4" />
        </video>
        <div className="agsh-pins" aria-hidden="true">
          {MARKERS.map((m, i) => (
            <div
              key={m.label}
              ref={(el) => {
                pinRefs.current[i] = el;
              }}
              className={`agsh-pin ${m.home ? 'is-home' : ''}`}
              style={{ opacity: 0 }}
            >
              <span className="agsh-dot" />
              <span className="agsh-tag">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="agsh-inner" ref={innerRef}>
        <p className="agsh-eyebrow">Sourcing &amp; supply</p>
        <h1>
          <span className="ln">
            <span className="ln-i">Sourced. Checked.</span>
          </span>
          <span className="ln">
            <span className="ln-i agsh-accent">Delivered.</span>
          </span>
        </h1>
        <p className="sub">
          Tell us the product and the quantity.{' '}
          <br />
          We find verified suppliers, check the goods{' '}
          <br />
          and ship them to your door.
        </p>
        <div className="ctas">
          <a href="#contact" className="btn btn-lg btn-primary">
            Request a quote <Arrow />
          </a>
          <a
            href="#catalogue"
            className="btn btn-lg btn-ghost"
            onAnimationEnd={(e) => {
              if (e.animationName === 'agshPill') setPhase('done');
            }}
          >
            What we source <Arrow />
          </a>
        </div>
      </div>
    </section>
  );
}
