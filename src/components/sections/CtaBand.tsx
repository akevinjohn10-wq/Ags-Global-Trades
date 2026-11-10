import { Phone } from 'lucide-react';
import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import SplitText from '@/components/ui/SplitText';
import { contactDetails } from '@/data/siteContent';

const VIDEO = '/images/network-loop.mp4';
const POSTER = '/images/network-poster.jpg';

/** Full-bleed call to action over a looping trade-route animation. */
export default function CtaBand() {
  return (
    <section aria-label="Get in touch" className="relative isolate overflow-hidden bg-deep">
      <video
        src={VIDEO}
        poster={POSTER}
        aria-hidden="true"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,#02040B_0%,rgba(2,4,11,0.35)_30%,rgba(2,4,11,0.35)_70%,#02040B_100%)]"
      />

      <div className="container-x py-28 text-center sm:py-36 lg:py-48">
        <SplitText
          text={'Ready to move\nyour next shipment?'}
          className="mx-auto max-w-4xl text-[30px] font-semibold uppercase leading-[1.05] tracking-display text-white sm:text-5xl lg:text-[68px]"
        />
        <Reveal delay={300}>
          <p className="mx-auto mt-7 max-w-md text-base text-muted sm:text-lg">
            Tell us what you trade and where it needs to go.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button href="#contact" variant="accent" className="sm:min-w-[180px]">
              Get a Quote
            </Button>
            <Button href={`tel:${contactDetails.phone.replace(/\s/g, '')}`} variant="outline" className="sm:min-w-[180px]">
              <Phone size={15} aria-hidden="true" />
              {contactDetails.phone}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
