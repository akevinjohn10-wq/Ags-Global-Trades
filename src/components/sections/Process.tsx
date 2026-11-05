import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { processSteps } from '@/data/siteContent';

export default function Process() {
  return (
    <section id="process" className="section-y scroll-mt-[72px]">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            eyebrow="How We Work"
            title="A clear path from first enquiry to final delivery."
            description="Four structured steps keep every shipment accountable, transparent, and on schedule."
            align="center"
          />
        </Reveal>

        <ol className="mt-20 grid gap-14 md:grid-cols-4 md:gap-0">
          {processSteps.map((step, index) => {
            const isLast = index === processSteps.length - 1;
            return (
              <li key={step.title} className="relative h-full">
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[calc(50%+32px)] right-[calc(-50%+32px)] top-7 hidden h-px bg-line md:block"
                  />
                )}
                <Reveal delay={index * 120} className="flex h-full flex-col items-center px-4 text-center">
                  <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-full border border-accent bg-canvas text-base font-semibold text-ink">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-8 text-xl">{step.title}</h3>
                  <p className="mt-3 max-w-xs text-[16px] leading-[1.7] text-muted">{step.description}</p>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
