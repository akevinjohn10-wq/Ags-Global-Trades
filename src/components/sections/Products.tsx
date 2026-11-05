import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { productCategories } from '@/data/siteContent';

export default function Products() {
  return (
    <section id="products" className="section-y scroll-mt-[72px] bg-surface">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            eyebrow="Products"
            title="Categories we trade across every market."
            description="From raw agricultural commodities to finished industrial equipment, we source and ship across six core categories."
          />
        </Reveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {productCategories.map((category, index) => (
            <Reveal key={category.name} delay={index * 80}>
              <article className="group h-full overflow-hidden rounded-[4px] border border-line bg-canvas transition-shadow duration-300 hover:shadow-sm">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.alt}
                    loading="lazy"
                    className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg">{category.name}</h3>
                  <p className="mt-2 text-sm leading-[1.7] text-muted">{category.description}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
