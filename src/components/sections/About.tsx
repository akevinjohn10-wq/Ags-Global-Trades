import { ArrowDownToLine, ArrowUpFromLine, Search, Truck } from 'lucide-react';
import Parallax from '@/components/ui/Parallax';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { useInView } from '@/hooks/useInView';

const ABOUT_IMAGE = '/images/about.jpeg';

const pillars = [
  { label: 'Import', icon: ArrowDownToLine },
  { label: 'Export', icon: ArrowUpFromLine },
  { label: 'Sourcing', icon: Search },
  { label: 'Freight', icon: Truck },
];

export default function About() {
  const { ref, isInView } = useInView<HTMLDivElement>(0.2);

  return (
    <section id="about" className="section-y relative scroll-mt-24 overflow-hidden bg-paper">
      <div className="container-x">
        <SectionHeading
          align="split"
          eyebrow="About AGS Trade"
          title={'A dependable partner\nin global trade.'}
          description="AGS Trade connects manufacturers, suppliers, and buyers across continents. We manage the sourcing, freight, and paperwork that cross-border trade demands, so our clients can focus on growing their business."
        />

        <div className="mt-16 grid gap-6 lg:mt-24 lg:grid-cols-12">
          {/* Photo with wipe reveal */}
          <div ref={ref} className={`relative lg:col-span-7 ${isInView ? 'is-visible' : ''}`}>
            <div className="clip-reveal overflow-hidden rounded-lg">
              <Parallax speed={-0.06}>
                <img
                  src={ABOUT_IMAGE}
                  alt="The AGS Global Trade office"
                  loading="lazy"
                  className="h-[360px] w-full scale-110 object-cover sm:h-[520px] lg:h-[620px]"
                />
              </Parallax>
            </div>
            <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-md bg-ink/85 px-4 py-3 text-white backdrop-blur-md sm:bottom-6 sm:left-6">
              <span className="h-2.5 w-2.5 animate-blink bg-accent2" aria-hidden="true" />
              <span className="mono-caps">New Delhi, India</span>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5">
            <Reveal className="spot flex-1 rounded-lg border border-line bg-mist p-8 sm:p-10">
              <p className="mono-caps text-accent">01 — Mission</p>
              <h3 className="mt-6 font-display text-[26px] uppercase text-ink sm:text-[30px]">Our Mission</h3>
              <p className="mt-4 text-[17px] leading-[1.7] text-muted">
                To make international trade simple, transparent, and reliable for businesses of every size.
              </p>
            </Reveal>
            <Reveal delay={120} className="spot flex-1 rounded-lg bg-ink p-8 text-white sm:p-10">
              <p className="mono-caps text-sky">02 — Values</p>
              <h3 className="mt-6 font-display text-[26px] uppercase sm:text-[30px]">Our Values</h3>
              <p className="mt-4 text-[17px] leading-[1.7] text-white/70">
                Integrity, precision, and long-term partnerships guide every shipment we manage.
              </p>
            </Reveal>
            <Reveal delay={220}>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {pillars.map(({ label, icon: Icon }) => (
                  <li
                    key={label}
                    className="group flex items-center gap-2 rounded-md border border-line px-3 py-3 transition-colors duration-300 hover:border-accent hover:bg-accent hover:text-white"
                  >
                    <Icon size={16} strokeWidth={1.5} aria-hidden="true" className="text-accent transition-colors group-hover:text-white" />
                    <span className="mono-caps">{label}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
