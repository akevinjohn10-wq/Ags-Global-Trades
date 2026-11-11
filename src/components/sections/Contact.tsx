import { Clock, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import InquiryForm from '@/components/contact/InquiryForm';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { contactDetails } from '@/data/siteContent';

export default function Contact() {
  const details = [
    { label: 'Address', icon: MapPin, lines: contactDetails.address },
    { label: 'Email', icon: Mail, href: `mailto:${contactDetails.email}`, lines: [contactDetails.email] },
    { label: 'Phone', icon: Phone, href: `tel:${contactDetails.phone.replace(/\s/g, '')}`, lines: [contactDetails.phone] },
    { label: 'Business Hours', icon: Clock, lines: [contactDetails.hours] },
    { label: 'LinkedIn', icon: Linkedin, href: contactDetails.linkedin, lines: ['AGS Global Trade'], external: true },
    { label: 'Instagram', icon: Instagram, href: contactDetails.instagram, lines: ['@agstrades.in'], external: true },
  ];

  return (
    <section id="contact" className="section-y scroll-mt-24 bg-mist">
      <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <SectionHeading
            eyebrow="Contact"
            title={'Tell us what\nyou need sourced.'}
            description="Share the product, the quantity and the destination, and a member of our team will come back with a quote."
          />

          <Reveal delay={150}>
            <ul className="mt-12 divide-y divide-ink/10 border-y border-ink/10">
              {details.map((detail) => {
                const Icon = detail.icon;
                const body = (
                  <>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-paper text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                      <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="mono-caps block text-soft">{detail.label}</span>
                      {detail.lines.map((line) => (
                        <span key={line} className="block text-[16px] leading-[1.6] text-ink">
                          {line}
                        </span>
                      ))}
                    </span>
                  </>
                );
                return (
                  <li key={detail.label}>
                    {detail.href ? (
                      <a
                        href={detail.href}
                        target={detail.external ? '_blank' : undefined}
                        rel={detail.external ? 'noopener noreferrer' : undefined}
                        className="group flex items-center gap-5 py-4 transition-transform duration-500 ease-expo hover:translate-x-1"
                      >
                        {body}
                      </a>
                    ) : (
                      <div className="group flex items-center gap-5 py-4">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={150} className="lg:col-span-6 lg:col-start-7">
          <div className="rounded-lg border border-line bg-paper p-6 shadow-[0_40px_90px_-50px_rgba(27,30,36,0.35)] sm:p-10">
            <div className="mb-8 flex items-center justify-between border-b border-line pb-6">
              <p className="font-display text-[22px] font-medium text-ink">Request a quote</p>
              <span className="mono-caps flex items-center gap-2 text-soft">
                <span className="h-2 w-2 animate-blink bg-accent" aria-hidden="true" />
                Reply in 1 business day
              </span>
            </div>
            <InquiryForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
