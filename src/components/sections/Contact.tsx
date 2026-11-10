import { Clock, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import InquiryForm from '@/components/contact/InquiryForm';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { contactDetails } from '@/data/siteContent';

const linkClass = 'text-[16px] leading-[1.7] text-ink underline-offset-4 transition-colors duration-200 hover:text-accent hover:underline';

export default function Contact() {
  const details = [
    { label: 'Address', icon: MapPin, lines: contactDetails.address },
    { label: 'Email', icon: Mail, href: `mailto:${contactDetails.email}`, lines: [contactDetails.email] },
    { label: 'Phone', icon: Phone, href: `tel:${contactDetails.phone.replace(/\s/g, '')}`, lines: [contactDetails.phone] },
    { label: 'Business Hours', icon: Clock, lines: [contactDetails.hours] },
    { label: 'LinkedIn', icon: Linkedin, href: contactDetails.linkedin, lines: ['Aditya Dey'] },
  ];

  return (
    <section id="contact" className="section-y relative isolate scroll-mt-24 overflow-hidden bg-deep">
      {/* World map backdrop */}
      <img
        src="/images/world-map.jpg"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-50"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,#030712_0%,rgba(3,7,18,0.55)_25%,rgba(3,7,18,0.7)_75%,#030712_100%)]"
      />
      <div className="container-x grid gap-16 lg:grid-cols-[5fr_7fr] lg:gap-20">
        <Reveal>
          <SectionHeading
            eyebrow="Contact"
            title="Tell us what you need to move."
            description="Share your product and route, and a member of our team will prepare a tailored quote."
          />

          <ul className="mt-12 space-y-8">
            {details.map((detail) => {
              const Icon = detail.icon;
              return (
                <li key={detail.label} className="flex gap-5">
                  <span className="icon-box">
                    <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="eyebrow">{detail.label}</p>
                    {detail.lines.map((line) =>
                      detail.href ? (
                        <p key={line} className="mt-1">
                          <a
                            href={detail.href}
                            target={detail.label === 'LinkedIn' ? '_blank' : undefined}
                            rel={detail.label === 'LinkedIn' ? 'noopener noreferrer' : undefined}
                            className={linkClass}
                          >
                            {line}
                          </a>
                        </p>
                      ) : (
                        <p key={line} className="mt-1 text-[16px] leading-[1.7] text-ink">
                          {line}
                        </p>
                      ),
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal delay={150}>
          <div className="rounded-3xl border border-white/10 bg-canvas/80 p-7 shadow-[0_30px_80px_-30px_rgba(61,139,255,0.35)] backdrop-blur-xl sm:p-10">
            <InquiryForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
