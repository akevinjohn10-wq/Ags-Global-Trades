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

/** Cursor glow, magnetic buttons and tilting images (mouse users only). */
function usePointerEffects() {
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);
    let magnet: HTMLElement | null = null;
    let tilt: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      glow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      const t = e.target instanceof Element ? e.target : null;
      const m = t?.closest<HTMLElement>('[data-magnetic]') ?? null;
      if (magnet && magnet !== m) magnet.style.transform = '';
      magnet = m;
      if (m) {
        const r = m.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.25;
        m.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      }
      const tl = t?.closest<HTMLElement>('[data-tilt]') ?? null;
      if (tilt && tilt !== tl) tilt.style.transform = '';
      tilt = tl;
      if (tl) {
        const r = tl.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        tl.style.transform = `perspective(900px) rotateY(${(px * 8).toFixed(2)}deg) rotateX(${(-py * 8).toFixed(2)}deg)`;
      }
    };
    const onLeave = () => {
      glow.style.opacity = '0';
    };
    const onEnter = () => {
      glow.style.opacity = '1';
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.documentElement.addEventListener('pointerenter', onEnter);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.documentElement.removeEventListener('pointerenter', onEnter);
      glow.remove();
    };
  }, []);
}

export default function App() {
  useSpotlight();
  usePointerEffects();

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
        <GlobalReach />
        <Faq />
        <CtaBand />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
