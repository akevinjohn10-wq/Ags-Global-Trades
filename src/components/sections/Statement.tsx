import { useEffect, useState } from 'react';
import Reveal from '@/components/ui/Reveal';
import ScrubText from '@/components/ui/ScrubText';
import { useInView } from '@/hooks/useInView';
import { leaders as LEADERS, productCategories, services } from '@/data/siteContent';

const FACTS = [
  { value: productCategories.length, suffix: '', label: 'Product categories we source' },
  { value: services.length, suffix: '', label: 'Services under one roof' },
  { value: 1, suffix: '', label: 'Point of contact for every order' },
];

function CountUp({ to, play }: { to: number; play: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!play) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(to);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1400);
      setN(Math.round((1 - Math.pow(1 - t, 3)) * to));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [play, to]);
  return <>{String(n).padStart(2, '0')}</>;
}

/** White statement block right after the hero dive: scroll-lit headline, mission and quick facts. */
export default function Statement() {
  const { ref, isInView } = useInView<HTMLDivElement>(0.3);

  return (
    <section id="about" className="relative scroll-mt-24 bg-paper pb-20 pt-10 sm:pb-28 lg:pb-36">
      <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <Reveal>
            <p className="eyebrow">About AGS Trade</p>
          </Reveal>
          <ScrubText
            text="You name it. We source it. We own the outcome."
            highlight={['source', 'outcome']}
            className="mt-8 font-display text-[44px] font-medium leading-[0.95] tracking-display text-ink sm:text-[72px] lg:text-[92px]"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <Reveal className="border-t border-ink/10 pt-5">
              <h3 className="flex items-center gap-3 font-display text-[24px] font-medium tracking-[-0.02em] text-ink sm:text-[28px]"><span className="h-2 w-2 bg-accent" aria-hidden="true" />Our mission</h3>
              <p className="mt-3 text-[17px] leading-[1.65] text-muted lg:text-[18px]">
                To make sourcing simple, transparent, and reliable for businesses of every size.
              </p>
            </Reveal>
            <Reveal delay={100} className="border-t border-ink/10 pt-5">
              <h3 className="flex items-center gap-3 font-display text-[24px] font-medium tracking-[-0.02em] text-ink sm:text-[28px]"><span className="h-2 w-2 bg-accent" aria-hidden="true" />Our values</h3>
              <p className="mt-3 text-[17px] leading-[1.65] text-muted lg:text-[18px]">
                Integrity, precision, and long-term partnerships guide every order we handle.
              </p>
            </Reveal>
          </div>

          {/* Leadership */}
          <Reveal delay={150} className="mt-10 border-t border-ink/10 pt-5">
            <h3 className="flex items-center gap-3 font-display text-[24px] font-medium tracking-[-0.02em] text-ink sm:text-[28px]"><span className="h-2 w-2 bg-accent" aria-hidden="true" />Leadership</h3>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {LEADERS.map((p) => (
                <li key={p.name} className="flex items-center gap-4 rounded-lg border border-ink/10 bg-mist/60 p-4">
                  <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[17px] font-medium text-white">
                    {p.name.split(' ').map((w) => w[0]).join('')}
                  </span>
                  <span>
                    <span className="block font-display text-[19px] font-medium leading-tight text-ink lg:text-[20px]">{p.name}</span>
                    <span className="mt-1 block font-mono text-[12px] uppercase tracking-eyebrow text-accent lg:text-[13px]">{p.role}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div ref={ref} className="flex flex-col justify-end lg:col-span-4 lg:col-start-9">
          <Reveal>
            <p className="text-[18px] leading-[1.7] text-ink">
              AGS Trade is a sourcing and supply company based in New Delhi. You tell us what you need and how many; we find
              verified suppliers, negotiate the price, check the goods and arrange shipping through established shipping lines
              and courier partners.
            </p>
            <p className="mt-4 text-[16px] lg:text-[18px] leading-[1.7] text-muted">
              No chasing multiple vendors, no surprises at delivery. Just one team, accountable from enquiry to your door.
            </p>
          </Reveal>
          <ul className="mt-10">
            {FACTS.map((fact, i) => (
              <Reveal as="li" key={fact.label} delay={i * 120} className="border-t border-ink/10 py-6">
                <p className="font-display text-[64px] font-medium leading-none text-ink sm:text-[80px]">
                  <CountUp to={fact.value} play={isInView} />
                  {fact.suffix}
                </p>
                <p className="mt-2 text-[16px] lg:text-[17px] text-muted">{fact.label}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
