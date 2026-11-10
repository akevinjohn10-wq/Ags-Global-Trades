import { useState } from 'react';
import { Globe, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import '@/lib/translateFix';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import DotMap from '@/components/ui/DotMap';
import DotWordmark from '@/components/ui/DotWordmark';
import LegalModal from '@/components/layout/LegalModal';
import { contactDetails, navLinks, productCategories, services } from '@/data/siteContent';
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
  const linkClass = 'text-white/60 transition-colors duration-200 hover:text-white';

  return (
    <footer className="aurora grain relative isolate overflow-hidden bg-ink text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-40">
        <DotMap theme="dark" labels="none" animated={false} intro={false} fit="cover" density={8} />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[200px] -z-10 h-[320px] bg-gradient-to-b from-transparent to-ink" />

      {/* Top call to action */}
      <div className="container-x flex flex-col gap-8 border-b border-white/10 py-16 sm:py-20 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow eyebrow-light">Work with us</p>
          <p className="mt-5 max-w-2xl font-display text-[30px] font-medium leading-[1.05] sm:text-[44px]">
            One partner. Any product. Any quantity.
          </p>
        </div>
        <Button href="#contact" variant="light" className="self-start lg:self-auto">
          Request a quote
        </Button>
      </div>

      <div className="container-x grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:py-16">
        <div className="lg:col-span-3">
          <Logo height={72} />
          <p className="mt-5 max-w-xs text-[15px] leading-[1.7] text-white/60">
            A sourcing and supply company: we find, check, buy and ship the products your business needs.
          </p>
          <a
            href={contactDetails.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="AGS Trade on LinkedIn"
            className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 text-white/70 transition-colors hover:border-white hover:bg-white hover:text-ink"
          >
            <Linkedin size={18} strokeWidth={1.5} aria-hidden="true" />
          </a>
        </div>

        <nav aria-label="Footer" className="lg:col-span-2">
          <p className="mono-caps text-white/40">Explore</p>
          <ul className="mt-5 space-y-3 text-[15px]">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={linkClass}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <p className="mono-caps text-white/40">Services</p>
          <ul className="mt-5 space-y-3 text-[15px]">
            {services.map((item) => (
              <li key={item.title}>
                <a href="#services" className={linkClass}>
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-4">
          <p className="mono-caps text-white/40">Head office</p>
          <ul className="mt-5 space-y-3 text-[15px] text-white/70">
            <li className="flex gap-3">
              <MapPin size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-sky" aria-hidden="true" />
              <span>{contactDetails.address.join(', ')}</span>
            </li>
            <li>
              <a href={`tel:${contactDetails.phone.replace(/\s/g, '')}`} className={`flex items-center gap-3 ${linkClass}`}>
                <Phone size={18} strokeWidth={1.5} className="shrink-0 text-sky" aria-hidden="true" />
                {contactDetails.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${contactDetails.email}`} className={`flex items-center gap-3 ${linkClass}`}>
                <Mail size={18} strokeWidth={1.5} className="shrink-0 text-sky" aria-hidden="true" />
                {contactDetails.email}
              </a>
            </li>
          </ul>
          <p className="mono-caps mt-6 text-white/40">Hours · {contactDetails.hours}</p>
          <p className="mt-6 text-[13px] leading-[1.7] text-white/40">{productCategories.length} product categories · {services.length} services</p>
        </div>
      </div>

      {/* Oversized wordmark made of dots that scatter around the cursor */}
      <div className="container-x">
        <DotWordmark text="AGS GLOBAL TRADE" className="h-[16vw] max-h-[220px]" />
      </div>

      {/* Category ticker */}
      <div className="marquee-pause overflow-hidden border-t border-white/10 py-4">
        <ul className="flex w-max animate-marquee items-center whitespace-nowrap">
          {[...productCategories, ...productCategories].map((c, i) => (
            <li key={`${c.name}-${i}`} aria-hidden={i >= productCategories.length} className="flex items-center gap-6 pr-6 font-display text-[18px] text-white/30">
              <span className="h-1.5 w-1.5 bg-accent2" aria-hidden="true" />
              {c.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-5 py-6 text-[13px] text-white/50 lg:flex-row lg:items-center lg:justify-between">
          <p>&copy; {year} AGS Global Trade. All rights reserved.</p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <li>
                <a href="#about" className="transition-colors hover:text-white">
                  About us
                </a>
              </li>
              {legalLinks.map((link) => (
                <li key={link.key}>
                  <button type="button" onClick={() => setOpenDoc(link.key)} className="transition-colors hover:text-white">
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <label className="flex items-center gap-2">
            <Globe size={16} strokeWidth={1.5} aria-hidden="true" />
            <span className="sr-only">Translate this page</span>
            <select
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value);
                changeLanguage(event.target.value);
              }}
              className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[13px] text-white focus:border-accent2 focus:outline-none"
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
