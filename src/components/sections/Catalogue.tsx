import { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import SplitText from '@/components/ui/SplitText';
import { productCategories } from '@/data/siteContent';
import { requestEnquiry } from '@/lib/enquiry';

/**
 * "What we source": a sticky index on the left tracks the category in view on the right.
 * The section starts dark and turns light as you read down (services-page treatment).
 */
export default function Catalogue() {
  const sectionRef = useRef<HTMLElement>(null);
  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [light, setLight] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    rowRefs.current.forEach((row) => row && io.observe(row));

    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const p = (window.innerHeight * 0.5 - rect.top) / rect.height;
      setLight(p > 0.32);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const jump = (i: number) => rowRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const tone = light
    ? { bg: 'bg-paper', text: 'text-ink', sub: 'text-muted', line: 'border-ink/10', faint: 'text-soft' }
    : { bg: 'bg-ink', text: 'text-white', sub: 'text-white/60', line: 'border-white/10', faint: 'text-white/35' };

  return (
    <section
      id="catalogue"
      ref={sectionRef}
      className={`section-y relative scroll-mt-20 transition-colors duration-700 ease-out ${tone.bg} ${tone.text}`}
    >
      {/* Soft hand-off from the white clouds above into the dark start of this section */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-[40vh] bg-gradient-to-b from-paper to-transparent transition-opacity duration-700 ${light ? 'opacity-0' : 'opacity-100'}`}
      />
      <div className="container-x relative">
        {/* Intro */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <Reveal>
              <p className={`eyebrow ${light ? '' : 'eyebrow-light'}`}>What we source</p>
            </Reveal>
            <SplitText
              as="h2"
              text={'Any product.\nAny quantity.\nSourced for you.'}
              stagger={70}
              className="mt-5 text-[38px] font-medium leading-[0.95] sm:text-[60px] lg:text-[80px] [&_.block:nth-child(-n+2)]:opacity-40"
            />
          </div>
          <Reveal delay={150} className="lg:col-span-4">
            <p className={`text-[17px] leading-[1.7] ${tone.sub}`}>
              Eleven categories we source and supply. Each has its own suppliers, quality checks and shipping needs, and we
              handle all of them for you.
            </p>
          </Reveal>
        </div>

        {/* Index + rows */}
        <div className="mt-16 grid gap-10 lg:mt-24 lg:grid-cols-12">
          <nav aria-label="Product categories" className="hidden lg:col-span-3 lg:block">
            <ol className="sticky top-28 space-y-1">
              {productCategories.map((item, i) => {
                const on = i === active;
                return (
                  <li key={item.name}>
                    <button
                      type="button"
                      onClick={() => jump(i)}
                      className={`mono-caps flex w-full items-center gap-3 rounded px-3 py-2 text-left transition-colors duration-300 ${
                        on
                          ? light
                            ? 'bg-ink text-white'
                            : 'bg-white text-ink'
                          : light
                            ? 'text-soft hover:text-ink'
                            : 'text-white/35 hover:text-white'
                      }`}
                    >
                      <span className="w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <span className="truncate">{item.name}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="lg:col-span-9">
            {productCategories.map((item, i) => {
              const Icon = item.icon;
              const on = i === active;
              return (
                <article
                  key={item.name}
                  ref={(el) => {
                    rowRefs.current[i] = el;
                  }}
                  data-index={i}
                  className={`grid gap-6 border-t py-10 transition-opacity duration-500 sm:grid-cols-12 sm:gap-8 lg:py-14 ${tone.line} ${
                    on ? 'opacity-100' : 'lg:opacity-45'
                  }`}
                >
                  <div className="overflow-hidden rounded-md sm:col-span-4">
                    <img
                      src={item.image}
                      alt={item.alt}
                      loading="lazy"
                      className={`aspect-[4/3] w-full object-cover transition-transform duration-1000 ease-expo ${on ? 'scale-100' : 'scale-110'}`}
                    />
                  </div>
                  <div className="flex flex-col sm:col-span-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`mono-caps ${tone.faint}`}>{String(i + 1).padStart(2, '0')} / {productCategories.length}</p>
                        <h3 className="mt-2 font-display text-[26px] leading-none sm:text-[34px]">{item.name}</h3>
                      </div>
                      <Icon size={24} strokeWidth={1.5} aria-hidden="true" className={`shrink-0 ${light ? 'text-accent' : 'text-sky'}`} />
                    </div>
                    <p className="mt-4 text-[18px] font-medium leading-snug">{item.description}</p>
                    <ul className="mt-5 grid gap-2 sm:grid-cols-3 sm:gap-4">
                      {item.points.map((point) => (
                        <li key={point} className={`flex gap-2.5 text-[14px] leading-[1.55] ${tone.sub}`}>
                          <span aria-hidden="true" className={`mt-[7px] h-1.5 w-1.5 shrink-0 ${light ? 'bg-accent' : 'bg-sky'}`} />
                          {point}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 sm:mt-auto sm:self-end sm:pt-6">
                      <Button variant={light ? 'dark' : 'light'} onClick={() => requestEnquiry(item.name)} label="Enquire about this">
                        Enquire about this
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
