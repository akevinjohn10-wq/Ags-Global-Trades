import { useEffect, useRef } from 'react';
import { LogoMark } from '@/components/ui/Logo';

/**
 * Trade routes spreading out from India, between the scroll story and "What we source".
 * The film's edges are feathered into the white page, so it reads as a glow rather than a box.
 */
export default function RoutesFilm() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!wrap || !video) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Play only while on screen
    const io = new IntersectionObserver(
      ([entry]) => {
        if (reduce) return;
        if (entry.isIntersecting) {
          if (video.preload !== 'auto') video.preload = 'auto';
          video.play().catch(() => {});
        } else video.pause();
      },
      { rootMargin: '300px 0px' },
    );
    io.observe(wrap);

    // Gentle scale and fade as it scrolls through, so it eases in from the white above and out into the list below
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      const inn = Math.min(1, p / 0.16);
      const out = Math.min(1, (1 - p) / 0.25);
      const k = Math.min(inn, out);
      const e = k * k * (3 - 2 * k);
      wrap.style.opacity = String(e);
      wrap.style.transform = `translate3d(0, ${((1 - inn) * 30).toFixed(1)}px, 0) scale(${(0.94 + 0.06 * e).toFixed(4)})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    if (!reduce) {
      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
    }
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Soft fade on all four sides (two gradients intersected), so the film melts into the page
  const featherX = 'linear-gradient(to right, transparent 0%, #000 22%, #000 78%, transparent 100%)';
  const featherY = 'linear-gradient(to bottom, transparent 0%, #000 26%, #000 70%, transparent 100%)';

  return (
    <div aria-label="Trade routes from New Delhi to the world" role="img" className="relative mx-auto -mb-6 w-full max-w-[1800px] sm:-mb-10">
      <div ref={wrapRef} className="relative aspect-square w-full will-change-transform sm:aspect-[16/9] lg:aspect-[16/8]">
        <video
          ref={videoRef}
          aria-hidden="true"
          muted
          loop
          playsInline
          preload="none"
          poster="/videos/routes.jpg"
          className="absolute inset-0 h-full w-full object-cover object-[62%_50%]"
          style={{
            WebkitMaskImage: `${featherX}, ${featherY}`,
            maskImage: `${featherX}, ${featherY}`,
            WebkitMaskComposite: 'source-in',
            maskComposite: 'intersect',
          }}
        >
          <source src="/videos/routes.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-x-0 bottom-[24%] flex flex-col items-center text-center text-white">
          <LogoMark height={34} className="opacity-90" />
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.24em] text-[#B8C4E6] sm:text-[12px]">From New Delhi to the world</p>
        </div>
      </div>
    </div>
  );
}
