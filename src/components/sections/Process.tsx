import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { processSteps } from '@/data/siteContent';

export default function Process() {
  return (
    <section id="process" className="section-y relative scroll-mt-24 overflow-hidden bg-deep">
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="container-x relative">
        <Reveal>
          <SectionHeading
            eyebrow="How We Work"
            title="A clear path from first enquiry to final delivery."
            description="Four structured steps keep every shipment accountable, transparent, and on schedule."
            align="center"
          />
        </Reveal>

        <ol className="relative mt-16 grid gap-5 sm:mt-24 md:grid-cols-2 lg:grid-cols-4">
          {/* Glowing route line behind the cards (desktop) */}
          <span
            aria-hidden="true"
            className="absolute left-[12%] right-[12%] top-[52px] hidden h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent lg:block"
          />
          {processSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="h-full">
                <Reveal delay={index * 120} className="h-full">
                  <div className="glow-card h-full p-8 text-center">
                    <span className="relative z-10 mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-accent bg-canvas text-base font-semibold text-white shadow-[0_0_30px_-4px_rgba(61,139,255,0.7)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <Icon size={20} strokeWidth={1.5} aria-hidden="true" className="mx-auto mt-6 text-accent" />
                    <h3 className="mt-3 text-xl text-white">{step.title}</h3>
                    <p className="mt-3 text-[16px] leading-[1.7] text-muted">{step.description}</p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
