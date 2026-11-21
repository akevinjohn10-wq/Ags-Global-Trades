import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Handshake, Receipt, Truck } from 'lucide-react';
import { services } from '@/data/siteContent';

const VALUES = [
  { title: 'Verified suppliers', text: 'Every maker is checked before we place your order.', icon: BadgeCheck },
  { title: 'One point of contact', text: 'A named manager from enquiry to delivery.', icon: Handshake },
  { title: 'Clear, honest quotes', text: 'Product, packing and shipping in one price.', icon: Receipt },
  { title: 'Shipping handled', text: 'Booked with trusted shipping and courier partners.', icon: Truck },
];

// The sea leg is a seamless 20 s loop of an overhead container-ship clip that plays on its own,
// so the water keeps moving while the page is still; scroll drives the camera pull-back and the copy
const SEA_SRC = { desk: '/story/sea-1080.mp4', phone: '/story/sea-720.mp4', poster: '/story/sea-poster.jpg' };
const PART = (n: string) => `/story/parts/${n}.webp`;
// Road leg: an aerial forest tile (1600 x 2400, road down the middle) that scrolls under the truck
// Scroll length of each leg, in screens (vh): loading, then the ship at sea, then the port at night.
// The last screen of scrolling belongs to the next section rising through the clouds.
const LOAD_VH = { desk: 171.7, phone: 106.6 };
const SEA_END_VH = { desk: 390, phone: 245 };
let P_LOAD = 0.26;
let P_PORT = 0.58;
let P_SEA = 0.85; // where the port leg ends and the clouds take over
// Night port, arriving: an overhead ship at the quay, then the container yard
const PORT_SRC = {
  ship: { desk: '/story/port-ship-1080.mp4', phone: '/story/port-ship-720.mp4', poster: '/story/port-ship-poster.jpg' },
  yard: { desk: '/story/port-yard-1080.mp4', phone: '/story/port-yard-720.mp4', poster: '/story/port-yard-poster.jpg' },
};
const LABELS = ['Loaded', 'At sea', 'In port', 'Delivered'];

// Side-view sprite geometry, in units of the truck's height (H), measured from the cut-outs
const TRUCK_W = 1188 / 556;
const FORK_H = 0.66;
const FORK_W = FORK_H * (963 / 577);
const SF = FORK_H / 577;
const CARRIAGE = { left: 668 * SF, top: 222 * SF, w: 295 * SF, h: 326 * SF };
const FORK_TOP = (577 - 512) * SF;
const CRATE_W = 0.44;
const CRATE_H = CRATE_W * (498 / 900);
const CRATE_OFFSET = 690 * SF;
const TRUCK_FLOOR = 0.28;
const LIFT = TRUCK_FLOOR - FORK_TOP + 0.012;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const window01 = (p: number, a: number, b: number, edge = 0.25) => {
  const t = seg(p, a, b);
  return ease(Math.min(clamp(t / edge), clamp((1 - t) / edge)));
};

/**
 * Paints soft clouds once into a small bitmap. Moving a pre-drawn image is cheap; blurring a
 * tall layer on every frame is what made the cloud transition stutter.
 */
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

/**
 * The scroll story. On a white page the forklift loads the crate into the truck, which drives off
 * and the road leg is an aerial film of it driving through the forest; the sea leg plays from the brand
 * film; then the sky clears and the clouds close over the screen into the product section below.
 */
export default function Story() {
  const [reduce] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (reduce) return <StoryStatic />;
  return <StoryFilm />;
}

function StoryFilm() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const seaGlareRef = useRef<HTMLDivElement>(null);
  const dipRef = useRef<HTMLDivElement>(null);
  // leg 1
  const loadRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLDivElement>(null);
  const laneRef = useRef<HTMLDivElement>(null);
  const truckRef = useRef<HTMLDivElement>(null);
  const forkRef = useRef<HTMLDivElement>(null);
  const carriageRef = useRef<HTMLImageElement>(null);
  const crateRef = useRef<HTMLImageElement>(null);
  // fog from the loading bay onto the sea
  const bayRef = useRef<HTMLDivElement>(null);
  const bayFogRef = useRef<HTMLDivElement>(null);
  const bayFogTexRef = useRef<HTMLDivElement>(null);
  const treesRef = useRef<HTMLDivElement>(null);
  const treeLayerRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  // leg 3: dusk falls, the port at night
  const duskRef = useRef<HTMLDivElement>(null);
  const portRef = useRef<HTMLDivElement>(null);
  const portShipRef = useRef<HTMLVideoElement>(null);
  const portYardRef = useRef<HTMLVideoElement>(null);
  // leg 4
  const skyRef = useRef<HTMLDivElement>(null);
  const skyLightRef = useRef<HTMLDivElement>(null);
  const cloudsBackRef = useRef<HTMLDivElement>(null);
  const cloudsFrontRef = useRef<HTMLDivElement>(null);
  const bankRef = useRef<HTMLDivElement>(null);
  const bankTopRef = useRef<HTMLDivElement>(null);
  const copyRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const serviceRefs = useRef<(HTMLLIElement | null)[]>([]);
  const valueRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;
    video.muted = true; // React does not always write the muted attribute, and autoplay needs it

    // ---------- sea film ----------
    let started = false;
    let seaOn = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started) return;
        started = true;
        const small = window.innerWidth < 768;
        video.src = small ? SEA_SRC.phone : SEA_SRC.desk;
        video.load();
        for (const [el, src] of [[portShipRef.current, PORT_SRC.ship], [portYardRef.current, PORT_SRC.yard]] as const) {
          if (!el) continue;
          el.muted = true;
          el.src = small ? src.phone : src.desk;
          el.load();
        }
      },
      { rootMargin: '120% 0px' },
    );
    io.observe(section);
    // only plays while the sea is on screen, to save battery
    const playSea = (on: boolean) => {
      if (on === seaOn) return;
      seaOn = on;
      if (on) video.play().catch(() => {});
      else video.pause();
    };
    const playing = new Map<HTMLVideoElement, boolean>();
    const playIf = (el: HTMLVideoElement | null, on: boolean) => {
      if (!el || playing.get(el) === on) return;
      playing.set(el, on);
      if (on) el.play().catch(() => {});
      else el.pause();
    };


    // ---------- layout ----------
    let H = 200; // side-view truck height
    let T = 600; // side-view truck rear x
    let vw = 1440;
    let vh = 900;
    let Wr = 200; // road width
    const size = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      const mobile = vw < 768;
      H = mobile ? vw * 0.24 : Math.min(vh * 0.26, vw * 0.15);
      T = vw * (mobile ? 0.38 : 0.5);
      Wr = mobile ? Math.min(vh * 0.2, vw * 0.36) : vh * 0.22;
      loadRef.current?.style.setProperty('--h', `${H}px`);
      if (groundRef.current) groundRef.current.style.height = `${Wr}px`;
      if (treesRef.current) treesRef.current.style.bottom = `${Wr - 2}px`;
      if (truckRef.current?.parentElement) truckRef.current.parentElement.style.bottom = `${Wr}px`;

      // Clouds, painted once for this screen shape
      const aspect = (2.2 * vh) / vw;
      if (cloudsBackRef.current) cloudsBackRef.current.style.backgroundImage = paintClouds(7, 44, 0.5, 10, 30, aspect);
      if (cloudsFrontRef.current) cloudsFrontRef.current.style.backgroundImage = paintClouds(31, 34, 0.8, 12, 36, aspect);
      if (bankTopRef.current) bankTopRef.current.style.backgroundImage = paintClouds(91, 16, 1, 24, 44, (0.6 * vh) / vw);

      update();
    };

    const set = (el: Element | null, css: Partial<CSSStyleDeclaration>) => {
      if (el) Object.assign((el as HTMLElement).style, css);
    };

    let raf = 0;
    let lastScene = -1;
    function update() {
      raf = 0;
      const rect = section!.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = span > 0 ? clamp(-rect.top / span) : 0;
      if (span > 0) {
        P_SEA = 1 - window.innerHeight / span;
        const spanVh = (span / window.innerHeight) * 100;
        const desk = window.innerWidth >= 768; // the section's md: height
        P_LOAD = (desk ? LOAD_VH.desk : LOAD_VH.phone) / spanVh;
        P_PORT = (desk ? SEA_END_VH.desk : SEA_END_VH.phone) / spanVh;
      }
      const sc = p < P_LOAD ? 0 : p < P_PORT ? 1 : p < P_SEA ? 2 : 3;
      if (sc !== lastScene) {
        lastScene = sc;
        setScene(sc);
      }

      // ---- Leg 1: loading (side view) ----
      const l = seg(p, 0, P_LOAD);
      const startX = -FORK_W * H - CRATE_W * H - 40;
      const readyX = T - (CRATE_OFFSET + CRATE_W + 0.04) * H;
      const pushedX = T - (CRATE_OFFSET - 0.06) * H;
      let forkX = lerp(startX, readyX, easeOut(seg(l, 0, 0.3)));
      forkX = lerp(forkX, pushedX, ease(seg(l, 0.45, 0.62)));
      forkX = lerp(forkX, startX, easeIn(seg(l, 0.68, 0.88)));
      const lift = (ease(seg(l, 0.3, 0.44)) - ease(seg(l, 0.63, 0.72))) * LIFT * H;
      // the truck only starts to roll as the fog comes in
      const truckX = T + easeIn(seg(l, 0.8, 1)) * vw * 0.06;
      set(forkRef.current, { transform: `translate3d(${forkX.toFixed(1)}px,0,0)` });
      set(carriageRef.current, { transform: `translate3d(0,${(-lift).toFixed(1)}px,0)` });
      set(crateRef.current, {
        transform: `translate3d(${(forkX + CRATE_OFFSET * H).toFixed(1)}px,${(-(FORK_TOP * H) - lift).toFixed(1)}px,0)`,
        opacity: l > 0.63 ? '0' : '1',
      });
      set(truckRef.current, { transform: `translate3d(${truckX.toFixed(1)}px,0,0)` });
      set(laneRef.current, { backgroundPositionX: `${(-easeIn(seg(l, 0.8, 1)) * vw * 0.06).toFixed(0)}px` });

      // ---- Out to sea: mist rolls in over the yard until it is all fog, then the fog clears from the
      // edges inward onto the ship at sea, seen close from above
      const lt = seg(p, P_LOAD - 0.06, P_LOAD + 0.06);
      const c1x = T + vw * 0.06 + (TRUCK_W * H) / 2;
      const bandY = vh - Wr / 2;
      set(loadRef.current, { visibility: p < P_LOAD + 0.06 ? 'visible' : 'hidden' });
      // the mist drifts at three depths as the scene plays
      const drift = l + lt * 0.6;
      [60, 140, 260].forEach((d, i) => set(treeLayerRefs[i].current, { backgroundPositionX: `${(-drift * d).toFixed(1)}px` }));
      const fogIn = ease(seg(lt, 0, 0.45));
      const clear = ease(seg(lt, 0.5, 1));
      if (clear > 0 && clear < 1) {
        const rx = lerp(230, 0, clear);
        const m = `radial-gradient(ellipse ${rx.toFixed(1)}% ${(rx * 0.85).toFixed(1)}% at ${c1x.toFixed(0)}px ${bandY.toFixed(0)}px, #000 0%, #000 45%, transparent 100%)`;
        set(bayFogRef.current, { maskImage: m, webkitMaskImage: m } as Partial<CSSStyleDeclaration>);
      } else {
        set(bayFogRef.current, { maskImage: 'none', webkitMaskImage: 'none' } as Partial<CSSStyleDeclaration>);
      }
      set(bayFogRef.current, { opacity: String(clear >= 1 ? 0 : fogIn * (1 - ease(seg(clear, 0.65, 1)))) });
      set(bayFogTexRef.current, { transform: `translate3d(${(-lt * 6).toFixed(2)}%,${(-lt * 10).toFixed(2)}%,0)` });
      set(bayRef.current, { opacity: String(1 - seg(lt, 0.4, 0.5)) });
      set(groundRef.current, { opacity: String(1 - seg(lt, 0.4, 0.5)) });
      set(truckRef.current?.parentElement ?? null, { opacity: String(1 - seg(lt, 0.4, 0.5)) });

      // ---- Leg 2: sea (film) ----
      if (p >= P_LOAD - 0.01 && p < P_PORT + 0.03) {
        playSea(true);
        // opens close on the containers, then pulls back to the ship in open water
        const seaZoom = lerp(2.6, 1, ease(seg(p, P_LOAD, P_LOAD + (P_PORT - P_LOAD) * 0.45)));
        set(video, { transform: `scale(${seaZoom.toFixed(4)})` });
        // the glare is strongest as the cloud clears, then burns off while the camera pulls back
        const sg = 1 - ease(seg(p, P_LOAD + 0.03, P_LOAD + (P_PORT - P_LOAD) * 0.3));
        set(seaGlareRef.current, { opacity: sg.toFixed(3), transform: `translate3d(${(-(1 - sg) * 3).toFixed(2)}%,${(-(1 - sg) * 4).toFixed(2)}%,0)` });
      } else {
        playSea(false);
        set(seaGlareRef.current, { opacity: '0' });
      }

      // ---- Leg 3: dusk falls over the sea, and the ship comes into port at night ----
      const dusk = ease(seg(p, P_LOAD + (P_PORT - P_LOAD) * 0.72, P_PORT + 0.01));
      set(duskRef.current, { opacity: dusk.toFixed(3) });
      const inPort = p > P_PORT - 0.04 && p < P_SEA + 0.02;
      set(portRef.current, { visibility: inPort ? 'visible' : 'hidden', opacity: ease(seg(p, P_PORT - 0.03, P_PORT + 0.02)).toFixed(3) });
      const q = seg(p, P_PORT, P_SEA);
      const yard = ease(seg(q, 0.48, 0.6));
      set(portShipRef.current, { transform: `scale(${lerp(1.14, 1.02, ease(seg(q, 0, 0.6))).toFixed(4)})`, opacity: (1 - yard).toFixed(3) });
      set(portYardRef.current, { transform: `scale(${lerp(1.0, 1.1, q).toFixed(4)})`, opacity: yard.toFixed(3) });
      playIf(portShipRef.current, inPort && yard < 1);
      playIf(portYardRef.current, inPort && yard > 0);

      let dip = 0;
      for (const b of [] as number[]) dip = Math.max(dip, 1 - Math.abs(p - b) / 0.02);
      set(dipRef.current, { opacity: String(clamp(dip) * 0.9) });

      // ---- Leg 4: through the clouds into the page below ----
      const u = seg(p, P_SEA, 1);
      set(skyRef.current, { visibility: p > P_SEA - 0.01 ? 'visible' : 'hidden' });
      if (p > P_SEA - 0.01) {
        set(cloudsBackRef.current, { transform: `translate3d(0,${(-55 + u * 70).toFixed(2)}%,0)` });
        set(cloudsFrontRef.current, { transform: `translate3d(0,${(-65 + u * 110).toFixed(2)}%,0)` });
        // the cloud edge rides just ahead of the next section's top edge as it scrolls up
        set(bankRef.current, { transform: `translate3d(0,${(((1.15 - u) / 1.5) * 100).toFixed(2)}%,0)` });
      }

      // ---- Copy ----
      const ranges: [number, number][] = [
        [-1, P_LOAD - 0.06],
        [P_LOAD + (P_PORT - P_LOAD) * 0.38, P_PORT - 0.02], // after the pull-back, like the reference
        [P_PORT + (P_SEA - P_PORT) * 0.12, P_SEA - 0.02],
      ];
      ranges.forEach(([a, b], k) => {
        const el = copyRefs[k].current;
        if (!el) return;
        const o = k === 0 ? clamp((b - p) / 0.05) : window01(p, a, b, 0.22);
        el.style.opacity = String(o);
        el.style.transform = `translate3d(0, ${((1 - o) * 30).toFixed(1)}px, 0)`;
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      });
      serviceRefs.current.forEach((li, k) => {
        if (!li) return;
        const t = ease(seg(p, P_LOAD + (P_PORT - P_LOAD) * 0.42 + k * 0.018, P_LOAD + (P_PORT - P_LOAD) * 0.42 + 0.03 + k * 0.018));
        li.style.opacity = String(t);
        li.style.transform = `translate3d(0, ${((1 - t) * 18).toFixed(1)}px, 0)`;
      });
      valueRefs.current.forEach((li, k) => {
        if (!li) return;
        const t = ease(seg(p, P_PORT + (P_SEA - P_PORT) * 0.16 + k * 0.025, P_PORT + (P_SEA - P_PORT) * 0.16 + 0.04 + k * 0.025));
        li.style.opacity = String(t);
        li.style.transform = `translate3d(${((1 - t) * (k % 2 ? 24 : -24)).toFixed(1)}px, 0, 0)`;
      });
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    size();
    const ro = new ResizeObserver(size);
    ro.observe(section);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unit = (n: number) => `calc(var(--h) * ${n.toFixed(4)})`;

  return (
    <section ref={sectionRef} id="services" aria-label="Our services" className="relative h-[565vh] scroll-mt-24 md:h-[750vh] bg-space text-white">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* ---------- Sea film ---------- */}
        <video
          ref={videoRef}
          aria-hidden="true"
          muted
          loop
          playsInline
          preload="none"
          poster={SEA_SRC.poster}
          className="absolute inset-0 h-full w-full origin-[50%_47%] object-cover will-change-transform"
        />
        {/* dimmed into the page's navy so the film sits in the background */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_65%_at_50%_50%,rgba(7,11,28,0.15)_30%,rgba(7,11,28,0.85))]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[rgba(10,20,52,0.38)]" />
        {/* sun glare over the first close-up frames: the cloud's white burns off into sunlight on the water */}
        <div ref={seaGlareRef} aria-hidden="true" className="pointer-events-none absolute -inset-[10%] mix-blend-screen will-change-transform" style={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-[radial-gradient(45%_40%_at_62%_22%,rgba(255,246,226,0.95)_0%,rgba(255,226,180,0.55)_30%,rgba(255,206,150,0)_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(90%_80%_at_62%_22%,rgba(255,236,210,0.35)_0%,rgba(255,236,210,0)_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,240,220,0.22)_0%,rgba(255,240,220,0)_55%)]" />
        </div>

        {/* dusk: the light goes down over the sea before the ship reaches port */}
        <div ref={duskRef} aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-[rgba(6,10,30,0.55)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,150,80,0.16),rgba(255,150,80,0)_45%)] mix-blend-screen" />
        </div>

        {/* ---------- Leg 3: the port at night ---------- */}
        <div ref={portRef} aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#05070f]" style={{ visibility: 'hidden', opacity: 0 }}>
          <video ref={portShipRef} muted loop playsInline preload="none" poster={PORT_SRC.ship.poster} className="absolute inset-0 h-full w-full object-cover will-change-transform" />
          <video ref={portYardRef} muted loop playsInline preload="none" poster={PORT_SRC.yard.poster} className="absolute inset-0 h-full w-full object-cover will-change-transform" style={{ opacity: 0 }} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_50%,rgba(5,8,22,0)_45%,rgba(5,8,22,0.7))]" />
          <div className="pointer-events-none absolute inset-0 bg-[rgba(8,14,40,0.14)]" />
          {/* keeps the copy readable over the lit container yard */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,10,28,0.7)_0%,rgba(6,10,28,0.15)_32%,rgba(6,10,28,0.15)_55%,rgba(6,10,28,0.65)_100%)]" />
        </div>

        {/* ---------- Leg 1: loading, on white ---------- */}
        <div ref={loadRef} className="absolute inset-0 z-[1] text-ink" style={{ ['--h' as string]: '200px' }}>
          {/* a foggy morning behind the yard */}
          <div ref={bayRef} aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_bottom,#C9D0D2_0%,#DCE1E2_40%,#EDEFEE_80%,#F4F5F4_100%)]">
            {/* drifting morning mist, thickest along the horizon */}
            <div ref={treesRef} className="absolute inset-x-0 top-0" style={{ bottom: '22%' }}>
              <div ref={treeLayerRefs[0]} className="absolute -inset-x-[30%] inset-y-0 opacity-50" style={{ backgroundImage: `url(${PART('fog-a')})`, backgroundSize: '1400px 1400px' }} />
              <div ref={treeLayerRefs[1]} className="absolute -inset-x-[30%] inset-y-0 opacity-40" style={{ backgroundImage: `url(${PART('fog-b')})`, backgroundSize: '900px 900px', backgroundPosition: '300px 200px' }} />
              <div ref={treeLayerRefs[2]} className="absolute -inset-x-[30%] bottom-0 h-[45%] opacity-70" style={{ backgroundImage: `url(${PART('fog-a')})`, backgroundSize: '700px 700px', backgroundPosition: '0 100%', maskImage: 'linear-gradient(to top, #000 30%, transparent)', WebkitMaskImage: 'linear-gradient(to top, #000 30%, transparent)' }} />
              <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[linear-gradient(to_top,rgba(246,247,246,0.95),rgba(246,247,246,0))]" />
            </div>
          </div>
          <div ref={groundRef} className="absolute inset-x-0 bottom-0 bg-[#2a2c2f] bg-repeat-x" style={{ height: '22%', backgroundImage: `url(${PART('ground-side')})`, backgroundSize: 'auto 100%' }}>
            <div
              ref={laneRef}
              aria-hidden="true"
              className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2"
              style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.55) 0 50%, transparent 50% 100%)', backgroundSize: '54px 3px' }}
            />
          </div>
          <div aria-hidden="true" className="absolute inset-x-0" style={{ bottom: '22%' }}>
            <div ref={forkRef} className="absolute bottom-0 left-0" style={{ width: unit(FORK_W), height: unit(FORK_H) }}>
              <div aria-hidden="true" className="absolute -bottom-[5%] left-[2%] right-[10%] h-[11%] rounded-[50%] bg-black/40 blur-[5px]" />
              <img src={PART('forklift')} alt="" className="absolute inset-0 h-full w-full" draggable={false} />
              <img
                ref={carriageRef}
                src={PART('carriage')}
                alt=""
                draggable={false}
                className="absolute"
                style={{ left: unit(CARRIAGE.left), top: unit(CARRIAGE.top), width: unit(CARRIAGE.w), height: unit(CARRIAGE.h) }}
              />
            </div>
            <img ref={crateRef} src={PART('crate')} alt="" draggable={false} className="absolute bottom-0 left-0" style={{ width: unit(CRATE_W), height: unit(CRATE_H) }} />
            <div ref={truckRef} className="absolute bottom-0 left-0" style={{ width: unit(TRUCK_W), height: unit(1) }}>
              <div aria-hidden="true" className="absolute -bottom-[4%] left-[1%] right-[3%] h-[9%] rounded-[50%] bg-black/45 blur-[6px]" />
              <img src={PART('truck')} alt="" className="absolute inset-0 h-full w-full" draggable={false} />
            </div>
          </div>
          <div ref={bayFogRef} aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-[#E4E9E7]" />
            <div ref={bayFogTexRef} className="absolute -inset-[20%] will-change-transform" style={{ backgroundImage: `url(${PART('fog-a')}), url(${PART('fog-b')})`, backgroundSize: '1000px 1000px, 700px 700px' }} />
          </div>
        </div>

        {/* ---------- Leg 4: sky ---------- */}
        <div ref={skyRef} className="absolute inset-0 overflow-hidden" style={{ visibility: 'hidden' }}>
          <div ref={skyLightRef} className="absolute inset-0 opacity-0 bg-[linear-gradient(to_bottom,#C9D1E4_0%,#E4E8F1_55%,#FFFFFF_100%)]" />
          <div ref={cloudsBackRef} aria-hidden="true" className="absolute inset-x-0 hidden top-0 h-[220%] will-change-transform" style={{ backgroundSize: '100% 100%' }} />
          <div ref={cloudsFrontRef} aria-hidden="true" className="pointer-events-none hidden absolute inset-x-0 top-0 h-[220%] will-change-transform" style={{ backgroundSize: '100% 100%' }} />
          <div ref={bankRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[150%] will-change-transform" style={{ transform: 'translate3d(0,100%,0)' }}>
            <div ref={bankTopRef} className="absolute inset-x-0 top-0 h-[40%]" style={{ backgroundSize: '100% 100%', WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 45%)', maskImage: 'linear-gradient(to bottom, transparent, #000 45%)' }} />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(244,246,251,0.35)_8%,rgba(255,255,255,0.9)_18%,#FFFFFF_23%)]" />
          </div>
        </div>

        <div ref={dipRef} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-space" style={{ opacity: 0 }} />

        {/* ---------- Copy ---------- */}
        <div ref={copyRefs[0]} className="container-x absolute inset-x-0 top-0 z-[2] pt-28 text-ink sm:pt-32">
          <p className="eyebrow">Our services</p>
          <h2 className="mt-5 max-w-3xl text-[36px] font-medium leading-[1.02] sm:text-[56px] lg:text-[64px]">Every order, packed and on its way.</h2>
          <p className="mt-5 max-w-md text-[16px] leading-[1.65] text-muted sm:text-[17px]">
            From the supplier&apos;s door to yours, we handle each step and keep you posted along the way.
          </p>
        </div>

        <div ref={copyRefs[1]} className="container-x absolute inset-x-0 top-0 z-[2] grid gap-6 pt-24 text-white lg:grid-cols-12 lg:items-start lg:pt-36" style={{ opacity: 0 }}>
          <div className="lg:col-span-4">
            <p className="eyebrow text-white/80">What we do</p>
            <h3 className="mt-4 font-display text-[28px] font-medium leading-[1.05] sm:text-[44px]">Six services. One team.</h3>
            <p className="mt-4 max-w-sm text-[16px] lg:text-[17px] leading-[1.65] text-white/75">One partner for the whole journey, so nothing gets lost between suppliers, inspectors and carriers.</p>
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
                <p className="mt-0.5 hidden text-[14px] lg:text-[15px] text-white/70 sm:block">{sv.short}</p>
              </li>
            ))}
          </ul>
        </div>

        <div ref={copyRefs[2]} className="container-x absolute inset-0 z-[2] flex flex-col justify-between py-28 sm:py-24" style={{ opacity: 0 }}>
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

        {/* Journey indicator */}
        <div className="container-x pointer-events-none absolute inset-x-0 bottom-0 z-[2] hidden pb-6 lg:block [@media(max-height:820px)]:!hidden">
          <div className={`flex items-center gap-4 transition-opacity duration-300 ${scene === 3 ? 'opacity-0' : ''}`}>
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
                <p className="mt-2 text-[16px] lg:text-[17px] text-white/65">{s.description}</p>
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
