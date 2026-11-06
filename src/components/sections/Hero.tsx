import Reveal from '@/components/ui/Reveal';
import Button from '@/components/ui/Button';

   const HERO_VIDEO = '/images/hero-video.mp4';
export default function Hero() {
  return (
    <section id="home" className="scroll-mt-[72px] pb-24 pt-20 lg:pb-[120px] lg:pt-[120px]">
      <div className="container-x">
        <div className="grid items-end gap-10 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow">Import-Export Trading</p>
            <h1 className="mt-6 text-[40px] font-bold text-ink sm:text-[56px] lg:text-[64px]">
              Connecting Markets. Delivering Globally.
            </h1>
          </Reveal>

          <Reveal delay={150}>
            <p className="max-w-xl text-lg leading-[1.7] text-muted">
              Reliable import-export solutions that move your goods across borders, from sourcing and customs
              clearance to final delivery.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button href="#contact" className="w-full sm:w-auto">
                Get a Quote
              </Button>
              <Button href="#services" variant="outline" className="w-full sm:w-auto">
                Our Services
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} className="mt-16 lg:mt-20">
          <figure className="overflow-hidden rounded-[4px] border border-line">
            <video
              src={HERO_VIDEO}
              alt="World map showing global trade routes connecting markets across continents"
              className="aspect-[1280/533] w-full object-cover"
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
