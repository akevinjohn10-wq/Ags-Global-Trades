import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';

const ABOUT_IMAGE = '/images/about.jpeg';

export default function About() {
  return (
    <section id="about" className="section-y relative scroll-mt-24 overflow-hidden bg-canvas">
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="container-x relative grid items-center gap-12 sm:gap-16 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <figure className="relative">
            {/* Blue glow behind the photo */}
            <div
              aria-hidden="true"
              className="absolute -inset-6 animate-glow rounded-[40px] bg-accent/20 blur-3xl"
            />
            <img
              src={ABOUT_IMAGE}
              alt="AGS Global Trade logistics and shipping operations"
              loading="lazy"
              className="relative h-[320px] w-full rounded-3xl border border-white/10 object-cover sm:h-[560px]"
            />
          </figure>
        </Reveal>

        <Reveal delay={150}>
          <SectionHeading
            eyebrow="About AGS Trade"
            title="A dependable partner in global trade."
            description="AGS Trade connects manufacturers, suppliers, and buyers across continents. We manage the sourcing, freight, and paperwork that cross-border trade demands, so our clients can focus on growing their business."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <div className="glow-card p-7">
              <h3 className="text-lg text-white">Our Mission</h3>
              <p className="mt-3 text-[16px] leading-[1.7] text-muted">
                To make international trade simple, transparent, and reliable for businesses of every size.
              </p>
            </div>
            <div className="glow-card p-7">
              <h3 className="text-lg text-white">Our Values</h3>
              <p className="mt-3 text-[16px] leading-[1.7] text-muted">
                Integrity, precision, and long-term partnerships guide every shipment we manage.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
