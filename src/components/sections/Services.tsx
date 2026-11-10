import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { useInView } from '@/hooks/useInView';
import { services } from '@/data/siteContent';

const AUTO_MS = 6500;

/** Tabbed services: numbered tab list on the left, illustrated panel on the right. Auto-advances until clicked. */
export default function Services() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [paused, setPaused] = useState(false);
  const { ref, isInView } = useInView<HTMLDivElement>(0.3);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const running = auto && !paused && isInView && !reduce;

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setActive((i) => (i + 1) % services.length), AUTO_MS);
    return () => window.clearTimeout(id);
  }, [running, active]);

  const select = (i: number, focus = false) => {
    setAuto(false);
    setActive(i);
    if (focus) tabRefs.current[i]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (event.key in keys) {
      event.preventDefault();
      select((active + keys[event.key] + services.length) % services.length, true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      select(0, true);
    } else if (event.key === 'End') {
      event.preventDefault();
      select(services.length - 1, true);
    }
  };

  const service = services[active];
  const Icon = service.icon;

  return (
    <section id="services" className="section-y scroll-mt-24 bg-mist">
      <div className="container-x">
        <SectionHeading
          align="split"
          eyebrow="Our services"
          title={'Every leg of\ncross-border trade.'}
          description="Six services, one accountable partner. Choose a service to see how we handle it."
        />

        <div
          ref={ref}
          className="mt-14 grid gap-6 lg:mt-20 lg:grid-cols-12"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {/* Tab list */}
          <Reveal className="min-w-0 lg:col-span-5">
            <div
              role="tablist"
              aria-label="Services"
              aria-orientation="vertical"
              onKeyDown={onKeyDown}
              className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0"
            >
              {services.map((item, i) => {
                const selected = i === active;
                return (
                  <button
                    key={item.title}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`service-tab-${i}`}
                    aria-selected={selected}
                    aria-controls="service-panel"
                    tabIndex={selected ? 0 : -1}
                    onClick={() => select(i)}
                    className={`group relative flex shrink-0 items-center gap-4 overflow-hidden rounded-md border px-4 py-3 text-left transition-colors duration-300 lg:rounded-none lg:border-0 lg:border-b lg:border-ink/10 lg:px-2 lg:py-6 ${
                      selected ? 'border-ink bg-ink text-white lg:bg-transparent lg:text-ink' : 'border-ink/10 bg-paper text-ink/60 hover:text-ink lg:bg-transparent'
                    }`}
                  >
                    <span className={`mono-caps transition-colors ${selected ? 'text-accent2 lg:text-accent' : 'text-soft group-hover:text-accent'}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="whitespace-nowrap font-display text-[15px] font-semibold uppercase transition-transform duration-500 ease-expo group-hover:translate-x-1 lg:whitespace-normal lg:text-[24px] xl:text-[28px]">
                      {item.title}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`ml-auto hidden h-8 w-8 shrink-0 items-center justify-center rounded transition-all duration-500 ease-expo lg:flex ${
                        selected ? 'translate-x-0 bg-accent opacity-100' : '-translate-x-3 opacity-0'
                      }`}
                    >
                      <span className="h-2 w-2 bg-white" />
                    </span>
                    {/* auto-advance progress */}
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-0 hidden h-[2px] lg:block">
                      {selected && (
                        <span
                          key={`${active}-${running}`}
                          className="block h-full origin-left bg-accent"
                          style={running ? { animation: `progress ${AUTO_MS}ms linear both` } : { transform: 'scaleX(1)' }}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>

          {/* Panel */}
          <Reveal delay={150} className="min-w-0 lg:col-span-7">
            <div
              id="service-panel"
              role="tabpanel"
              aria-labelledby={`service-tab-${active}`}
              className="overflow-hidden rounded-lg border border-line bg-paper"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-mist sm:aspect-[16/10]">
                <img
                  key={service.image}
                  src={service.image}
                  alt={service.alt}
                  className="h-full w-full animate-imgin object-cover"
                />
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded bg-ink px-3 py-2 text-white">
                  <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
                  <span className="mono-caps">{service.short}</span>
                </div>
              </div>
              <div key={active} className="grid animate-panelin gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-end sm:p-10">
                <div>
                  <p className="mono-caps text-soft">
                    <span className="text-accent">{String(active + 1).padStart(2, '0')}</span> / {String(services.length).padStart(2, '0')}
                  </p>
                  <h3 className="mt-3 font-display text-[28px] uppercase leading-none text-ink sm:text-[36px]">{service.title}</h3>
                  <p className="mt-4 max-w-lg text-[17px] leading-[1.7] text-muted">{service.description}</p>
                </div>
                <Button href="#contact" variant="dark" className="self-start sm:self-end">
                  Work with us
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
