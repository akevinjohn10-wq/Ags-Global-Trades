import Reveal from '@/components/ui/Reveal';
import Button from '@/components/ui/Button';
import Globe from '@/components/ui/Globe';
import SplitText from '@/components/ui/SplitText';
import Starfield from '@/components/ui/Starfield';

export default function Hero() {
  return (
    <section id="home" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-canvas">
      <Starfield />

      {/* Deep blue light pooling behind the globe */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[20vw] top-[-10vh] -z-10 h-[90vh] w-[80vw] animate-drift rounded-full bg-[radial-gradient(circle,rgba(30,90,230,0.34),rgba(10,30,110,0.12)_45%,transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-canvas to-transparent"
      />

      {/* Globe: large and cropped by the right edge on desktop, behind the copy on mobile */}
      <div className="pointer-events-none absolute inset-0 -z-[5]">
        <div className="pointer-events-auto absolute bottom-[-32vw] left-1/2 aspect-square w-[130vw] -translate-x-1/2 animate-fadein sm:bottom-[-22vw] sm:w-[110vw] lg:bottom-auto lg:left-auto lg:right-[-16vw] lg:top-1/2 lg:w-[min(72vw,1250px)] lg:-translate-y-1/2 lg:translate-x-0">
          <Globe />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1800px] flex-1 flex-col justify-center px-5 pb-24 pt-36 sm:px-6 sm:pt-44 lg:px-11 lg:pb-28">
        <Reveal>
          <p className="eyebrow inline-flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            Import-Export Trading
          </p>
        </Reveal>

        <SplitText
          as="h1"
          text={'Connecting\nMarkets.\nDelivering\nGlobally.'}
          delay={250}
          stagger={110}
          className="mt-6 text-[38px] font-semibold uppercase leading-[0.98] tracking-display text-white sm:text-[62px] lg:text-[70px] xl:text-[92px]"
        />

        <Reveal delay={900}>
          <p className="mt-8 max-w-md text-base leading-[1.65] text-muted sm:mt-10 sm:text-lg">
            Reliable import-export solutions that move your goods across borders, from sourcing and customs clearance
            to final delivery.
          </p>
        </Reveal>

        <Reveal delay={1100}>
          <div className="mt-9 flex flex-col gap-3 sm:mt-11 sm:flex-row sm:gap-4">
            <Button href="#contact" className="sm:min-w-[170px]">
              Get a Quote
            </Button>
            <Button href="#services" variant="outline" className="sm:min-w-[170px]">
              Our Services
            </Button>
          </div>
        </Reveal>
      </div>

      {/* Scroll cue */}
      <a
        href="#about"
        aria-label="Scroll to content"
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 font-mono text-[11px] uppercase tracking-eyebrow text-muted transition-colors hover:text-white sm:flex"
      >
        Scroll
        <span aria-hidden="true" className="relative block h-12 w-px overflow-hidden bg-white/15">
          <span className="absolute inset-0 animate-scrollcue bg-accent" />
        </span>
      </a>
    </section>
  );
}
