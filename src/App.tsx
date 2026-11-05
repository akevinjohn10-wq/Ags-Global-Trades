import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import About from '@/components/sections/About';
import Contact from '@/components/sections/Contact';
import Hero from '@/components/sections/Hero';
import Process from '@/components/sections/Process';
import Products from '@/components/sections/Products';
import Services from '@/components/sections/Services';
import StatsBar from '@/components/sections/StatsBar';
import WhyChooseUs from '@/components/sections/WhyChooseUs';

export default function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[4px] focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-canvas"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <StatsBar />
        <About />
        <Services />
        <Products />
        <Process />
        <WhyChooseUs />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
