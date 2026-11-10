import { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { useInView } from '@/hooks/useInView';
import { processSteps } from '@/data/siteContent';

const STEP_MS = 5000;

/** Four-step route: a truck drives along the line to the active step, which auto-advances until clicked. */
export default function Process() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const { ref, isInView } = useInView<HTMLDivElement>(0.35);
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const running = auto && isInView && !reduce;

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setActive((i) => (i + 1) % processSteps.length), STEP_MS);
    return () => window.clearTimeout(id);
  }, [running, active]);

  const pct = (active / (processSteps.length - 1)) * 100;
  const step = processSteps[active];
  const StepIcon = step.icon;

  return (
    <section id="process" className="section-y scroll-mt-24 overflow-hidden bg-ink text-white">
      <div className="container-x">
        <SectionHeading
          align="split"
          tone="light"
          eyebrow="How we work"
          title={'From first enquiry\nto final delivery.'}
          description="Four structured steps keep every shipment accountable, transparent, and on schedule."
        />

        <div ref={ref} className="mt-16 lg:mt-24">
          {/* Route line (desktop) */}
          <div className="relative hidden h-14 lg:block" aria-hidden="true">
            <div className="absolute inset-x-[12.5%] top-1/2 h-px -translate-y-1/2 bg-white/15" />
            <div
              className="absolute left-[12.5%] top-1/2 h-[2px] -translate-y-1/2 bg-accent2 transition-[width] duration-[1200ms] ease-expo"
              style={{ width: `${pct * 0.75}%` }}
            />
            <div
              className="absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md bg-accent text-white shadow-[0_0_0_6px_rgba(2,41,213,0.25)] transition-[left] duration-[1200ms] ease-expo"
              style={{ left: `${12.5 + pct * 0.75}%` }}
            >
              <Truck size={20} strokeWidth={1.5} />
            </div>
          </div>

          <div role="tablist" aria-label="Process steps" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((s, i) => {
              const selected = i === active;
              const done = i < active;
              const Icon = s.icon;
              return (
                <Reveal key={s.title} delay={i * 100}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls="process-panel"
                    onClick={() => {
                      setAuto(false);
                      setActive(i);
                    }}
                    className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-md border p-5 text-left transition-colors duration-500 ${
                      selected ? 'border-white bg-white text-ink' : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded font-mono text-[13px] transition-colors duration-500 ${
                        selected ? 'bg-accent text-white' : done ? 'bg-accent2/30 text-white' : 'bg-white/10'
                      }`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-display text-[20px] font-semibold uppercase">{s.title}</span>
                    <Icon size={20} strokeWidth={1.5} aria-hidden="true" className={`ml-auto transition-colors ${selected ? 'text-accent' : 'text-white/40'}`} />
                    {selected && running && (
                      <span
                        key={active}
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-accent"
                        style={{ animation: `progress ${STEP_MS}ms linear both` }}
                      />
                    )}
                  </button>
                </Reveal>
              );
            })}
          </div>

          <div id="process-panel" role="tabpanel" className="mt-3 overflow-hidden rounded-lg border border-white/15 bg-white/[0.03]">
            <div key={active} className="grid animate-panelin gap-8 p-6 sm:p-10 lg:grid-cols-12 lg:items-center lg:p-14">
              <p className="font-display text-[88px] font-semibold leading-none text-white/10 sm:text-[140px] lg:col-span-3">
                {String(active + 1).padStart(2, '0')}
              </p>
              <div className="lg:col-span-6">
                <p className="mono-caps text-sky">Step {active + 1} of {processSteps.length}</p>
                <h3 className="mt-3 font-display text-[32px] uppercase leading-none sm:text-[44px]">{step.title}</h3>
                <p className="mt-5 max-w-xl text-[17px] leading-[1.7] text-white/70 sm:text-[19px]">{step.description}</p>
              </div>
              <div className="hidden justify-end lg:col-span-3 lg:flex">
                <span className="flex h-32 w-32 items-center justify-center rounded-lg bg-accent text-white">
                  <StepIcon size={52} strokeWidth={1.25} aria-hidden="true" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
