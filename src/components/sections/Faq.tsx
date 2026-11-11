import { useState } from 'react';
import { Plus } from 'lucide-react';
import Reveal from '@/components/ui/Reveal';
import SplitText from '@/components/ui/SplitText';
import { contactDetails } from '@/data/siteContent';

const FAQS = [
  {
    q: 'What does AGS Trade do?',
    a: 'We are a sourcing and supply company. You tell us the product and the quantity; we find verified suppliers, negotiate the price, check the goods and arrange shipping to you.',
  },
  {
    q: 'What kinds of products can you source?',
    a: 'We work across eleven categories, from consumer goods and industrial machinery to agricultural commodities, metals, construction materials and custom OEM or private-label products. If it is not on the list, ask us.',
  },
  {
    q: 'Is there a minimum order quantity?',
    a: 'It depends on the product and the supplier. Tell us the quantity you need and we will tell you what is possible, including trial orders where suppliers allow them.',
  },
  {
    q: 'How do you ship my order?',
    a: 'We book your goods with established shipping lines, freight agents or courier services, by sea or courier depending on size, budget and urgency, and share tracking with you until delivery.',
  },
  {
    q: 'Do you check quality before shipping?',
    a: 'Yes. We check suppliers before ordering and inspect quantity, packing and finish before goods leave the supplier, so what arrives matches what you ordered.',
  },
  {
    q: 'How do I get a quote?',
    a: 'Send the product, quantity and destination using the form below, or email us. A member of our team replies within one business day.',
  },
];

/** Numbered FAQ accordion. */
export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="section-y scroll-mt-24 bg-paper">
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Reveal>
            <p className="eyebrow">Questions</p>
          </Reveal>
          <SplitText as="h2" text="F.A.Q" className="mt-5 text-[56px] font-medium leading-none text-ink sm:text-[88px]" />
          <Reveal delay={150}>
            <p className="mt-5 max-w-xs text-[16px] lg:text-[18px] leading-[1.7] text-muted">Straight answers, so you can order with confidence.</p>
            <p className="mono-caps mt-8 text-soft">Still have questions?</p>
            <a href={`mailto:${contactDetails.email}`} className="mt-2 inline-block text-[16px] lg:text-[18px] font-medium text-accent underline-offset-4 hover:underline">
              {contactDetails.email}
            </a>
          </Reveal>
        </div>

        <ul className="border-b border-ink/10 lg:col-span-8">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal as="li" key={item.q} delay={i * 60} className="border-t border-ink/10">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="group flex w-full items-center gap-5 py-6 text-left"
                  >
                    <span className={`mono-caps w-7 shrink-0 ${isOpen ? 'text-accent' : 'text-soft'}`}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1 text-[18px] font-medium text-ink transition-transform duration-500 ease-expo group-hover:translate-x-1 sm:text-[20px]">
                      {item.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors duration-300 ${
                        isOpen ? 'border-accent bg-accent text-white' : 'border-ink/15 text-ink group-hover:border-ink'
                      }`}
                    >
                      <Plus size={18} strokeWidth={1.5} className={`transition-transform duration-500 ease-expo ${isOpen ? 'rotate-45' : ''}`} />
                    </span>
                  </button>
                </h3>
                <div id={`faq-${i}`} role="region" className="collapse-grid" data-open={isOpen}>
                  <div>
                    <p className="max-w-2xl pb-7 pl-12 text-[16px] lg:text-[18px] leading-[1.7] text-muted">{item.a}</p>
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
