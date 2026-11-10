import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { navLinks } from '@/data/siteContent';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      {/* Floating dark pill: stays legible over the light hero and the dark sections */}
      <div className="mx-auto max-w-[1100px] rounded-[28px] border border-white/10 bg-canvas/85 shadow-[0_10px_40px_-12px_rgba(5,11,26,0.55)] backdrop-blur-xl">
        <nav aria-label="Primary" className="flex h-[64px] items-center justify-between pl-5 pr-2.5 sm:pl-7">
          <a href="#home" aria-label="AGS Trade home" className="transition-opacity duration-200 hover:opacity-80">
            <Logo height={48} />
          </a>

          <ul className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-sm font-medium text-muted transition-colors duration-200 hover:text-white">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <Button href="#contact" variant="solid" className="h-11 px-6">
                Get a Quote
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-ink transition-colors duration-200 hover:border-accent lg:hidden"
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
                    className="block py-4 text-base font-medium text-ink transition-colors duration-200 hover:text-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="px-5 pb-5 pt-2">
              <Button href="#contact" onClick={closeMenu} className="w-full">
                Get a Quote
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
