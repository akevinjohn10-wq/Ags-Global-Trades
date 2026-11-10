import { ArrowUpRight } from 'lucide-react';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { productCategories } from '@/data/siteContent';

export default function Products() {
  const lastIndex = productCategories.length - 1;

  return (
    <section id="products" className="section-y scroll-mt-24 bg-canvas">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            eyebrow="Products & Services"
            title="What we trade, source, and deliver."
            description="From commodities and machinery to sourcing and logistics, we support businesses across the full trade cycle."
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">
          {productCategories.map((category, index) => (
            <Reveal
              key={category.name}
              delay={(index % 3) * 80}
              // Last card spans two columns so the final row is full (11 cards in a 3-column grid)
              className={`h-full ${index === lastIndex ? 'lg:col-span-2' : ''}`}
            >
              <a
                href="#contact"
                aria-label={`Enquire about ${category.name}`}
                className="group relative block h-[360px] overflow-hidden rounded-3xl border border-line transition-all duration-500 hover:border-accent/60 hover:shadow-[0_24px_70px_-24px_rgba(61,139,255,0.55)] sm:h-[400px]"
              >
                <img
                  src={category.image}
                  alt={category.alt}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[linear-gradient(to_top,rgba(3,7,18,0.96)_0%,rgba(3,7,18,0.55)_45%,rgba(3,7,18,0.05)_100%)]"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                  <h3 className="text-xl text-white sm:text-2xl">{category.name}</h3>
                  <p className="mt-2 max-w-md text-sm leading-[1.65] text-white/70">{category.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                    Enquire
                    <ArrowUpRight
                      size={16}
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
