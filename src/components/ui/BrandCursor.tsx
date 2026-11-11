import { useEffect, useRef } from 'react';

/**
 * Minimal navigation cursor: a small soft-white arrowhead that sits exactly on the pointer and turns
 * to face the direction of travel, settling back to the usual pointer angle when still. It shrinks a
 * little over links and buttons and on click. Mouse/trackpad only; touch screens and text fields keep
 * the normal cursor.
 */
export default function BrandCursor() {
  const arrowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const arrow = arrowRef.current;
    if (!arrow) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.add('brand-cursor');

    const REST = -45; // at rest the arrow points up and to the left, like a normal pointer
    let tx = -100, ty = -100, px = -100, py = -100;
    let heading = REST, ang = REST, sc = 1, scT = 1;
    let still = 0, shown = false, raf = 0, down = false, hover = false;

    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) { px = tx; py = ty; shown = true; arrow.style.opacity = '1'; }
      const t = e.target instanceof Element ? e.target : null;
      const native = !!t?.closest('input, textarea, select, [contenteditable="true"]');
      hover = !native && !!t?.closest('a, button, [role="button"], label, summary, [data-magnetic]');
      arrow.style.visibility = native ? 'hidden' : 'visible';
      kick();
    };
    const onDown = () => { down = true; kick(); };
    const onUp = () => { down = false; kick(); };
    const onLeave = () => { shown = false; arrow.style.opacity = '0'; };

    let last = performance.now();
    function tick(now: number) {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const vx = tx - px, vy = ty - py;
      px = tx; py = ty;
      if (Math.hypot(vx, vy) > 2 && !reduce) { heading = (Math.atan2(vy, vx) * 180) / Math.PI + 90; still = 0; }
      else still += dt;
      const target = still > 0.35 || reduce ? REST : heading;
      let d = target - ang; d = ((d + 540) % 360) - 180;
      ang += d * Math.min(1, dt * 12);
      scT = down ? 0.8 : hover ? 0.85 : 1;
      sc += (scT - sc) * Math.min(1, dt * 14);
      arrow.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${ang.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      if (Math.abs(d) > 0.2 || Math.abs(sc - scT) > 0.002 || still < 0.4) raf = requestAnimationFrame(tick);
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

  // arrowhead with its tip on the pointer; drawn pointing up, rotated in JS
  return (
    <div ref={arrowRef} aria-hidden="true" className="nav-cursor-arrow" style={{ opacity: 0 }}>
      <svg viewBox="0 0 14 16" width="14" height="16">
        <path d="M7 0.8 L13.2 15 L7 11.4 L0.8 15 Z" fill="currentColor" />
      </svg>
    </div>
  );
}
