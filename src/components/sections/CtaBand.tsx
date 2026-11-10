import Button from '@/components/ui/Button';
import DotMap from '@/components/ui/DotMap';
import Reveal from '@/components/ui/Reveal';
import { contactDetails } from '@/data/siteContent';

const PHRASES = ['Connecting markets', 'Delivering globally'];

/** Electric-blue closing band with an oversized moving headline. */
export default function CtaBand() {
  const row = [...PHRASES, ...PHRASES, ...PHRASES];

  return (
    <section aria-label="Start a shipment" className="relative isolate overflow-hidden bg-accent text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-60">
        <DotMap theme="blue" labels="none" animated={false} intro={false} fit="cover" density={9} />
      </div>

      <div className="marquee-pause overflow-hidden border-b border-white/15 py-8 sm:py-12">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <p
              key={copy}
              aria-hidden={copy === 1}
              className="flex shrink-0 items-center whitespace-nowrap font-display text-[64px] font-semibold uppercase leading-none sm:text-[120px] lg:text-[160px]"
            >
              {row.map((phrase, i) => (
                <span key={`${phrase}-${i}`} className="flex items-center">
                  <span style={i % 2 ? { color: 'transparent', WebkitTextStroke: '2px #fff' } : undefined}>{phrase}</span>
                  <span aria-hidden="true" className="mx-8 inline-block h-[0.32em] w-[0.32em] bg-white sm:mx-12" />
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>

      <div className="container-x grid gap-10 py-14 sm:py-20 lg:grid-cols-12 lg:items-end">
        <Reveal className="lg:col-span-7">
          <p className="eyebrow eyebrow-light [&::before]:bg-white">Start a shipment</p>
          <h2 className="mt-5 text-[32px] font-semibold leading-[1.02] sm:text-[48px] lg:text-[60px]">Ready to move your next shipment?</h2>
          <p className="mt-5 max-w-xl text-lg text-white/75">Tell us what you trade and where it needs to go.</p>
        </Reveal>
        <Reveal delay={150} className="flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
          <Button href="#contact" variant="light">
            Get a quote
          </Button>
          <Button href={`tel:${contactDetails.phone.replace(/\s/g, '')}`} variant="outline-light" label={contactDetails.phone}>
            {contactDetails.phone}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
