import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';

const ABOUT_IMAGE =
  'https://images.pexels.com/photos/9694390/pexels-photo-9694390.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export default function About() {
  return (
    <section id="about" className="section-y scroll-mt-[72px] bg-surface">
      <div className="container-x grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <figure className="relative overflow-hidden rounded-[4px] border border-line">
            <img
              src={ABOUT_IMAGE}
              alt="Stacked shipping containers in a logistics yard"
              loading="lazy"
              className="h-[400px] w-full object-cover grayscale sm:h-[520px]"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-canvas/30" />
          </figure>
        </Reveal>

        <Reveal delay={150}>
          <SectionHeading
            eyebrow="About AGS Trade"
            title="A dependable partner in global trade."
            description="AGS Trade connects manufacturers, suppliers, and buyers across continents. We manage the sourcing, freight, and paperwork that cross-border trade demands, so our clients can focus on growing their business."
          />
          <div className="mt-12 grid gap-8 border-t border-line pt-10 sm:grid-cols-2">
            <div>
              <h3 className="text-lg">Our Mission</h3>
              <p className="mt-3 text-[16px] leading-[1.7] text-muted">
                To make international trade simple, transparent, and reliable for businesses of every size.
              </p>
            </div>
            <div>
              <h3 className="text-lg">Our Values</h3>
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
