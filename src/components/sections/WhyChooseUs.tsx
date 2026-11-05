import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { valuePoints } from '@/data/siteContent';

export default function WhyChooseUs() {
  return (
    <section id="why-choose-us" className="section-y scroll-mt-[72px] bg-deep">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            eyebrow="Why Choose Us"
            title="Discipline and transparency at every border."
            description="We combine careful sourcing with dependable execution, so you always know where your goods stand."
          />
        </Reveal>

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {valuePoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <Reveal key={point.title} delay={index * 100}>
                <div className="border-t border-line pt-8">
                  <span className="icon-box">
                    <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-lg">{point.title}</h3>
                  <p className="mt-3 text-[16px] leading-[1.7] text-muted">{point.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
