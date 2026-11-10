import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

const VIDEO = '/images/hero-video.mp4';
const POSTER = '/images/hero-poster.jpg';

/** The AGS brand film: the frame widens to full-bleed as it scrolls into view. */
export default function BrandReel() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      videoRef.current?.pause();
      setPlaying(false);
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const wrap = wrapRef.current;
      const frame = frameRef.current;
      if (!wrap || !frame) return;
      const rect = wrap.getBoundingClientRect();
      // 0 when the frame's top enters the bottom of the screen, 1 when it reaches the top third
      const p = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight * 0.85)));
      const eased = 1 - Math.pow(1 - p, 3);
      const inset = (1 - eased) * Math.min(14, window.innerWidth < 640 ? 5 : 14);
      frame.style.clipPath = `inset(0 ${inset.toFixed(2)}% round ${((1 - eased) * 16 + 0).toFixed(1)}px)`;
      const video = videoRef.current;
      if (video) video.style.transform = `scale(${(1.12 - eased * 0.12).toFixed(4)})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <section aria-label="AGS Global Trade brand film" className="bg-paper pb-20 sm:pb-28 lg:pb-36">
      <div ref={wrapRef} className="relative">
        <div ref={frameRef} className="relative h-[56vw] max-h-[88vh] min-h-[320px] overflow-hidden bg-ink will-change-[clip-path]">
          <video
            ref={videoRef}
            src={VIDEO}
            poster={POSTER}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="AGS Global Trade logo animation: Connecting markets. Delivering value."
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/30" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 text-white sm:p-8">
            <span className="mono-caps flex items-center gap-2">
              <span className="h-2 w-2 animate-blink bg-signal" aria-hidden="true" />
              Brand film
            </span>
            <span className="mono-caps text-white/60">AGS Global Trade</span>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-end gap-4 p-5 text-white sm:justify-between sm:p-8">
            <ul className="hidden flex-wrap gap-2 sm:flex">
              {['Sourcing', 'Verification', 'Quality', 'Shipping', 'Delivery'].map((tag) => (
                <li key={tag} className="mono-caps rounded border border-white/25 bg-ink/30 px-3 py-1.5 backdrop-blur-sm">
                  {tag}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? 'Pause brand film' : 'Play brand film'}
              className="group flex h-12 items-center gap-3 rounded-md border border-white/30 bg-ink/40 pl-4 pr-1.5 backdrop-blur-md transition-colors hover:bg-white hover:text-ink"
            >
              <span className="mono-caps">{playing ? 'Pause' : 'Play'}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded bg-white/10 group-hover:bg-ink/5" aria-hidden="true">
                {playing ? <Pause size={16} strokeWidth={1.75} /> : <Play size={16} strokeWidth={1.75} />}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
