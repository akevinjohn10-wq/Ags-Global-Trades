import { productCategories, services } from '@/data/siteContent';

const rowA = services.map((service) => service.title);
const rowB = productCategories.map((category) => category.name);

function Row({ words, reverse = false }: { words: string[]; reverse?: boolean }) {
  const loop = [...words, ...words];
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <ul className={`flex w-max items-center gap-10 pr-10 ${reverse ? 'animate-marquee-rev' : 'animate-marquee'}`}>
        {loop.map((word, index) => (
          <li
            key={`${word}-${index}`}
            aria-hidden={index >= words.length}
            className="flex items-center gap-10 whitespace-nowrap font-display text-[44px] font-semibold uppercase leading-none tracking-display sm:text-7xl lg:text-[96px]"
          >
            <span className={reverse ? 'text-outline' : 'text-white'}>{word}</span>
            <span aria-hidden="true" className="text-2xl text-accent sm:text-4xl">
              ✦
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Two oversized scrolling word rows (one solid, one outlined) running in opposite directions. */
export default function MarqueeBand() {
  return (
    <section aria-label="What we do" className="relative overflow-hidden bg-canvas py-14 sm:py-20">
      <div className="space-y-6 sm:space-y-9">
        <Row words={rowA} />
        <Row words={rowB} reverse />
      </div>
    </section>
  );
}
