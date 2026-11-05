import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { services } from '@/data/siteContent';

export default function Services() {
  return (
    <section id="services" className="section-y scroll-mt-[72px]">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            eyebrow="Our Services"
            title="End-to-end support for every stage of trade."
            description="One partner for sourcing, shipping, clearance, and compliance, so nothing falls between handoffs."
          />
        </Reveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Reveal key={service.title} delay={index * 80}>
                <article className="group h-full rounded-[4px] border border-line bg-surface p-8 transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-sm">
                  <span className="icon-box transition-colors duration-300 group-hover:border-accent">
                    <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <h3 className="mt-8 text-xl">{service.title}</h3>
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
