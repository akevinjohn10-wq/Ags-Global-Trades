import { useEffect, useRef } from 'react';
import { createGlobe, type GlobeHandle, type GlobeHub } from '@/lib/globeEngine';

interface GlobeProps {
  home: GlobeHub;
  hubs: GlobeHub[];
  onSelect?: (hub: GlobeHub | null) => void;
  interactive?: boolean;
  reduce?: boolean;
  centerX?: number;
  controlsRef?: React.MutableRefObject<GlobeHandle | null>;
  label?: string;
  className?: string;
}

/** Night-Earth WebGL globe. Pauses itself when off screen; renders nothing if WebGL2 is unavailable. */
export default function Globe({ home, hubs, onSelect, interactive = true, reduce = false, centerX, controlsRef, label, className = '' }: GlobeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let handle: GlobeHandle | null = null;
    try {
      handle = createGlobe(el, { home, hubs, interactive, reduce, centerX, onSelect: (h) => selectRef.current?.(h) });
    } catch {
      handle = null;
    }
    if (controlsRef) controlsRef.current = handle;
    const io = new IntersectionObserver(([e]) => handle?.setRunning(e.isIntersecting), { rootMargin: '100px' });
    io.observe(el);
    const onVis = () => handle?.setRunning(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      handle?.destroy();
      if (controlsRef) controlsRef.current = null;
    };
    // the globe is built once; hub data is static
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} role="img" aria-label={label} className={`relative h-full w-full ${className}`} />;
}
