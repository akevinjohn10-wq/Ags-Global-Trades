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
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9998]">
      <GlowCursor
        color="#5f8bff"
        intensity={1.3}
        trailWidth={3}
        linger={1.4}
        glow={1.2}
        clickBurst
        theme="dark"
        blendMode="normal"
        quality="medium"
        maxDevicePixelRatio={1.25}
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
}
