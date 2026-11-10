import { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { productCategories } from '@/data/siteContent';
import { requestEnquiry } from '@/lib/enquiry';

/** Numbered accordion of product categories (the unitedcarriers.com "Industries" list). */
export default function Products() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="catalogue" className="section-y scroll-mt-24 bg-paper">
      <div className="container-x">
        <SectionHeading
          align="split"
          eyebrow="What we trade"
          title={'What we\nsource for you.'}
          description="Eleven categories we source and supply, each with its own suppliers, checks and shipping needs. Open one to see how we handle it."
        />

        <ul className="mt-14 border-b border-ink/10 lg:mt-20">
          {productCategories.map((item, i) => {
            const isOpen = open === i;
            const Icon = item.icon;
            const panelId = `product-panel-${i}`;
            return (
              <Reveal as="li" key={item.name} delay={Math.min(i, 5) * 50} className="relative border-t border-ink/10">
                  {/* Accent bar that grows across the row when open */}
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-[-1px] h-[2px] w-full origin-left bg-accent transition-transform duration-700 ease-expo ${isOpen ? 'scale-x-100' : 'scale-x-0'}`}
                  />
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="group flex w-full items-center gap-4 py-6 text-left sm:gap-8 sm:py-8"
                    >
                      <span className={`mono-caps w-8 shrink-0 transition-colors duration-300 ${isOpen ? 'text-accent' : 'text-soft group-hover:text-accent'}`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`flex-1 font-display text-[20px] font-medium leading-tight transition-all duration-500 ease-expo sm:text-[30px] lg:text-[40px] ${
                          isOpen ? 'text-ink' : 'text-ink/70 group-hover:translate-x-2 group-hover:text-ink'
                        }`}
                      >
                        {item.name}
                      </span>
                      <span
                        className={`hidden items-center gap-2 rounded border px-3 py-1.5 font-mono text-[11px] uppercase tracking-eyebrow transition-all duration-500 md:flex ${
                          isOpen ? 'border-accent text-accent opacity-100' : 'border-ink/15 text-muted opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
                        {isOpen ? 'Open' : 'View'}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-all duration-500 ease-expo sm:h-12 sm:w-12 ${
                          isOpen ? 'border-accent bg-accent text-white' : 'border-ink/15 text-ink group-hover:border-ink group-hover:bg-ink group-hover:text-white'
                        }`}
                      >
                        <Plus size={20} strokeWidth={1.5} className={`transition-transform duration-500 ease-expo ${isOpen ? 'rotate-45' : 'group-hover:rotate-90'}`} />
                      </span>
                    </button>
                  </h3>

                  <div id={panelId} role="region" aria-label={item.name} className="collapse-grid" data-open={isOpen}>
                    <div>
                      <div className="grid gap-8 pb-10 pl-0 sm:pl-16 lg:grid-cols-12 lg:gap-10 lg:pb-14">
                        <div
                          className={`flex flex-col justify-between gap-8 transition-all duration-700 ease-expo lg:col-span-4 ${isOpen ? 'translate-y-0 opacity-100 delay-150' : 'translate-y-4 opacity-0'}`}
                        >
                          <p className="text-[20px] font-medium leading-snug text-ink sm:text-[24px]">{item.description}</p>
                          <Button variant="dark" onClick={() => requestEnquiry(item.name)} label="Enquire about this" className="self-start">
                            Enquire about this
                          </Button>
                        </div>

                        <div
                          className={`transition-all duration-700 ease-expo lg:col-span-3 ${isOpen ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-4 opacity-0'}`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="mono-caps shrink-0 text-ink">Why choose us</span>
                            <span className="h-px flex-1 bg-ink/15" />
                          </div>
                          <ul className="mt-5 space-y-3">
                            {item.points.map((point) => (
                              <li key={point} className="flex gap-3 text-[16px] leading-[1.6] text-muted">
                                <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 bg-accent" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div data-tilt className={`overflow-hidden rounded-lg bg-mist transition-transform duration-300 ease-out lg:col-span-5 ${isOpen ? 'animate-imgin' : 'opacity-0'}`}>
                          {isOpen && (
                            <img
                              src={item.image}
                              alt={item.alt}
                              className="aspect-[4/3] w-full animate-kenburns object-cover"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
