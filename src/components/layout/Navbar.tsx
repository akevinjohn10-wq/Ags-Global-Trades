import { useEffect, useState } from 'react';
import { Linkedin, Mail, Phone } from 'lucide-react';
import { LogoMark } from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import DotMap from '@/components/ui/DotMap';
import { allHubs } from '@/data/globe';
import { contactDetails, navLinks } from '@/data/siteContent';

/** Header: Apple-style global nav bar, and a full-screen "Menu" overlay. */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Hide on scroll down, show on scroll up. Direction must hold for a few
    // pixels before the header moves, so small scroll jitter (trackpads,
    // smooth scrolling, the scroll-linked globe) can't make it flicker.
    let lastY = window.scrollY;
    let travel = 0;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const dy = y - lastY;
      lastY = y;
      if (y < 80) {
        travel = 0;
        setHidden(false);
        return;
      }
      if (dy === 0) return;
      if (Math.sign(dy) !== Math.sign(travel)) travel = 0;
      travel += dy;
      if (travel > 14) setHidden(true);
      else if (travel < -14) setHidden(false);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
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

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-transform duration-[600ms] ease-expo will-change-transform ${
          hidden && !open ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* Apple's global nav (awesome-design-md/apple, global-nav): a 44px translucent bar, 12px links
            spread evenly across a 1024px row, logo at the left end, two icons at the right end */}
        <div className="bg-[rgba(22,22,23,0.8)] backdrop-blur-[20px] backdrop-saturate-[180%]">
          <nav
            aria-label="Primary"
            className="mx-auto flex h-11 max-w-[1024px] items-center justify-between px-4 text-[12px] leading-none tracking-[-0.01em] text-[#e8e8ed] antialiased sm:px-[22px]"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Inter, system-ui, sans-serif' }}
          >
            <a href="#home" aria-label="AGS Global Trade home" className="flex h-11 shrink-0 items-center opacity-90 transition-opacity hover:opacity-100">
              <LogoMark height={15} />
            </a>
            {navLinks.slice(1).map((link) => (
              <a key={link.href} href={link.href} className="hidden h-11 items-center whitespace-nowrap px-2 opacity-80 transition-opacity hover:opacity-100 md:flex">
                {link.label}
              </a>
            ))}
            <div className="flex items-center gap-1 md:contents">
              <a href={tel} aria-label={`Call ${contactDetails.phone}`} className="flex h-11 w-9 items-center justify-center opacity-80 transition-opacity hover:opacity-100 md:w-auto md:px-2">
                <Phone size={15} strokeWidth={1.4} aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="site-menu"
                aria-label={open ? 'Close menu' : 'Open menu'}
                className="flex h-11 w-9 items-center justify-center opacity-80 transition-opacity hover:opacity-100 md:w-auto md:px-2"
              >
                <span aria-hidden="true" className="relative block h-[9px] w-[15px]">
                  <span className={`absolute left-0 h-[1.2px] w-full bg-current transition-all duration-500 ease-expo ${open ? 'top-1/2 rotate-45' : 'top-0'}`} />
                  <span className={`absolute left-0 h-[1.2px] w-full bg-current transition-all duration-500 ease-expo ${open ? 'top-1/2 -rotate-45' : 'bottom-0'}`} />
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
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] opacity-70 [mask-image:linear-gradient(to_bottom,transparent,#000_30%)]">
          {open && <DotMap theme="night" hubs={allHubs} labels="none" density={8} label="World map with live routes from New Delhi" />}
        </div>
        <div className="container-x relative grid min-h-full gap-12 pb-12 pt-40 lg:grid-cols-12 lg:items-center lg:pt-28">
          <ul className="lg:col-span-6">
            {navLinks.map((link, i) => (
              <li key={link.href} className="overflow-hidden border-b border-white/10">
                <a
                  href={link.href}
                  tabIndex={open ? 0 : -1}
                  onClick={() => setOpen(false)}
                  className="group flex items-baseline gap-5 py-3 sm:gap-8 sm:py-4 lg:gap-6 lg:py-3"
                  style={{
                    transform: open ? 'none' : 'translateY(100%)',
                    transition: `transform 0.9s cubic-bezier(0.16,1,0.3,1) ${open ? 200 + i * 60 : 0}ms`,
                  }}
                >
                  <span className="font-mono text-[13px] lg:text-[14px] text-white/40 transition-colors group-hover:text-accent2">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-display text-[34px] font-normal leading-none lg:font-light transition-transform duration-500 ease-expo group-hover:translate-x-3 sm:text-[56px] lg:text-[34px] xl:text-[38px]">
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
