import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Lock, Mail, MessageCircle, Phone, X } from 'lucide-react';
import { LogoMark } from '@/components/ui/Logo';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { catalogues, contactDetails, type Catalogue } from '@/data/siteContent';
import { requestEnquiry } from '@/lib/enquiry';

const SAMPLES = 3; // public sample pages per catalogue (0 = cover)
const LOCKED = SAMPLES; // index of the locked "full catalogue" slide

const src = (slug: string, i: number) => `/catalogues/${slug}-${i === LOCKED ? 'locked' : i}.webp`;
const phoneDigits = contactDetails.phone.replace(/\D/g, '');
const whatsappDigits = contactDetails.whatsapp.replace(/\D/g, '');

/** Discourage saving the catalogue pages: no right-click menu, dragging or long-press save. */
const guard = {
  draggable: false,
  onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  onDragStart: (e: React.DragEvent) => e.preventDefault(),
};

function requestText(c: Catalogue) {
  return `Hello AGS Trade, please send me the full ${c.title} catalogue (${c.pages} pages).`;
}

/** Ways to get the full PDF: WhatsApp, email, phone or the enquiry form. */
function RequestOptions({ text, subject, onForm, tone = 'light' }: { text: string; subject: string; onForm: () => void; tone?: 'light' | 'dark' }) {
  const base =
    tone === 'dark'
      ? 'border-white/15 text-white hover:border-white hover:bg-white hover:text-ink'
      : 'border-ink/15 text-ink hover:border-ink hover:bg-ink hover:text-white';
  const item = `flex items-center gap-3 rounded-md border px-4 py-3 text-[15px] lg:text-[16px] transition-colors duration-300 ${base}`;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <a className={item} href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
        <MessageCircle size={17} strokeWidth={1.6} aria-hidden="true" /> WhatsApp
      </a>
      <a className={item} href={`mailto:${contactDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`}>
        <Mail size={17} strokeWidth={1.6} aria-hidden="true" /> Email us
      </a>
      <a className={item} href={`tel:+${phoneDigits}`}>
        <Phone size={17} strokeWidth={1.6} aria-hidden="true" /> {contactDetails.phone}
      </a>
      <button type="button" className={`${item} text-left`} onClick={onForm}>
        <ArrowUpRight size={17} strokeWidth={1.6} aria-hidden="true" /> Enquiry form
      </button>
    </div>
  );
}

function Viewer({ c, onClose }: { c: Catalogue; onClose: () => void }) {
  const [page, setPage] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const total = SAMPLES + 1;
  const go = useCallback((d: number) => setPage((p) => Math.min(total - 1, Math.max(0, p + d))), [total]);

  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [go, onClose]);

  // Preload the remaining sample pages once the viewer is open
  useEffect(() => {
    for (let i = 1; i < total; i++) new Image().src = src(c.slug, i);
  }, [c.slug, total]);

  const toForm = () => {
    onClose();
    requestEnquiry(c.category, requestText(c));
  };
  const locked = page === LOCKED;
  const touchX = useRef<number | null>(null);

  // the shield + watermark sit exactly over the rendered page, not the dark stage around it
  const imgRef = useRef<HTMLImageElement>(null);
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const measure = () => setBox(img.offsetWidth ? { left: img.offsetLeft, top: img.offsetTop, width: img.offsetWidth, height: img.offsetHeight } : null);
    measure();
    img.addEventListener('load', measure);
    const ro = new ResizeObserver(measure);
    ro.observe(img);
    return () => {
      img.removeEventListener('load', measure);
      ro.disconnect();
    };
  }, [page]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`${c.title} catalogue preview`} className="cat-viewer fixed inset-0 z-[90] flex flex-col bg-[#060A18] text-white" onContextMenu={(e) => e.preventDefault()}>
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <LogoMark height={28} className="hidden sm:block" />
          <span aria-hidden="true" className="hidden h-8 w-px bg-white/15 sm:block" />
          <div className="min-w-0">
          <p className="mono-caps text-sky">Catalogue preview</p>
          <h3 className="truncate font-display text-[18px] font-medium sm:text-[22px]">{c.title}</h3>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="mono-caps hidden text-white/50 sm:inline">
            {locked ? `${c.pages} pages` : `Page ${page + 1} of ${SAMPLES} samples`}
          </span>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close preview" className="flex h-10 w-10 items-center justify-center rounded-md border border-white/15 transition-colors hover:bg-white hover:text-ink">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-3 py-4 sm:px-20 sm:py-6"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        <button type="button" onClick={() => go(-1)} disabled={page === 0} aria-label="Previous page" className="absolute left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 transition-colors hover:bg-white hover:text-ink disabled:opacity-30 sm:left-5 sm:flex">
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <div className="relative flex h-full max-h-full w-full max-w-[1200px] items-center justify-center">
          <img
            key={page}
            src={src(c.slug, page)}
            alt={locked ? '' : `${c.title}, sample page ${page + 1}`}
            ref={imgRef}
            className="cat-page cat-protect max-h-full max-w-full rounded-md object-contain shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]"
            decoding="async"
            {...guard}
          />
          {/* a clear layer over the page takes the clicks and long-presses, so "Save image" and image search have nothing to grab; inner pages also carry a faint watermark (the cover stays clean) */}
          {!locked && box && (
            <span
              aria-hidden="true"
              className={`cat-shield absolute rounded-md ${page > 0 ? 'cat-watermark' : ''}`}
              style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
              {...guard}
            />
          )}
          {locked && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="max-h-full w-full max-w-md overflow-y-auto rounded-lg border border-white/10 bg-[#0A1640] p-6 sm:p-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent">
                  <Lock size={18} aria-hidden="true" />
                </span>
                <h4 className="mt-5 font-display text-[24px] font-medium leading-tight">Get the full {c.pages}-page catalogue</h4>
                <p className="mt-3 text-[15px] lg:text-[16px] leading-[1.65] text-white/65">
                  Full specifications, sizes, packing and loading details. Contact us and we will send the PDF with prices for your quantity.
                </p>
                <div className="mt-6">
                  <RequestOptions text={requestText(c)} subject={`${c.title} catalogue request`} onForm={toForm} tone="dark" />
                </div>
              </div>
            </div>
          )}
        </div>
        <button type="button" onClick={() => go(1)} disabled={page === total - 1} aria-label="Next page" className="absolute right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 transition-colors hover:bg-white hover:text-ink disabled:opacity-30 sm:right-5 sm:flex">
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto border-t border-white/10 px-5 py-3 sm:justify-center sm:px-8">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPage(i)}
            aria-label={i === LOCKED ? 'Full catalogue' : `Sample page ${i + 1}`}
            aria-current={i === page}
            className={`relative h-14 w-20 shrink-0 overflow-hidden rounded border transition-[border-color,opacity] duration-300 sm:h-16 sm:w-24 ${i === page ? 'border-white opacity-100' : 'border-white/15 opacity-60 hover:opacity-100'}`}
          >
            <img src={src(c.slug, i)} alt="" loading="lazy" className="cat-protect h-full w-full object-cover" {...guard} />
            {i === LOCKED && (
              <span className="absolute inset-0 flex items-center justify-center bg-ink/60">
                <Lock size={15} aria-hidden="true" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Catalogue library: covers in a grid, a sample-page viewer, and the full PDF on request.
 *  Collapsed, the grid shows its first row and half of the second under a frosted fade, with a button to reveal the rest. */
export default function Catalogues() {
  const [open, setOpen] = useState<Catalogue | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [expanded, setExpanded] = useState(false);
  // cut: the collapsed height (px); peek: where the second row starts; hiddenFrom: index of the first item below the cut
  const [layout, setLayout] = useState<{ cut: number; peek: number; full: number; hiddenFrom: number } | null>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const ul = listRef.current;
    if (!ul) return;
    const measure = () => {
      const lis = Array.from(ul.children) as HTMLElement[];
      if (!lis.length) return;
      // the row to half-show: the first new row that starts at least two cards in (row 2 on grids, card 3 on phones)
      const row2 = lis.find((li, i) => i >= 2 && li.offsetTop > lis[i - 1].offsetTop + 4);
      const row3 = row2 && lis.find((li) => li.offsetTop > row2.offsetTop + 4);
      if (!row2 || !row3) return setLayout(null); // nothing below the peek row: no need to fold
      const cover = (row2.firstElementChild?.firstElementChild as HTMLElement | null)?.offsetHeight ?? row2.offsetHeight;
      setLayout({
        peek: row2.offsetTop,
        cut: Math.round(row2.offsetTop + cover * 0.55),
        full: ul.scrollHeight,
        hiddenFrom: lis.indexOf(row2),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ul);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const folded = !!layout && !expanded;
  const extra = layout ? catalogues.length - layout.hiddenFrom : 0;

  const toggle = () => {
    setAnimating(true);
    window.setTimeout(() => setAnimating(false), 900);
    if (expanded) {
      // pin the current full height first so the fold animates instead of snapping
      requestAnimationFrame(() => requestAnimationFrame(() => setExpanded(false)));
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else setExpanded(true);
  };

  // folded-away cards can't be reached by keyboard or screen readers until revealed
  useEffect(() => {
    const lis = Array.from(listRef.current?.children ?? []) as HTMLElement[];
    lis.forEach((li, i) => {
      if (folded && layout && i >= layout.hiddenFrom) li.setAttribute('inert', '');
      else li.removeAttribute('inert');
    });
  }, [folded, layout]);

  // collapsed: clip at the cut; opening/closing: animate between the cut and the full height; open: no limit
  const maxHeight = !layout ? undefined : folded ? layout.cut : animating ? layout.full : undefined;

  return (
    <section ref={sectionRef} id="catalogues" className="section-y relative scroll-mt-24 bg-mist">
      <div className="container-x">
        <SectionHeading
          align="split"
          eyebrow="Catalogues"
          title={'Browse our\ncatalogues.'}
          description="Preview sample pages from each range. For the full catalogue with specifications and pricing, contact us and we will send it over."
        />

        <div className="relative mt-14 lg:mt-20">
          <div
            className="overflow-hidden transition-[max-height] duration-[900ms] ease-expo"
            style={{ maxHeight }}
          >
            <ul
              id="catalogue-list"
              ref={listRef}
              onContextMenu={(e) => { if ((e.target as HTMLElement).closest('.cat-card')) e.preventDefault(); }}
              className="grid gap-x-6 gap-y-12 pb-2 sm:grid-cols-2 lg:grid-cols-3"
            >
              {catalogues.map((c, i) => (
                <Reveal as="li" key={c.slug} delay={(i % 3) * 90}>
                  <button type="button" onClick={() => setOpen(c)} className="cat-card group block w-full text-left" aria-label={`Preview the ${c.title} catalogue`}>
                    <div className="relative aspect-[297/210]">
                      {/* page stack behind the cover */}
                      <span aria-hidden="true" className="cat-sheet absolute inset-0 rounded-md bg-white shadow-sm" style={{ ['--r' as string]: '3deg', ['--x' as string]: '10px' }} />
                      <span aria-hidden="true" className="cat-sheet absolute inset-0 rounded-md bg-white shadow-sm" style={{ ['--r' as string]: '-2.5deg', ['--x' as string]: '-8px' }} />
                      <span className="cat-cover absolute inset-0 overflow-hidden rounded-md shadow-[0_24px_50px_-28px_rgba(10,22,64,0.55)]">
                        <img src={src(c.slug, 0)} alt="" loading="lazy" decoding="async" className="cat-protect h-full w-full object-cover" {...guard} />
                        <span className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between bg-accent px-4 py-3 text-white transition-transform duration-500 ease-expo group-hover:translate-y-0 group-focus-visible:translate-y-0">
                          <span className="mono-caps">Preview pages</span>
                          <ArrowUpRight size={16} aria-hidden="true" />
                        </span>
                      </span>
                    </div>
                    <div className="mt-6 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-[22px] font-medium leading-tight text-ink transition-colors group-hover:text-accent">{c.title}</h3>
                        <p className="mt-2 text-[14.5px] leading-[1.6] text-muted">{c.summary}</p>
                      </div>
                      <span className="mono-caps shrink-0 pt-1.5 text-soft">{c.pages} pp</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {c.tags.map((t) => (
                        <span key={t} className="mono-caps rounded-full border border-ink/10 bg-paper px-3 py-1 text-[10.5px] text-muted">
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                </Reveal>
              ))}
              <Reveal as="li" delay={180}>
                <div className="flex h-full flex-col justify-between rounded-md bg-ink p-7 text-white">
                  <div>
                    <p className="eyebrow eyebrow-light">Need another range?</p>
                    <h3 className="mt-4 font-display text-[24px] font-medium leading-tight">We source far more than what is shown here.</h3>
                    <p className="mt-3 text-[14.5px] leading-[1.65] text-white/60">Tell us the product and we will put together options, specifications and prices from our suppliers.</p>
                  </div>
                  <div className="mt-8">
                    <RequestOptions
                      text="Hello AGS Trade, I am looking for a product that is not in your catalogues. Here are the details:"
                      subject="Sourcing enquiry"
                      onForm={() => requestEnquiry('General Trading')}
                      tone="dark"
                    />
                  </div>
                </div>
              </Reveal>
            </ul>
          </div>

          {layout && (
            <div
              className={`cat-fold absolute inset-x-0 bottom-0 flex flex-col items-center justify-end gap-3 pb-2 transition-opacity duration-500 ${folded ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
              style={{ top: folded ? Math.max(0, layout.peek - 40) : undefined, height: folded ? undefined : 0 }}
              onClick={folded ? toggle : undefined}
              aria-hidden={!folded}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggle(); }}
                aria-expanded={expanded}
                aria-controls="catalogue-list"
                tabIndex={folded ? 0 : -1}
                className="group relative inline-flex items-center gap-3 rounded-full bg-ink px-7 py-4 text-[15px] font-medium text-white shadow-[0_18px_40px_-18px_rgba(10,22,64,0.6)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                View all {catalogues.length} catalogues
                <ChevronDown size={17} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-y-0.5" />
              </button>
              <p className="mono-caps text-soft">+{extra} more {extra === 1 ? 'range' : 'ranges'} · tap to reveal</p>
            </div>
          )}
        </div>

        {layout && expanded && (
          <div className="mt-12 flex justify-center">
            <button
              type="button"
              onClick={toggle}
              aria-expanded={expanded}
              aria-controls="catalogue-list"
              className="group inline-flex items-center gap-3 rounded-full border border-ink/15 bg-paper px-6 py-3.5 text-[15px] font-medium text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-white"
            >
              Show fewer catalogues
              <ChevronDown size={17} aria-hidden="true" className="rotate-180" />
            </button>
          </div>
        )}
      </div>
      {open && <Viewer c={open} onClose={close} />}
    </section>
  );
}
