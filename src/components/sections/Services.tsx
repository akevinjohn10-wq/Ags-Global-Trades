import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { services } from '@/data/siteContent';

export default function Services() {
  return (
    <section id="services" className="section-y relative scroll-mt-24 overflow-hidden bg-deep">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]"
      />
      <div className="container-x relative">
        <Reveal>
          <SectionHeading
            eyebrow="Our Services"
            title="End-to-end support for every stage of trade."
            description="One partner for sourcing, shipping, clearance, and compliance, so nothing falls between handoffs."
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Reveal key={service.title} delay={index * 80} className="h-full">
                <article className="glow-card group h-full p-8 sm:p-9">
                  <div className="flex items-start justify-between">
                    <span className="icon-box transition-colors duration-300 group-hover:border-accent">
                      <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <span aria-hidden="true" className="text-sm font-medium tabular-nums text-muted/50">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mt-10 text-xl text-white sm:text-[22px]">{service.title}</h3>
                  <p className="mt-3 text-[16px] leading-[1.7] text-muted">{service.description}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
