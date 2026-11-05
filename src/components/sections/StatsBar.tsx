import Reveal from '@/components/ui/Reveal';
import { stats } from '@/data/siteContent';

export default function StatsBar() {
  return (
    <section aria-label="Company highlights" className="border-y border-line">
      <Reveal>
        <dl className="container-x grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center px-4 py-10 text-center lg:border-r lg:border-line lg:py-14 lg:last:border-r-0"
            >
              <dt className="order-2 mt-2 text-sm text-muted">{stat.label}</dt>
              <dd className="order-1 text-4xl font-bold tracking-tightest text-ink lg:text-5xl">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}
