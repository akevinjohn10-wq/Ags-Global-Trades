import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { productCategories } from '@/data/siteContent';
import { requestEnquiry } from '@/lib/enquiry';

/** Numbered accordion of product categories (the unitedcarriers.com "Industries" list). */
export default function Products() {
  const [open, setOpen] = useState<number | null>(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [finePointer] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  // Floating photo that trails the cursor and leans into the movement
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0, raf: 0 });
  useEffect(() => () => cancelAnimationFrame(pos.current.raf), []);
  const follow = (event: ReactMouseEvent) => {
    if (!finePointer || !sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const p = pos.current;
    p.tx = event.clientX - rect.left + 28;
    p.ty = event.clientY - rect.top - 110;
    if (p.raf) return;
    const tick = () => {
      const dx = p.tx - p.x;
      p.x += dx * 0.14;
      p.y += (p.ty - p.y) * 0.14;
      const el = previewRef.current;
      if (el) el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) rotate(${Math.max(-8, Math.min(8, dx * 0.06)).toFixed(2)}deg)`;
      p.raf = Math.abs(dx) + Math.abs(p.ty - p.y) > 0.4 ? requestAnimationFrame(tick) : 0;
    };
    p.raf = requestAnimationFrame(tick);
  };
  const showPreview = finePointer && hovered !== null && hovered !== open;
  const names = productCategories.map((c) => c.name);

  return (
    <section ref={sectionRef} id="catalogue" className="aurora-soft section-y relative isolate scroll-mt-24 overflow-hidden bg-paper">
      <div aria-hidden="true" className="dots-drift pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px]" />

      {finePointer && (
        <div ref={previewRef} aria-hidden="true" className="hover-preview" data-show={showPreview}>
          {productCategories.map((item, i) => (
            <img
              key={item.name}
              src={item.image}
              alt=""
              loading="lazy"
              className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500 ease-expo ${
                hovered === i ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
              }`}
            />
          ))}
          <span className="mono-caps absolute bottom-3 left-3 rounded bg-white/90 px-2 py-1 text-[10px] text-ink">
            {hovered !== null ? String(hovered + 1).padStart(2, '0') : ''} · Click to open
          </span>
        </div>
      )}

      <div className="container-x">
        <SectionHeading
          align="split"
          eyebrow="What we trade"
          title={'What we\nsource for you.'}
          description="Eleven categories we source and supply, each with its own suppliers, checks and shipping needs. Open one to see how we handle it."
        />

      </div>

      {/* Moving strip of category names */}
      <div aria-hidden="true" className="marquee-pause mt-14 overflow-hidden border-y border-ink/10 py-5 lg:mt-20">
        <div className="flex w-max animate-marquee [animation-duration:60s]">
          {[0, 1].map((copy) => (
            <p key={copy} className="flex shrink-0 items-center whitespace-nowrap font-display text-[34px] font-medium leading-none sm:text-[48px]">
              {names.map((name, i) => (
                <span key={name} className="flex items-center">
                  <span className={i % 2 ? 'text-accent' : 'text-transparent [-webkit-text-stroke:1px_rgba(27,30,36,0.35)]'}>{name}</span>
                  <span className="mx-6 inline-block h-2 w-2 bg-accent sm:mx-10" />
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>

      <div className="container-x">
        <ul className="mt-6 border-b border-ink/10 lg:mt-10" onMouseMove={follow} onMouseLeave={() => setHovered(null)}>
          {productCategories.map((item, i) => {
            const isOpen = open === i;
            const Icon = item.icon;
            const panelId = `product-panel-${i}`;
            return (
              <Reveal as="li" key={item.name} delay={Math.min(i, 5) * 50} className="relative">
                  {/* Row divider draws in as it scrolls into view */}
                  <span aria-hidden="true" className="draw-x absolute left-0 top-0 h-px w-full bg-ink/10" style={{ transitionDelay: `${Math.min(i, 5) * 80}ms` }} />
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
                      onMouseEnter={() => setHovered(i)}
                      className="group relative isolate flex w-full items-center gap-4 py-6 text-left sm:gap-8 sm:py-8"
                    >
                      {/* Tint that sweeps across the row on hover */}
                      <span
                        aria-hidden="true"
                        className={`absolute inset-y-0 -left-3 -right-3 -z-10 origin-left rounded-md bg-gradient-to-r from-mist to-mist/30 transition-transform duration-700 ease-expo sm:-left-5 sm:-right-5 ${
                          isOpen ? 'scale-x-0' : 'scale-x-0 group-hover:scale-x-100'
                        }`}
                      />
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

                        <div
                          data-tilt
                          className={`scan relative overflow-hidden rounded-lg bg-mist transition-transform duration-300 ease-out lg:col-span-5 ${isOpen ? 'animate-imgin' : 'opacity-0'}`}
                        >
                          {isOpen && (
                            <>
                              <img src={item.image} alt={item.alt} className="aspect-[4/3] w-full animate-kenburns object-cover" />
                              {/* Inspection viewfinder */}
                              <span aria-hidden="true" className="pointer-events-none absolute inset-4">
                                <span className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-white/90" />
                                <span className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-white/90" />
                                <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-white/90" />
                                <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-white/90" />
                              </span>
                              <span className="mono-caps absolute left-6 top-6 flex items-center gap-2 rounded bg-ink/70 px-2.5 py-1 text-[10px] text-white backdrop-blur">
                                <span className="h-1.5 w-1.5 animate-blink rounded-full bg-[#5BE38B]" />
                                Checked · {String(i + 1).padStart(2, '0')}
                              </span>
                            </>
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
