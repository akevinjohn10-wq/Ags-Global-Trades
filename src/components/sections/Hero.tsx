import Reveal from '@/components/ui/Reveal';
import Button from '@/components/ui/Button';
import HangingContainer from '@/components/ui/HangingContainer';
import { productCategories } from '@/data/siteContent';

const strip = productCategories.map((category) => category.name);

export default function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] scroll-mt-0 flex-col overflow-hidden bg-paper text-graphite"
    >
      {/* Soft vignette so the paper background feels lit, not flat */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#ffffff_0%,rgba(244,244,242,0)_62%)]"
      />

      {/* Hanging containers (decorative, hidden on small screens) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9vw] top-[8vh] hidden w-[clamp(200px,24vw,360px)] origin-top animate-sway md:block"
        style={{ ['--sway-from' as string]: '-1.5deg', ['--sway-to' as string]: '2.5deg' }}
      >
        <HangingContainer tone="charcoal" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-9vw] top-[16vh] hidden w-[clamp(200px,24vw,360px)] origin-top animate-sway md:block"
        style={{ ['--sway-from' as string]: '2deg', ['--sway-to' as string]: '-2.5deg', animationDelay: '-3s' }}
      >
        <HangingContainer tone="blue" mark />
      </div>

      <div className="container-x relative z-10 flex flex-1 flex-col items-center justify-center pb-10 pt-36 text-center sm:pt-40">
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-full border border-graphite/10 bg-white/70 px-4 py-1.5 text-xs font-medium uppercase tracking-eyebrow text-slate backdrop-blur">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
            Import-Export Trading
          </p>
        </Reveal>

        <Reveal delay={100}>
          <h1 className="mx-auto mt-7 max-w-4xl text-[42px] font-medium leading-[1.02] tracking-display text-graphite sm:text-[68px] lg:text-[88px]">
            Connecting Markets.
            <br />
            Delivering Globally.
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-[1.65] text-slate sm:mt-8 sm:text-lg">
            Reliable import-export solutions that move your goods across borders, from sourcing and customs clearance
            to final delivery.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="mt-9 flex flex-col items-center gap-3 sm:mt-11 sm:flex-row sm:gap-4">
            <Button href="#contact" variant="pill">
              Get a Quote
            </Button>
            <Button href="#services" variant="pill-light">
              Our Services
            </Button>
          </div>
        </Reveal>
      </div>

      {/* What we trade strip */}
      <div className="relative z-10 pb-8 sm:pb-10">
        <p className="text-center text-sm text-slate">What we trade, source, and deliver</p>
        <div
          className="mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
          aria-label="Product categories"
        >
          <ul className="flex w-max animate-marquee gap-12 pr-12 text-lg font-semibold tracking-tightest text-graphite/45 sm:gap-16 sm:pr-16 sm:text-xl">
            {[...strip, ...strip].map((name, index) => (
              <li key={`${name}-${index}`} className="whitespace-nowrap" aria-hidden={index >= strip.length}>
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
