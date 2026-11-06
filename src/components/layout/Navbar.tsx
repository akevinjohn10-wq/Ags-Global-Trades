import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { navLinks } from '@/data/siteContent';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas">
      <nav aria-label="Primary" className="container-x flex h-[72px] items-center justify-between">
        <a href="#home" aria-label="AGS Trade home" className="transition-opacity duration-200 hover:opacity-80">
          <Logo height={60} />
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="text-sm font-medium text-muted transition-colors duration-200 hover:text-ink">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <div className="hidden lg:block">
            <Button href="#contact">Get a Quote</Button>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[4px] border border-line text-ink transition-colors duration-200 hover:border-accent lg:hidden"
          >
            {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {isOpen && (
        <div id="mobile-menu" className="border-t border-line bg-canvas lg:hidden">
          <ul className="container-x flex flex-col py-2">
            {navLinks.map((link) => (
              <li key={link.href} className="border-b border-line last:border-b-0">
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
          <div className="container-x pb-6 pt-2">
            <Button href="#contact" onClick={closeMenu} className="w-full">
              Get a Quote
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
