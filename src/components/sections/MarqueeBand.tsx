import { productCategories } from '@/data/siteContent';

/** bluesqx-style strip under the hero: everything we trade, scrolling past. */
export default function MarqueeBand() {
  const items = [...productCategories, ...productCategories];

  return (
    <section aria-label="Product categories" className="marquee-pause border-y border-line bg-paper">
      <div className="flex items-stretch">
        <p className="mono-caps hidden shrink-0 items-center border-r border-line bg-mist px-8 text-muted md:flex lg:px-12">What we source</p>
        <div className="relative flex-1 overflow-hidden py-5">
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-paper to-transparent" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-paper to-transparent" />
          <ul className="flex w-max animate-marquee items-center">
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={`${item.name}-${i}`} aria-hidden={i >= productCategories.length} className="flex items-center gap-3 px-7 text-ink/70">
                  <Icon size={20} strokeWidth={1.5} aria-hidden="true" className="text-accent" />
                  <span className="whitespace-nowrap font-display text-[17px] font-semibold uppercase tracking-tight">{item.name}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
