import { useEffect, useRef } from 'react';

/**
 * Minimal navigation cursor: a small arrowhead that sits exactly on the pointer and turns to face
 * the direction of travel, with a thin ring that trails behind it. Over links and buttons the ring
 * opens up and the arrow shrinks; on click the ring tightens. Mouse/trackpad only; touch screens
 * and text fields keep the normal cursor.
 */
export default function BrandCursor() {
  const arrowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const arrow = arrowRef.current;
    const ring = ringRef.current;
    if (!arrow || !ring) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.add('brand-cursor');

    const REST = -45; // at rest the arrow points up and to the left, like a normal pointer
    let tx = -100, ty = -100, rx = -100, ry = -100, px = -100, py = -100;
    let heading = REST, ang = REST, size = 1, sizeT = 1, aScale = 1, aScaleT = 1;
    let still = 0, shown = false, raf = 0, down = false, hover = false;

    const show = (on: boolean) => {
      arrow.style.opacity = ring.style.opacity = on ? '1' : '0';
    };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) { rx = px = tx; ry = py = ty; shown = true; show(true); }
      const t = e.target instanceof Element ? e.target : null;
      const native = !!t?.closest('input, textarea, select, [contenteditable="true"]');
      hover = !native && !!t?.closest('a, button, [role="button"], label, summary, [data-magnetic]');
      arrow.style.visibility = ring.style.visibility = native ? 'hidden' : 'visible';
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onDown = () => { down = true; kick(); };
    const onUp = () => { down = false; kick(); };
    const onLeave = () => { shown = false; show(false); };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

    let last = performance.now();
    function tick(now: number) {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // heading follows the direction of travel; after a short pause it settles back to rest
      const vx = tx - px, vy = ty - py;
      px = tx; py = ty;
      const speed = Math.hypot(vx, vy);
      if (speed > 2 && !reduce) { heading = (Math.atan2(vy, vx) * 180) / Math.PI + 90; still = 0; }
      else still += dt;
      const target = still > 0.35 || reduce ? REST : heading;
      let d = target - ang; d = ((d + 540) % 360) - 180;
      ang += d * Math.min(1, dt * 12);

      // the ring trails behind the pointer
      const k = reduce ? 1 : 1 - Math.pow(0.0008, dt);
      rx += (tx - rx) * k;
      ry += (ty - ry) * k;

      sizeT = down ? 0.7 : hover ? 1.75 : 1;
      size += (sizeT - size) * Math.min(1, dt * 14);
      aScaleT = hover ? 0.6 : 1;
      aScale += (aScaleT - aScale) * Math.min(1, dt * 14);

      arrow.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${ang.toFixed(2)}deg) scale(${aScale.toFixed(3)})`;
      ring.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0) scale(${size.toFixed(3)})`;
      ring.dataset.hover = hover ? '1' : '0';

      const moving = Math.abs(tx - rx) > 0.1 || Math.abs(ty - ry) > 0.1 || Math.abs(d) > 0.2 || Math.abs(size - sizeT) > 0.002 || Math.abs(aScale - aScaleT) > 0.002 || still < 0.4;
      if (moving) raf = requestAnimationFrame(tick);
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

  return (
    <>
      <div ref={ringRef} aria-hidden="true" className="nav-cursor-ring" style={{ opacity: 0 }} />
      {/* arrowhead with its tip on the pointer; drawn pointing up, rotated in JS */}
      <div ref={arrowRef} aria-hidden="true" className="nav-cursor-arrow" style={{ opacity: 0 }}>
        <svg viewBox="0 0 14 16" width="14" height="16">
          <path d="M7 0.8 L13.2 15 L7 11.4 L0.8 15 Z" fill="currentColor" />
        </svg>
      </div>
    </>
  );
}
