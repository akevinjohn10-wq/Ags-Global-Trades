import { useEffect, useRef } from 'react';

/**
 * Mouse pointer drawn as the AGS "A" with its route swoosh.
 * Follows the mouse with a little lag, leans into the direction of travel, grows over links and
 * buttons, and dips on click. Mouse/trackpad only; touch screens and text fields keep the normal cursor.
 */
export default function BrandCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.add('brand-cursor');

    let tx = -100, ty = -100, x = -100, y = -100, rot = 0, sc = 1, scT = 1;
    let shown = false, raf = 0, down = false, hover = false, native = false;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) { x = tx; y = ty; shown = true; el.style.opacity = '1'; }
      const t = e.target instanceof Element ? e.target : null;
      // keep the normal text cursor in form fields
      native = !!t?.closest('input, textarea, select, [contenteditable="true"]');
      hover = !native && !!t?.closest('a, button, [role="button"], label, summary, [data-magnetic], canvas');
      el.style.visibility = native ? 'hidden' : 'visible';
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onDown = () => { down = true; if (!raf) raf = requestAnimationFrame(tick); };
    const onUp = () => { down = false; if (!raf) raf = requestAnimationFrame(tick); };
    const onLeave = () => { el.style.opacity = '0'; shown = false; };

    function tick() {
      raf = 0;
      const k = reduce ? 1 : 0.28;
      const vx = tx - x;
      x += vx * k;
      y += (ty - y) * k;
      // lean into the movement, settle back upright when still
      const target = reduce ? 0 : Math.max(-22, Math.min(22, vx * 0.9));
      rot += (target - rot) * 0.18;
      scT = down ? 0.82 : hover ? 1.35 : 1;
      sc += (scT - sc) * 0.2;
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      el.dataset.hover = hover ? '1' : '0';
      if (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1 || Math.abs(rot - target) > 0.05 || Math.abs(sc - scT) > 0.002) raf = requestAnimationFrame(tick);
    }

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointerup', onUp);
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.documentElement.classList.remove('brand-cursor');
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Hotspot is the apex of the A (100,58 in the icon's coordinates)
  return (
    <div ref={ref} aria-hidden="true" className="brand-cursor-el" style={{ opacity: 0 }}>
      <svg viewBox="16 50 172 116" width="40" height="27" style={{ marginLeft: -19.5, marginTop: -1.9 }}>
        <defs>
          <linearGradient id="bc-route" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#23408E" />
            <stop offset="0.55" stopColor="#3E5BB0" />
            <stop offset="1" stopColor="#7F9BEA" />
          </linearGradient>
          <linearGradient id="bc-shine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="bc-clip">
            <path d="M22 160 C70 116 120 92 182 84 C126 100 78 126 22 160 Z" />
          </clipPath>
        </defs>
        {/* white outline keeps it readable on navy and on white */}
        <polygon points="52,152 90,58 110,58 148,152 126,152 100,86 74,152" fill="#0A1640" stroke="#FFFFFF" strokeWidth="9" strokeLinejoin="round" paintOrder="stroke" />
        <path d="M22 160 C70 116 120 92 182 84 C126 100 78 126 22 160 Z" fill="url(#bc-route)" stroke="#FFFFFF" strokeWidth="7" strokeLinejoin="round" paintOrder="stroke" />
        {/* light sweeping along the route */}
        <g clipPath="url(#bc-clip)">
          <rect className="brand-cursor-shine" x="-40" y="70" width="60" height="100" fill="url(#bc-shine)" />
        </g>
      </svg>
    </div>
  );
}
