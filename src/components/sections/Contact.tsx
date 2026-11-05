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
    <section id="contact" className="section-y scroll-mt-[72px] bg-surface">
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
          <div className="rounded-[4px] border border-line bg-canvas p-8 sm:p-10">
            <InquiryForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
