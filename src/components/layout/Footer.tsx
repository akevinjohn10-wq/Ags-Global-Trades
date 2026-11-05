import { Linkedin } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import { contactDetails, navLinks } from '@/data/siteContent';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-deep text-ink">
      <div className="container-x grid gap-12 py-20 md:grid-cols-12 lg:py-24">
        <div className="md:col-span-5">
          <Logo height={64} />
          <p className="mt-6 max-w-sm text-[16px] leading-[1.7] text-muted">
            Import-export solutions connecting markets worldwide, from sourcing to final delivery.
          </p>
        </div>

        <nav aria-label="Footer" className="md:col-span-3">
          <p className="eyebrow">Quick Links</p>
          <ul className="mt-6 space-y-3">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-[16px] text-muted transition-colors duration-200 hover:text-ink">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-4">
          <p className="eyebrow">Contact</p>
          <ul className="mt-6 space-y-3 text-[16px] text-muted">
            <li>
              <a href={`mailto:${contactDetails.email}`} className="transition-colors duration-200 hover:text-ink">
                {contactDetails.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${contactDetails.phone.replace(/\s/g, '')}`}
                className="transition-colors duration-200 hover:text-ink"
              >
                {contactDetails.phone}
              </a>
            </li>
            <li>{contactDetails.address[2]}</li>
            <li>
              <a
                href={contactDetails.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors duration-200 hover:text-ink"
              >
                <Linkedin size={18} strokeWidth={1.5} aria-hidden="true" />
                LinkedIn
              </a>
            </li>
          </ul>
          <div className="mt-8">
            <Button href="#contact" variant="outline">
              Get a Quote
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-3 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>&copy; {year} AGS Trade. All rights reserved.</p>
          <p>Connecting markets. Delivering value.</p>
        </div>
      </div>
    </footer>
  );
}
