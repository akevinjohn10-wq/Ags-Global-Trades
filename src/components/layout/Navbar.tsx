import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { contactDetails, navLinks } from '@/data/siteContent';

const phoneHref = `tel:${contactDetails.phone.replace(/\s/g, '')}`;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Info strip (desktop): collapses once the page scrolls */}
      <div
        className={`hidden overflow-hidden border-b border-white/10 bg-canvas/40 backdrop-blur-sm transition-all duration-500 md:block ${
          scrolled ? 'max-h-0 border-transparent opacity-0' : 'max-h-10 opacity-100'
        }`}
      >
        <div className="mx-auto flex h-10 max-w-[1800px] items-center justify-between px-6 font-mono text-[11px] uppercase tracking-[0.08em] text-muted lg:px-11">
          <p>Import-export trading · Sourcing · Freight · Customs clearance</p>
          <p className="flex items-center gap-4">
            <a href={`mailto:${contactDetails.email}`} className="transition-colors hover:text-white">
              {contactDetails.email}
            </a>
            <span aria-hidden="true" className="h-3 w-px bg-white/20" />
            <a href={phoneHref} className="transition-colors hover:text-white">
              {contactDetails.phone}
            </a>
          </p>
        </div>
      </div>

      <div
        className={`transition-colors duration-500 ${
          scrolled || isOpen ? 'border-b border-white/10 bg-canvas/80 backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <nav aria-label="Primary" className="mx-auto flex h-[76px] max-w-[1800px] items-center justify-between px-5 sm:px-6 lg:px-11">
          <a href="#home" aria-label="AGS Trade home" className="transition-opacity duration-200 hover:opacity-80">
            <Logo height={58} />
          </a>

          <ul className="hidden items-center gap-9 lg:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="group relative font-mono text-[13px] font-medium uppercase tracking-[0.06em] text-white/85 transition-colors duration-200 hover:text-white"
                >
                  {link.label}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100"
                  />
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <Button href="#contact" variant="solid" className="h-11 px-6">
                Work With Us
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition-colors duration-200 hover:border-accent lg:hidden"
            >
              {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </nav>

        {isOpen && (
          <div id="mobile-menu" className="border-t border-white/10 lg:hidden">
            <ul className="flex flex-col px-5 py-2">
              {navLinks.map((link) => (
                <li key={link.href} className="border-b border-white/10 last:border-b-0">
                  <a
                    href={link.href}
                    onClick={closeMenu}
                    className="block py-4 font-mono text-sm font-medium uppercase tracking-[0.06em] text-white transition-colors duration-200 hover:text-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="px-5 pb-6 pt-2">
              <Button href="#contact" onClick={closeMenu} className="w-full">
                Work With Us
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
