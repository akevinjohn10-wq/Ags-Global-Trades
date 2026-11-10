import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Handshake, Receipt, Truck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { services } from '@/data/siteContent';

const VALUES = [
  { title: 'Verified suppliers', text: 'Every maker is checked before we place your order.', icon: BadgeCheck },
  { title: 'One point of contact', text: 'A named manager from enquiry to delivery.', icon: Handshake },
  { title: 'Clear, honest quotes', text: 'Product, packing and shipping in one price.', icon: Receipt },
  { title: 'Shipping handled', text: 'Booked with trusted shipping and courier partners.', icon: Truck },
];

// Frame sequence cut from the AGS brand film (public/story/001.webp ... 150.webp, 15 fps)
const FRAME_COUNT = 150;
const frameSrc = (i: number) => `/story/${String(i + 1).padStart(3, '0')}.webp`;
// Each scene's first and last frame, and the share of the scroll it gets
const SCENES = [
  { from: 0, to: 36, label: 'Loaded' },
  { from: 37, to: 74, label: 'On the road' },
  { from: 75, to: 112, label: 'At sea' },
  { from: 113, to: 149, label: 'By air' },
];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);
/** 0 → 1 → 0 over [a, b], holding at 1 in the middle */
const window01 = (p: number, a: number, b: number, edge = 0.25) => {
  const t = seg(p, a, b);
  return ease(Math.min(clamp(t / edge), clamp((1 - t) / edge)));
};

/**
 * The scroll story, played from the AGS brand film: the order is loaded onto the truck,
 * drives the road, crosses the sea and flies the last leg. Scrolling scrubs the film
 * frame by frame, and the copy for each leg rises in around it.
 */
export default function Story() {
  const [reduce] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (reduce) return <StoryStatic />;
  return <StoryFilm />;
}

function StoryFilm() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dipRef = useRef<HTMLDivElement>(null);
  const whiteRef = useRef<HTMLDivElement>(null);
  const sceneRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const serviceRefs = useRef<(HTMLLIElement | null)[]>([]);
  const valueRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const images: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
    const loaded = new Array(FRAME_COUNT).fill(false);
    let current = -1;
    let wanted = 0;
    let raf = 0;
    let started = false;

    const load = (i: number) => {
      if (images[i]) return;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        loaded[i] = true;
        if (Math.abs(i - wanted) < 6) draw(true);
      };
      img.src = frameSrc(i);
      images[i] = img;
    };
    // First frame now; the rest once the section comes near, coarse to fine
    load(0);
    const loadAll = () => {
      if (started) return;
      started = true;
      for (const step of [16, 8, 4, 2, 1]) for (let i = 0; i < FRAME_COUNT; i += step) load(i);
    };
    const io = new IntersectionObserver(([e]) => e.isIntersecting && loadAll(), { rootMargin: '150% 0px' });
    io.observe(section);

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      current = -1;
      draw(true);
    };

    function nearestLoaded(i: number) {
      for (let d = 0; d < FRAME_COUNT; d++) {
        if (i - d >= 0 && loaded[i - d]) return i - d;
        if (i + d < FRAME_COUNT && loaded[i + d]) return i + d;
      }
      return -1;
    }

    function draw(force = false) {
      const i = nearestLoaded(wanted);
      if (i < 0 || (i === current && !force)) return;
      current = i;
      const img = images[i]!;
      const cw = canvas!.width;
      const ch = canvas!.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const cover = Math.max(cw / iw, ch / ih);
      if (cw / ch >= 1) {
        const w = iw * cover;
        const h = ih * cover;
        ctx!.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      } else {
        // Portrait screens: a dimmed full-bleed copy behind a larger, centred film
        const w = iw * cover;
        const h = ih * cover;
        ctx!.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
        ctx!.fillStyle = 'rgba(5,7,15,0.55)';
        ctx!.fillRect(0, 0, cw, ch);
        const fit = (cw / iw) * 1.55;
        const fw = iw * fit;
        const fh = ih * fit;
        ctx!.drawImage(img, (cw - fw) / 2, (ch - fh) / 2, fw, fh);
      }
    }

    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = span > 0 ? clamp(-rect.top / span) : 0;

      // Film: each scene gets a quarter of the scroll
      const s = Math.min(3, Math.floor(p * 4));
      const local = clamp(p * 4 - s);
      const sc = SCENES[s];
      wanted = Math.round(sc.from + local * (sc.to - sc.from));
      draw();
      setScene(s);

      // Soft dip to dark at each cut
      let dip = 0;
      for (const b of [0.25, 0.5, 0.75]) dip = Math.max(dip, 1 - Math.abs(p - b) / 0.025);
      if (dipRef.current) dipRef.current.style.opacity = String(clamp(dip) * 0.92);

      // Copy for each scene
      const ranges: [number, number][] = [[-0.2, 0.235], [0.255, 0.485], [0.515, 0.735], [0.765, 0.96]];
      ranges.forEach(([a, b], k) => {
        const el = sceneRefs[k].current;
        if (!el) return;
        const o = k === 0 ? Math.min(1, clamp((b - p) / 0.06)) : window01(p, a, b, 0.22);
        el.style.opacity = String(o);
        el.style.transform = `translate3d(0, ${((1 - o) * 30).toFixed(1)}px, 0)`;
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      });
      // Services list items rise one after another on the road
      serviceRefs.current.forEach((li, k) => {
        if (!li) return;
        const t = ease(seg(p, 0.27 + k * 0.022, 0.3 + k * 0.022));
        li.style.opacity = String(t);
        li.style.transform = `translate3d(0, ${((1 - t) * 18).toFixed(1)}px, 0)`;
      });
      // Values gather around the ship
      valueRefs.current.forEach((li, k) => {
        if (!li) return;
        const t = ease(seg(p, 0.55 + k * 0.03, 0.59 + k * 0.03));
        li.style.opacity = String(t);
        li.style.transform = `translate3d(${((1 - t) * (k % 2 ? 24 : -24)).toFixed(1)}px, 0, 0)`;
      });
      // The clouds open into the white page below
      if (whiteRef.current) whiteRef.current.style.opacity = String(ease(seg(p, 0.93, 1)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    size();
    update();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={sectionRef} id="services" aria-label="Our services" className="relative h-[640vh] scroll-mt-24 bg-[#141518] text-white">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        {/* Navy grade so the film sits in the site palette */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,transparent_40%,rgba(5,7,15,0.7))]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[rgba(10,22,64,0.18)] mix-blend-multiply" />
        <div ref={dipRef} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-space" style={{ opacity: 0 }} />

        {/* Scene 1: loading */}
        <div ref={sceneRefs[0]} className="container-x absolute inset-x-0 top-0 pt-28 sm:pt-32">
          <p className="eyebrow eyebrow-light">Our services</p>
          <h2 className="mt-5 max-w-3xl text-[36px] font-medium leading-[1.02] sm:text-[56px] lg:text-[68px]">
            Every order, packed and on its way.
          </h2>
          <p className="mt-5 max-w-md text-[16px] leading-[1.65] text-white/70 sm:text-[17px]">
            From the supplier&apos;s door to yours, we handle each step and keep you posted along the way.
          </p>
        </div>

        {/* Scene 2: on the road, services either side of the lane */}
        <div ref={sceneRefs[1]} className="container-x absolute inset-0 grid items-center gap-8 py-28 lg:grid-cols-12" style={{ opacity: 0 }}>
          <div className="lg:col-span-4">
            <p className="eyebrow eyebrow-light">What we do</p>
            <h3 className="mt-4 font-display text-[30px] font-medium leading-[1.05] sm:text-[44px]">Six services. One team.</h3>
            <p className="mt-4 max-w-sm text-[15px] leading-[1.65] text-white/65">One partner for the whole journey, so nothing gets lost between suppliers, inspectors and carriers.</p>
          </div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-5 lg:col-span-4 lg:col-start-9 lg:grid-cols-1 lg:gap-y-4">
            {services.map((sv, i) => (
              <li
                key={sv.title}
                ref={(el) => {
                  serviceRefs.current[i] = el;
                }}
                className="border-l border-white/20 pl-4"
                style={{ opacity: 0 }}
              >
                <p className="mono-caps text-sky/80">{String(i + 1).padStart(2, '0')}</p>
                <p className="mt-1 font-display text-[16px] leading-tight sm:text-[19px]">{sv.title}</p>
                <p className="mt-0.5 hidden text-[13px] text-white/55 sm:block">{sv.short}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Scene 3: at sea, values around the ship */}
        <div ref={sceneRefs[2]} className="container-x absolute inset-0 flex flex-col justify-between py-28 sm:py-24" style={{ opacity: 0 }}>
          <div className="text-center">
            <p className="eyebrow eyebrow-light justify-center">Why AGS Trade</p>
            <h3 className="mx-auto mt-4 max-w-3xl font-display text-[30px] font-medium leading-[1.02] sm:text-[52px]">
              Sourcing that works as hard as you do.
            </h3>
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

        {/* Scene 4: by air */}
        <div ref={sceneRefs[3]} className="container-x absolute inset-x-0 bottom-0 flex flex-col gap-6 pb-16 sm:flex-row sm:items-end sm:justify-between sm:pb-20" style={{ opacity: 0 }}>
          <div>
            <p className="eyebrow eyebrow-light">Urgent orders</p>
            <h3 className="mt-4 max-w-xl font-display text-[30px] font-medium leading-[1.05] sm:text-[48px]">When it can&apos;t wait, it flies.</h3>
            <p className="mt-3 max-w-md text-[15px] leading-[1.65] text-white/70">Sea for volume, air for speed. We pick the route that fits your deadline and budget.</p>
          </div>
          <Button href="#contact" variant="light" className="pointer-events-auto self-start sm:self-auto">
            Request a quote
          </Button>
        </div>

        {/* Journey indicator */}
        <div className="container-x pointer-events-none absolute inset-x-0 bottom-0 hidden pb-6 lg:block [@media(max-height:820px)]:!hidden">
          <div className="flex items-center gap-4">
            <span className="mono-caps text-white/80">{String(scene + 1).padStart(2, '0')}</span>
            <span className="flex gap-1.5" aria-hidden="true">
              {SCENES.map((_, i) => (
                <span key={i} className="h-[2px] w-10 overflow-hidden bg-white/15">
                  <span className={`block h-full origin-left bg-white transition-transform duration-700 ease-expo ${i <= scene ? 'scale-x-100' : 'scale-x-0'}`} />
                </span>
              ))}
            </span>
            <span key={scene} className="mono-caps animate-panelin text-white/60">
              {SCENES[scene].label}
            </span>
          </div>
        </div>

        {/* Clouds open into the white page below */}
        <div ref={whiteRef} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-paper" style={{ opacity: 0 }} />
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
                <p className="mt-2 text-[15px] text-white/65">{s.description}</p>
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
