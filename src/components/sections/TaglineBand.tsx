import Parallax from '@/components/ui/Parallax';
import Reveal from '@/components/ui/Reveal';
import SplitText from '@/components/ui/SplitText';

const POSTER = '/images/hero-poster.jpg';
const VIDEO = '/images/hero-video.mp4';

/** Full-width cinematic band: looping world-map video with the company tagline. */
export default function TaglineBand() {
  return (
    <section aria-label="Company tagline" className="relative isolate overflow-hidden bg-deep">
      <video
        src={VIDEO}
        poster={POSTER}
        aria-label="World map showing global trade routes connecting markets across continents"
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-60"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      {/* Fade into the neighbouring sections */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,#02040B_0%,rgba(2,4,11,0.3)_28%,rgba(2,4,11,0.3)_68%,#02040B_100%)]"
      />

      <div className="container-x py-28 text-center sm:py-40 lg:py-56">
        <Parallax speed={-0.06}>
          <Reveal>
            <p className="eyebrow inline-flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-accent" />
              AGS Global Trade
              <span aria-hidden="true" className="h-px w-8 bg-accent" />
            </p>
          </Reveal>
          <SplitText
            text={'Connecting markets.\nDelivering value.'}
            className="mx-auto mt-7 max-w-5xl text-[30px] font-semibold uppercase leading-[1.05] tracking-display text-white sm:text-5xl lg:text-[72px]"
          />
        </Parallax>
      </div>
    </section>
  );
}
