import { useEffect, useRef, useState } from 'react';
import { processSteps } from '@/data/siteContent';

/**
 * Story-telling section (unitedcarriers.com style): the section pins while you scroll,
 * and an order travels from request to delivery along a route, one step at a time.
 */
export default function Journey() {
  const sectionRef = useRef<HTMLElement>(null);
  const parcelRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [reduce] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const count = processSteps.length;

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;
      // The parcel glides between stations; it rests a moment at each one
      const raw = p * (count - 1);
      const idx = Math.floor(raw);
      const frac = raw - idx;
      const eased = frac < 0.35 ? 0 : (frac - 0.35) / 0.65;
      const smooth = eased * eased * (3 - 2 * eased);
      const pos = Math.min(count - 1, idx + smooth) / (count - 1);
      if (parcelRef.current) parcelRef.current.style.left = `${(pos * 100).toFixed(3)}%`;
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${pos.toFixed(4)})`;
      setStep(Math.min(count - 1, Math.round(pos * (count - 1))));
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
  }, [count, reduce]);

  const goTo = (i: number) => {
    const el = sectionRef.current;
    if (!el || reduce) {
      setStep(i);
      return;
    }
    const span = el.offsetHeight - window.innerHeight;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (span * i) / (count - 1) + 2, behavior: 'smooth' });
  };

  const current = processSteps[step];
  const CurrentIcon = current.icon;

  return (
    <section
      id="process"
      ref={sectionRef}
      aria-label="How it works"
      className={`relative scroll-mt-0 bg-paper ${reduce ? '' : 'h-[460vh]'}`}
    >
      <div className={`${reduce ? 'relative py-20' : 'sticky top-0 h-[100svh]'} flex flex-col overflow-hidden`}>
        <div className="container-x flex h-full flex-col pb-8 pt-28 sm:pt-32">
          {/* Heading row */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">How it works</p>
              <h2 className="mt-4 text-[30px] font-medium leading-none text-ink sm:text-[44px] lg:text-[56px]">
                From request to your door.
              </h2>
            </div>
            <p className="mono-caps text-soft">
              Step <span className="text-accent">{String(step + 1).padStart(2, '0')}</span> / {String(count).padStart(2, '0')}
              <span className="hidden sm:inline"> · scroll to follow the order</span>
            </p>
          </div>

          {/* Story */}
          <div className="mt-6 grid min-h-0 flex-1 gap-6 lg:mt-10 lg:grid-cols-12 lg:gap-10">
            <div className="order-2 flex flex-col justify-center lg:order-1 lg:col-span-5">
              <div key={step} className="animate-panelin">
                <div className="flex items-center gap-4">
                  <span className="font-display text-[64px] font-medium leading-none text-accent sm:text-[96px] lg:text-[128px]">
                    {String(step + 1).padStart(2, '0')}
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-md bg-ink text-white">
                    <CurrentIcon size={22} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                </div>
                <h3 className="mt-3 font-display text-[30px] leading-none text-ink sm:text-[44px]">{current.title}</h3>
                <p className="mt-4 max-w-md text-[16px] leading-[1.7] text-muted sm:text-[18px]">{current.description}</p>
              </div>
            </div>

            <div className="relative order-1 min-h-[180px] overflow-hidden rounded-lg bg-mist lg:order-2 lg:col-span-7">
              {processSteps.map((s, i) => (
                <img
                  key={s.title}
                  src={s.image}
                  alt={i === step ? s.alt : ''}
                  aria-hidden={i !== step}
                  loading="lazy"
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-expo ${
                    i === step ? 'scale-100 opacity-100' : i < step ? 'scale-105 opacity-0' : 'scale-95 opacity-0'
                  }`}
                />
              ))}
              <span className="mono-caps absolute left-4 top-4 rounded bg-ink px-3 py-1.5 text-white">{current.title}</span>
            </div>
          </div>

          {/* Route with stations */}
          <div className="relative mt-8 px-3 sm:px-6">
            <div className="relative h-14">
              <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-ink/10" />
              <div ref={fillRef} className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 origin-left scale-x-0 bg-accent" />
              {processSteps.map((s, i) => {
                const Icon = s.icon;
                const done = i <= step;
                return (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Step ${i + 1}: ${s.title}`}
                    aria-current={i === step ? 'step' : undefined}
                    className={`absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                      done ? 'border-accent bg-paper text-accent' : 'border-ink/15 bg-paper text-soft hover:border-ink hover:text-ink'
                    }`}
                    style={{ left: `${(i / (count - 1)) * 100}%` }}
                  >
                    <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                );
              })}
              {/* the order itself: a blue square parcel */}
              <div
                ref={parcelRef}
                aria-hidden="true"
                className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-[calc(50%+30px)]"
                style={{ left: reduce ? `${(step / (count - 1)) * 100}%` : '0%' }}
              >
                <div className="relative flex h-8 w-8 items-center justify-center bg-accent shadow-[0_8px_20px_-6px_rgba(17,19,23,0.5)]">
                  <span className="h-full w-[3px] bg-white/40" />
                  <span className="absolute h-[3px] w-full bg-white/40" />
                </div>
              </div>
            </div>
            <ol className="relative mt-1 hidden h-5 sm:block">
              {processSteps.map((s, i) => (
                <li
                  key={s.title}
                  className={`mono-caps absolute -translate-x-1/2 whitespace-nowrap transition-colors ${i === step ? 'text-ink' : 'text-soft'}`}
                  style={{ left: `${(i / (count - 1)) * 100}%` }}
                >
                  {s.title}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
