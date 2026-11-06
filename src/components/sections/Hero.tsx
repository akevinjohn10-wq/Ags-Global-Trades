import Reveal from '@/components/ui/Reveal';
import Button from '@/components/ui/Button';

const HERO_IMAGE = '/images/WhatsApp_Image_2026-11-05_at_7.18.56_PM.jpeg';
const HERO_VIDEO = '/images/hero-video.mp4';

export default function Hero() {
  return (
    <section id="home" className="scroll-mt-[72px] pb-14 pt-10 sm:pb-20 sm:pt-20 lg:pb-[120px] lg:pt-[120px]">
      <div className="container-x">
        <div className="grid items-end gap-6 sm:gap-10 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow">Import-Export Trading</p>
            <h1 className="mt-4 text-[32px] font-bold leading-[1.15] text-ink sm:mt-6 sm:text-[52px] lg:text-[64px]">
              Connecting Markets. Delivering Globally.
            </h1>
          </Reveal>

          <Reveal delay={150}>
            <p className="max-w-xl text-base leading-[1.65] text-muted sm:text-lg sm:leading-[1.7]">
              Reliable import-export solutions that move your goods across borders, from sourcing and customs
              clearance to final delivery.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
              <Button href="#contact" className="w-full sm:w-auto">
                Get a Quote
              </Button>
              <Button href="#services" variant="outline" className="w-full sm:w-auto">
                Our Services
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} className="mt-10 sm:mt-16 lg:mt-20">
          <figure className="overflow-hidden rounded-[4px] border border-line">
            <video
              src={HERO_VIDEO}
              poster={HERO_IMAGE}
              aria-label="World map showing global trade routes connecting markets across continents"
              className="aspect-[16/10] w-full object-cover sm:aspect-[1280/533]"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
