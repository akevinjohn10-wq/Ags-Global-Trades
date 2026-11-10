import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { useInView } from '@/hooks/useInView';
import { services } from '@/data/siteContent';

const AUTO_MS = 6000;

/**
 * Expanding service panels (bluesqx "Innovation + Experience" layout): one panel is open,
 * the rest are slim columns with vertical titles. Hover or click to open; auto-advances until touched.
 */
export default function Services() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const { ref, isInView } = useInView<HTMLDivElement>(0.3);
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const running = auto && isInView && !reduce;

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setActive((i) => (i + 1) % services.length), AUTO_MS);
    return () => window.clearTimeout(id);
  }, [running, active]);

  const open = (i: number) => {
    setAuto(false);
    setActive(i);
  };

  return (
    <section id="services" className="section-y scroll-mt-24 bg-mist">
      <div className="container-x">
        <SectionHeading
          align="split"
          eyebrow="Our services"
          title={'Sourcing +\nSupply, handled.'}
          description="Six services that take an order from a product name and a quantity to goods at your door."
        />

        <Reveal className="mt-14 lg:mt-20">
          <div ref={ref} className="flex flex-col gap-2 lg:h-[620px] lg:flex-row" role="list">
            {services.map((service, i) => {
              const isOpen = i === active;
              const Icon = service.icon;
              return (
                <div
                  key={service.title}
                  role="listitem"
                  onMouseEnter={() => window.matchMedia('(hover: hover)').matches && open(i)}
                  className={`group relative overflow-hidden rounded-lg bg-ink text-white transition-[flex-grow,height] duration-700 ease-expo lg:h-full ${
                    isOpen ? 'h-[460px] lg:flex-[6_1_0%]' : 'h-[76px] lg:flex-[1_1_0%]'
                  }`}
                >
                  <img
                    src={service.image}
                    alt={service.alt}
                    loading="lazy"
                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-expo ${
                      isOpen ? 'scale-100 opacity-100' : 'scale-110 opacity-25 grayscale'
                    }`}
                  />
                  <div
                    aria-hidden="true"
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      isOpen ? 'bg-gradient-to-t from-ink via-ink/40 to-transparent' : 'bg-ink/70'
                    }`}
                  />

                  {/* Collapsed: number + vertical title (desktop) / row title (mobile) */}
                  <button
                    type="button"
                    onClick={() => open(i)}
                    aria-expanded={isOpen}
                    aria-controls={`service-body-${i}`}
                    className={`absolute inset-0 z-10 flex items-center gap-4 px-5 text-left transition-opacity duration-500 lg:flex-col lg:items-center lg:justify-between lg:px-0 lg:py-6 ${
                      isOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
                    }`}
                  >
                    <span className="mono-caps text-sky">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-display text-[18px] font-semibold uppercase lg:rotate-180 lg:text-[20px] lg:[writing-mode:vertical-rl]">
                      {service.title}
                    </span>
                    <span className="ml-auto flex h-8 w-8 items-center justify-center rounded bg-white/10 lg:ml-0">
                      <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
                    </span>
                  </button>

                  {/* Open: full content */}
                  <div
                    id={`service-body-${i}`}
                    className={`absolute inset-x-0 bottom-0 z-10 p-6 transition-all duration-700 ease-expo sm:p-10 ${
                      isOpen ? 'translate-y-0 opacity-100 delay-200' : 'pointer-events-none translate-y-6 opacity-0'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent">
                        <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                      </span>
                      <span className="mono-caps text-white/70">
                        {String(i + 1).padStart(2, '0')} / {String(services.length).padStart(2, '0')} · {service.short}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-[30px] uppercase leading-none sm:text-[44px]">{service.title}</h3>
                    <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
                      <p className="max-w-lg text-[16px] leading-[1.7] text-white/80 sm:text-[17px]">{service.description}</p>
                      <Button href="#contact" variant="light" className={isOpen ? '' : 'pointer-events-none'}>
                        Request a quote
                      </Button>
                    </div>
                    {/* auto-advance progress */}
                    <span aria-hidden="true" className="mt-6 block h-[2px] w-full bg-white/15">
                      {running && (
                        <span key={active} className="block h-full origin-left bg-white" style={{ animation: `progress ${AUTO_MS}ms linear both` }} />
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
