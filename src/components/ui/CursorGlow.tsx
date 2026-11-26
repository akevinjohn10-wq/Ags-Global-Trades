import { useEffect, useState } from 'react';
import GlowCursor from './GlowCursor';

/** The React Bits glow trail across the whole page. Mouse and trackpad only; it never blocks clicks. */
export default function CursorGlow() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }, []);
  if (!on) return null;
  return (
    // sized inline (not only through the stylesheet), so it is full-screen even before the CSS has loaded
    <div aria-hidden="true" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9998, pointerEvents: 'none' }}>
      <GlowCursor
        color="#ffffff"
        intensity={0.45}
        trailWidth={3}
        linger={0.5}
        glow={0.6}
        clickBurst
        theme="dark"
        quality="medium"
        maxDevicePixelRatio={1.25}
        style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}
      />
    </div>
  );
}
