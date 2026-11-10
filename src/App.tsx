import { useEffect } from 'react';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import PageTransition from '@/components/layout/PageTransition';
import Preloader from '@/components/layout/Preloader';
import Products from '@/components/sections/Products';
import Contact from '@/components/sections/Contact';
import CtaBand from '@/components/sections/CtaBand';
import Faq from '@/components/sections/Faq';
import GlobalReach from '@/components/sections/GlobalReach';
import Hero from '@/components/sections/Hero';
import Journey from '@/components/sections/Journey';
import ShippingModes from '@/components/sections/ShippingModes';
import Statement from '@/components/sections/Statement';
import Story from '@/components/sections/Story';
import ScrollProgress from '@/components/ui/ScrollProgress';

/** Makes the soft blue spotlight on every .spot card follow the cursor. */
function useSpotlight() {
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const card = target.closest<HTMLElement>('.spot');
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
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-5 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <Preloader />
      <PageTransition />
      <ScrollProgress />
      <Navbar />
      <main id="main">
        <Hero />
        <Statement />
        <Story />
        <Products />
        <Journey />
        <GlobalReach />
        <ShippingModes />
        <Faq />
        <CtaBand />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
