import Button from '@/components/ui/Button';
import Parallax from '@/components/ui/Parallax';
import Reveal from '@/components/ui/Reveal';
import ScrubText from '@/components/ui/ScrubText';
import { useInView } from '@/hooks/useInView';
import { missionStatement } from '@/data/siteContent';

const ABOUT_IMAGE = '/images/about.jpeg';

export default function About() {
  const { ref, isInView } = useInView<HTMLDivElement>(0.2);

  return (
    <section id="about" className="section-y relative scroll-mt-24 overflow-hidden bg-paper">
      <div className="container-x">
        {/* Mission statement that lights up word by word */}
        <div className="grid gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-3">
            <p className="eyebrow">About AGS Trade</p>
            <p className="mono-caps mt-4 text-soft">Sourcing &amp; supply · New Delhi</p>
          </Reveal>
          <div className="lg:col-span-9">
            <ScrubText
              text={missionStatement}
              highlight={['sourcing', 'supply', 'verified', 'shipping']}
              className="font-display text-[26px] font-semibold leading-[1.18] tracking-display text-ink sm:text-[38px] lg:text-[50px]"
            />
            <Reveal delay={100} className="mt-10 flex flex-wrap gap-3">
              <Button href="#contact" variant="accent">
                Request a quote
              </Button>
              <Button href="#process" variant="outline">
                How it works
              </Button>
            </Reveal>
          </div>
        </div>

        <div className="mt-20 grid gap-6 lg:mt-28 lg:grid-cols-12">
          {/* Photo with wipe reveal */}
          <div ref={ref} className={`relative lg:col-span-7 ${isInView ? 'is-visible' : ''}`}>
            <div className="clip-reveal overflow-hidden rounded-lg">
              <Parallax speed={-0.06}>
                <img
                  src={ABOUT_IMAGE}
                  alt="The AGS Global Trade office"
                  loading="lazy"
                  className="h-[360px] w-full scale-110 object-cover sm:h-[520px] lg:h-[600px]"
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
                To make sourcing simple, transparent, and reliable for businesses of every size.
              </p>
            </Reveal>
            <Reveal delay={120} className="spot flex-1 rounded-lg bg-ink p-8 text-white sm:p-10">
              <p className="mono-caps text-sky">02 — Values</p>
              <h3 className="mt-6 font-display text-[26px] uppercase sm:text-[30px]">Our Values</h3>
              <p className="mt-4 text-[17px] leading-[1.7] text-white/70">
                Integrity, precision, and long-term partnerships guide every order we handle.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
