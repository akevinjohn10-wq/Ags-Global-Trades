import Button from '@/components/ui/Button';
import DotMap from '@/components/ui/DotMap';
import Logo from '@/components/ui/Logo';
import Reveal from '@/components/ui/Reveal';
import { allHubs } from '@/data/globe';
import { contactDetails } from '@/data/siteContent';

/** Closing call to action, styled to match the footer: dark navy, dotted map, restrained type. */
export default function CtaBand() {
  return (
    <section aria-label="Start an order" className="aurora grain relative isolate overflow-hidden bg-ink text-white">
      <div aria-hidden="true" className="map-sweep pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-40">
        <div className="map-drift h-full w-full">
          <DotMap theme="dark" hubs={allHubs} labels="none" intro={false} fit="cover" density={8} />
        </div>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-2/3 bg-gradient-to-r from-ink via-ink/70 to-transparent" />

      <div className="container-x grid gap-10 py-20 sm:py-28 lg:grid-cols-12 lg:items-end">
        <Reveal className="lg:col-span-7">
          <Logo height={44} />
          <p className="eyebrow eyebrow-light mt-10">Start an order</p>
          <h2 className="mt-5 max-w-2xl font-display text-[30px] font-medium leading-[1.05] sm:text-[44px]">Need a product sourced?</h2>
          <p className="mt-5 max-w-lg text-[16px] leading-[1.7] text-white/60 sm:text-[17px]">
            Tell us the product, the quantity and where it needs to go. We will come back with suppliers, prices and a delivery plan.
          </p>
        </Reveal>
        <Reveal delay={150} className="flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
          <Button href="#contact" variant="light">
            Request a quote
          </Button>
          <Button href={`tel:${contactDetails.phone.replace(/\s/g, '')}`} variant="outline-light" label={contactDetails.phone}>
            {contactDetails.phone}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
