import { ArrowUpRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import SplitText from '@/components/ui/SplitText';
import { valuePoints } from '@/data/siteContent';

/** Sticky heading on the left, value cards on the right that flood blue on hover. */
export default function WhyChooseUs() {
  return (
    <section id="why-us" className="section-y scroll-mt-24 bg-paper">
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <Reveal>
              <p className="eyebrow">Why AGS Trade</p>
            </Reveal>
            <SplitText
              as="h2"
              text={'Built for\ntrade that\ncannot wait.'}
              stagger={60}
              className="mt-5 text-[32px] font-semibold leading-[1.02] text-ink sm:text-[48px] lg:text-[64px]"
            />
            <Reveal delay={200}>
              <p className="mt-6 max-w-md text-base leading-[1.7] text-muted sm:text-lg">
                A dedicated team, verified partners, and clear communication on every shipment.
              </p>
              <Button href="#contact" variant="outline" className="mt-8">
                Talk to our team
              </Button>
            </Reveal>
          </div>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          {valuePoints.map((point, i) => {
            const Icon = point.icon;
            return (
              <Reveal as="li" key={point.title} delay={i * 90} className={i % 2 === 1 ? 'sm:mt-16' : ''}>
                <article className="spot group flex h-full min-h-[320px] flex-col rounded-lg border border-line bg-mist p-7 transition-colors duration-500 ease-expo hover:border-accent hover:bg-accent sm:p-8">
                  <div className="flex items-start justify-between">
                    <span className="flex h-14 w-14 items-center justify-center rounded-md bg-paper text-accent transition-all duration-500 ease-expo group-hover:rotate-[-8deg] group-hover:bg-white">
                      <Icon size={26} strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <span className="mono-caps text-soft transition-colors duration-500 group-hover:text-white/70">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mt-auto pt-12 font-display text-[24px] uppercase leading-tight text-ink transition-colors duration-500 group-hover:text-white">
                    {point.title}
                  </h3>
                  <p className="mt-3 text-[16px] leading-[1.7] text-muted transition-colors duration-500 group-hover:text-white/80">
                    {point.description}
                  </p>
                  <ArrowUpRight
                    size={22}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="mt-6 -translate-x-2 text-white opacity-0 transition-all duration-500 ease-expo group-hover:translate-x-0 group-hover:opacity-100"
                  />
                </article>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
