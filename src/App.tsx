import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import About from '@/components/sections/About';
import Contact from '@/components/sections/Contact';
import CtaBand from '@/components/sections/CtaBand';
import Hero from '@/components/sections/Hero';
import MarqueeBand from '@/components/sections/MarqueeBand';
import Process from '@/components/sections/Process';
import Products from '@/components/sections/Products';
import Services from '@/components/sections/Services';
import TaglineBand from '@/components/sections/TaglineBand';
import WhyChooseUs from '@/components/sections/WhyChooseUs';
import ScrollProgress from '@/components/ui/ScrollProgress';

/** Makes the blue spotlight on every .glow-card follow the cursor. */
function useSpotlight() {
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const card = target.closest<HTMLElement>('.glow-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => document.removeEventListener('pointermove', onMove);
  }, []);
}

export default function App() {
  useSpotlight();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-white focus:px-5 focus:py-2 focus:text-sm focus:text-canvas"
      >
        Skip to content
      </a>
      <ScrollProgress />
      <Navbar />
      <main id="main">
        <Hero />
        <TaglineBand />
        <MarqueeBand />
        <About />
        <Services />
        <Products />
        <Process />
        <WhyChooseUs />
        <CtaBand />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
