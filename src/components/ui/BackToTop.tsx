import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 1.5);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      tabIndex={show ? 0 : -1}
      className={`fixed bottom-5 left-5 z-[35] flex h-12 w-12 items-center justify-center rounded-full bg-white text-navy shadow-[0_14px_34px_-12px_rgba(10,22,64,0.55)] ring-1 ring-navy/10 transition-[opacity,transform] duration-500 ease-expo hover:-translate-y-0.5 sm:bottom-7 sm:left-7 ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={1.8} />
    </button>
  );
}
