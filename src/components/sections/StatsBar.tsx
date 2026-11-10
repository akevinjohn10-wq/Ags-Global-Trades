import Reveal from '@/components/ui/Reveal';
import { stats } from '@/data/siteContent';

const POSTER = '/images/hero-poster.jpg';
const VIDEO = '/images/hero-video.mp4';

export default function StatsBar() {
  return (
    <section aria-label="Company highlights" className="relative isolate overflow-hidden bg-deep">
      <video
        src={VIDEO}
        poster={POSTER}
        aria-label="World map showing global trade routes connecting markets across continents"
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-70"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      {/* Fade into the neighbouring sections */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,#050B1A_0%,rgba(5,11,26,0.35)_30%,rgba(5,11,26,0.35)_65%,#050B1A_100%)]"
      />

      <div className="container-x py-24 text-center sm:py-32 lg:py-44">
        <Reveal>
          <p className="eyebrow inline-flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            AGS Global Trade
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
          </p>
          <h2 className="mx-auto mt-6 max-w-4xl text-[34px] font-medium leading-[1.05] tracking-display text-white sm:text-6xl lg:text-[76px]">
            Connecting markets.
            <br />
            <span className="bg-gradient-to-r from-white via-[#9CC5FF] to-accent bg-clip-text text-transparent">
              Delivering value.
            </span>
          </h2>
        </Reveal>

        <Reveal delay={150}>
          <dl className="mx-auto mt-14 grid max-w-xl grid-cols-2 gap-4 sm:mt-20">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-7 backdrop-blur-md sm:py-9"
              >
                <dd className="text-4xl font-semibold tracking-display text-white sm:text-5xl">{stat.value}</dd>
                <dt className="mt-2 text-sm text-muted">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
