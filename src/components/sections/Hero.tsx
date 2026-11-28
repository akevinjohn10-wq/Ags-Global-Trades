import { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import SplitText from '@/components/ui/SplitText';
import { onReady } from '@/lib/ready';

/**
 * Dark hero in the "404 Planet" layout: centred copy above a looping shot of the Earth
 * rising from the bottom of the screen, fading softly into the white page below.
 */
export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [entered, setEntered] = useState(false);
  const [reduce] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => onReady(() => setEntered(true)), []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (reduce) v.pause();
    else v.play().catch(() => {});
  }, [reduce]);

  return (
    <section id="home" aria-label="Introduction" className="relative bg-black text-white">
      <div className="relative isolate flex h-[100svh] min-h-[640px] flex-col overflow-hidden">
        {/* Earth underneath */}
        <video
          ref={videoRef}
          className={`absolute inset-x-0 -bottom-[14svh] -z-10 h-full w-full object-cover object-bottom transition-opacity duration-[1400ms] ${
            entered ? 'opacity-100' : 'opacity-0'
          }`}
          src="/videos/hero-earth.mp4"
          poster="/videos/hero-earth.jpg"
          autoPlay={!reduce}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30svh] bg-gradient-to-b from-black via-black/60 to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-paper/90 via-paper/20 to-transparent" />

        {/* Copy, centred above the horizon */}
        <div className="container-x relative z-10 flex flex-1 flex-col items-center justify-start pt-32 text-center sm:pt-36 lg:pt-[18vh]">
          <div className={`transition-all duration-1000 ease-expo ${entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <p className="eyebrow eyebrow-light justify-center">Sourcing &amp; supply</p>
          </div>
          <SplitText
            as="h1"
            play={entered}
            delay={150}
            stagger={110}
            text={'Sourced. Checked.\nDelivered.'}
            className="sheen mt-5 text-[12vw] font-medium leading-[0.95] sm:text-[9vw] lg:text-[6.4vw] 2xl:text-[104px] [&_.block:last-child]:text-sky"
          />
          <div
            className={`mx-auto mt-6 max-w-xl transition-all delay-700 duration-1000 ease-expo ${
              entered ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <p className="text-[16px] leading-[1.65] text-white/75 sm:text-[18px]">
              Tell us the product and the quantity. We find verified suppliers, check the goods and ship them to your door.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button href="#contact" variant="light">
                Request a quote
              </Button>
              <Button href="#catalogue" variant="outline-light">
                What we source
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
