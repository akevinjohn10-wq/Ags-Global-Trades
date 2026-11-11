import { useEffect, useState } from 'react';
import { Linkedin, Mail, Phone } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import DotMap from '@/components/ui/DotMap';
import { contactDetails, navLinks, tickerItems } from '@/data/siteContent';

/** Header: mono utility ticker, logo bar, and a full-screen "Menu" overlay (unitedcarriers.com style). */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      // Tuck the header away when scrolling down, bring it back when scrolling up
      setHidden(y > 500 && y > lastY + 2);
      if (y < lastY - 2 || y <= 500) setHidden(false);
      lastY = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const tel = `tel:${contactDetails.phone.replace(/\s/g, '')}`;
  const ticker = [...tickerItems, ...tickerItems];

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-transform duration-500 ease-expo ${
          hidden && !open ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* Utility ticker */}
        <div
          className={`overflow-hidden border-b border-white/10 bg-space text-white/70 transition-[max-height] duration-500 ease-expo ${
            scrolled ? 'max-h-0' : 'max-h-10'
          }`}
        >
          <div className="flex h-9 items-center">
            <div className="marquee-pause relative flex-1 overflow-hidden">
              <ul className="flex w-max animate-marquee-fast items-center whitespace-nowrap font-mono text-[12px] lg:text-[13px] uppercase tracking-eyebrow">
                {ticker.map((item, i) => (
                  <li key={`${item}-${i}`} className="flex items-center gap-6 pr-6">
                    <span className="h-1.5 w-1.5 bg-accent2" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden shrink-0 items-center gap-5 border-l border-white/10 bg-ink px-5 font-mono text-[12px] lg:text-[13px] uppercase tracking-eyebrow md:flex lg:px-12">
              <a href={`mailto:${contactDetails.email}`} className="transition-colors hover:text-white">
                {contactDetails.email}
              </a>
              <span className="text-white/25">|</span>
              <a href={tel} className="transition-colors hover:text-white">
                {contactDetails.phone}
              </a>
            </div>
          </div>
        </div>

        {/* Main bar */}
        <div className={`border-b transition-colors duration-500 ${scrolled ? 'border-white/10 bg-ink/[0.97]' : 'border-transparent bg-transparent'}`}>
          <nav aria-label="Primary" className="mx-auto flex h-[72px] max-w-content items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
            <a href="#home" aria-label="AGS Global Trade home" className="shrink-0">
              <Logo height={40} />
            </a>

            <ul className="hidden items-center gap-6 xl:flex 2xl:gap-8">
              {navLinks.slice(1).map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="group relative whitespace-nowrap py-2 font-mono text-[13px] uppercase tracking-eyebrow text-white/80 2xl:text-[14px] transition-colors hover:text-white">
                    <span className="roll">
                      <span data-text={link.label}>{link.label}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:block">
                <Button href="#contact" variant="accent" className="h-11">
                  Work with us
                </Button>
              </span>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="site-menu"
                className="group flex h-11 items-center gap-3 rounded-md border border-white/20 px-4 font-mono text-[13px] lg:text-[14px] uppercase tracking-eyebrow text-white transition-colors hover:border-white hover:bg-white hover:text-ink"
              >
                <span className="roll">
                  <span data-text={open ? 'Close' : 'Menu'}>{open ? 'Close' : 'Menu'}</span>
                </span>
                <span aria-hidden="true" className="relative block h-3 w-4">
                  <span className={`absolute left-0 h-[1.5px] w-full bg-current transition-all duration-500 ease-expo ${open ? 'top-1/2 rotate-45' : 'top-0.5'}`} />
                  <span className={`absolute left-0 h-[1.5px] w-full bg-current transition-all duration-500 ease-expo ${open ? 'top-1/2 -rotate-45' : 'bottom-0.5'}`} />
                </span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Full-screen menu */}
      <div
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        aria-hidden={!open}
        className={`fixed inset-0 z-40 overflow-y-auto bg-ink text-white transition-[clip-path,visibility] duration-[900ms] ease-expo ${
          open ? 'visible [clip-path:inset(0_0_0_0)]' : 'invisible [clip-path:inset(0_0_100%_0)]'
        }`}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] opacity-50">
          {open && <DotMap theme="dark" labels="none" animated={false} density={8} />}
        </div>
        <div className="container-x relative grid min-h-full gap-12 pb-12 pt-40 lg:grid-cols-12">
          <ul className="lg:col-span-8">
            {navLinks.map((link, i) => (
              <li key={link.href} className="overflow-hidden border-b border-white/10">
                <a
                  href={link.href}
                  tabIndex={open ? 0 : -1}
                  onClick={() => setOpen(false)}
                  className="group flex items-baseline gap-5 py-3 sm:gap-8 sm:py-4"
                  style={{
                    transform: open ? 'none' : 'translateY(100%)',
                    transition: `transform 0.9s cubic-bezier(0.16,1,0.3,1) ${open ? 200 + i * 60 : 0}ms`,
                  }}
                >
                  <span className="font-mono text-[13px] lg:text-[14px] text-white/40 transition-colors group-hover:text-accent2">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-display text-[34px] font-medium leading-none transition-transform duration-500 ease-expo group-hover:translate-x-3 sm:text-[56px] lg:text-[64px]">
                    {link.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <div
            className="flex flex-col justify-end gap-8 lg:col-span-3 lg:col-start-10"
            style={{ opacity: open ? 1 : 0, transition: `opacity 0.8s ease ${open ? 600 : 0}ms` }}
          >
            <div>
              <p className="eyebrow eyebrow-light">Get in touch</p>
              <ul className="mt-5 space-y-3 text-[16px] lg:text-[17px] text-white/80">
                <li>
                  <a tabIndex={open ? 0 : -1} href={`mailto:${contactDetails.email}`} className="flex items-center gap-3 hover:text-white">
                    <Mail size={16} strokeWidth={1.5} aria-hidden="true" /> {contactDetails.email}
                  </a>
                </li>
                <li>
                  <a tabIndex={open ? 0 : -1} href={tel} className="flex items-center gap-3 hover:text-white">
                    <Phone size={16} strokeWidth={1.5} aria-hidden="true" /> {contactDetails.phone}
                  </a>
                </li>
                <li>
                  <a tabIndex={open ? 0 : -1} href={contactDetails.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white">
                    <Linkedin size={16} strokeWidth={1.5} aria-hidden="true" /> LinkedIn
                  </a>
                </li>
              </ul>
            </div>
            <Button href="#contact" variant="light" onClick={() => setOpen(false)} className="self-start">
              Request a quote
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
