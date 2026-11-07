import { useState } from 'react';
import { Clock, Globe, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import '@/lib/translateFix';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import LegalModal from '@/components/layout/LegalModal';
import { contactDetails } from '@/data/siteContent';
import { legalDocuments } from '@/data/legal';
import type { LegalKey } from '@/data/legal';

const PROXY_SUFFIX = '.translate.goog';

const languages = [
  { code: 'en', label: 'English (original)' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'zh-CN', label: '中文' },
];

const legalLinks: { key: LegalKey; label: string }[] = [
  { key: 'disclaimer', label: 'Disclaimer' },
  { key: 'cookies', label: 'Cookies' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'terms', label: 'Terms & Conditions' },
];

function getOriginalHost(host: string) {
  if (!host.endsWith(PROXY_SUFFIX)) return host;
  return host
    .slice(0, -PROXY_SUFFIX.length)
    .replace(/--/g, '\u0000')
    .replace(/-/g, '.')
    .replace(/\u0000/g, '-');
}

function getCurrentLanguage() {
  if (typeof window === 'undefined' || !window.location.hostname.endsWith(PROXY_SUFFIX)) return 'en';
  return new URLSearchParams(window.location.search).get('_x_tr_tl') ?? 'en';
}

function changeLanguage(code: string) {
  const { hostname, pathname } = window.location;
  const original = getOriginalHost(hostname);

  if (code === 'en') {
    window.location.href = `https://${original}${pathname}`;
    return;
  }

  const proxyHost = original.replace(/-/g, '--').replace(/\./g, '-') + PROXY_SUFFIX;
  window.location.href = `https://${proxyHost}${pathname}?_x_tr_sl=en&_x_tr_tl=${code}&_x_tr_hl=${code}&_x_tr_pto=wapp`;
}

export default function Footer() {
  const year = new Date().getFullYear();
  const [openDoc, setOpenDoc] = useState<LegalKey | null>(null);
  const [language, setLanguage] = useState(getCurrentLanguage);

  return (
    <footer className="border-t-[6px] border-accent bg-deep text-ink">
      <div className="container-x grid gap-10 py-14 md:grid-cols-3 lg:py-16">
        <div>
          <Logo height={64} />
          <p className="mt-5 max-w-xs text-[15px] leading-[1.7] text-muted">
            Import-export solutions connecting markets worldwide, from sourcing to final delivery.
          </p>
        </div>

        <div>
          <p className="eyebrow">Contact</p>
          <ul className="mt-5 space-y-3 text-[15px] text-muted">
            <li className="flex gap-3">
              <MapPin size={18} strokeWidth={1.5} className="mt-1 shrink-0 text-accent" aria-hidden="true" />
              <span>
                {contactDetails.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} strokeWidth={1.5} className="shrink-0 text-accent" aria-hidden="true" />
              <a
                href={`tel:${contactDetails.phone.replace(/\s/g, '')}`}
                className="transition-colors duration-200 hover:text-ink"
              >
                {contactDetails.phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} strokeWidth={1.5} className="shrink-0 text-accent" aria-hidden="true" />
              <a href={`mailto:${contactDetails.email}`} className="transition-colors duration-200 hover:text-ink">
                {contactDetails.email}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Linkedin size={18} strokeWidth={1.5} className="shrink-0 text-accent" aria-hidden="true" />
              <a
                href={contactDetails.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-200 hover:text-ink"
              >
                LinkedIn
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="eyebrow">Business Hours</p>
          <p className="mt-5 flex items-center gap-3 text-[15px] text-muted">
            <Clock size={18} strokeWidth={1.5} className="shrink-0 text-accent" aria-hidden="true" />
            {contactDetails.hours}
          </p>
          <div className="mt-8">
            <Button href="#contact" variant="outline">
              Get a Quote
            </Button>
          </div>
        </div>
      </div>

      <nav aria-label="Legal" className="border-t border-line">
        <ul className="container-x flex flex-wrap items-center justify-center gap-y-2 py-6 text-sm text-muted">
          <li>
            <a href="#about" className="px-4 transition-colors duration-200 hover:text-ink">
              About us
            </a>
          </li>
          {legalLinks.map((link) => (
            <li key={link.key} className="border-l border-line">
              <button
                type="button"
                onClick={() => setOpenDoc(link.key)}
                className="px-4 transition-colors duration-200 hover:text-ink"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-4 py-6 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>&copy; {year} AGS Global Trade. All rights reserved.</p>
          <label className="flex items-center gap-2">
            <Globe size={18} strokeWidth={1.5} aria-hidden="true" />
            <span className="sr-only">Translate this page</span>
            <select
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value);
                changeLanguage(event.target.value);
              }}
              className="rounded-[4px] border border-line bg-deep px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            >
              {languages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {openDoc && <LegalModal doc={legalDocuments[openDoc]} onClose={() => setOpenDoc(null)} />}
    </footer>
  );
}
