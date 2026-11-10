import { useEffect, useRef } from 'react';

interface DotWordmarkProps {
  text: string;
  className?: string;
}

/**
 * Oversized wordmark built from dots. The dots scatter away from the cursor and drift back.
 */
export default function DotWordmark({ text, className = '' }: DotWordmarkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let pts = new Float32Array(0); // homeX, homeY, x, y, vx, vy
    let w = 0;
    let h = 0;
    let gap = 6;
    let raf = 0;
    let visible = false;
    const mouse = { x: -9999, y: -9999 };

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gap = Math.max(4, Math.round(w / 260));
      const off = document.createElement('canvas');
      off.width = Math.round(w);
      off.height = Math.round(h);
      const o = off.getContext('2d')!;
      o.fillStyle = '#fff';
      o.textBaseline = 'middle';
      let size = h * 0.95;
      o.font = `600 ${size}px Tomorrow, Inter, sans-serif`;
      const tw = o.measureText(text).width;
      if (tw > w) {
        size *= w / tw;
        o.font = `600 ${size}px Tomorrow, Inter, sans-serif`;
      }
      const realW = o.measureText(text).width;
      o.fillText(text, (w - realW) / 2, h / 2);
      const data = o.getImageData(0, 0, off.width, off.height).data;
      const list: number[] = [];
      for (let y = 0; y < off.height; y += gap) {
        for (let x = 0; x < off.width; x += gap) {
          if (data[(y * off.width + x) * 4 + 3] > 128) list.push(x, y, x, y, 0, 0);
        }
      }
      pts = new Float32Array(list);
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      const r = gap * 0.32;
      ctx.beginPath();
      for (let i = 0; i < pts.length; i += 6) {
        ctx.moveTo(pts[i + 2] + r, pts[i + 3]);
        ctx.arc(pts[i + 2], pts[i + 3], r, 0, Math.PI * 2);
      }
      ctx.fill();
    };

    const step = () => {
      raf = 0;
      let moving = false;
      const radius = Math.max(60, w * 0.06);
      for (let i = 0; i < pts.length; i += 6) {
        const dx = pts[i + 2] - mouse.x;
        const dy = pts[i + 3] - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < radius && d > 0.01) {
          const f = (1 - d / radius) * 3.2;
          pts[i + 4] += (dx / d) * f;
          pts[i + 5] += (dy / d) * f;
        }
        pts[i + 4] += (pts[i] - pts[i + 2]) * 0.06;
        pts[i + 5] += (pts[i + 1] - pts[i + 3]) * 0.06;
        pts[i + 4] *= 0.82;
        pts[i + 5] *= 0.82;
        pts[i + 2] += pts[i + 4];
        pts[i + 3] += pts[i + 5];
        if (Math.abs(pts[i + 4]) + Math.abs(pts[i + 5]) > 0.02 || Math.abs(pts[i] - pts[i + 2]) > 0.3) moving = true;
      }
      draw();
      if (moving && visible) raf = requestAnimationFrame(step);
    };
    const kick = () => {
      if (!raf && visible && !reduce) raf = requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      kick();
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
      kick();
    };

    const init = () => {
      build();
      draw();
    };
    // Wait for the display font so the dots trace the right letter shapes
    if (document.fonts?.ready) document.fonts.ready.then(init);
    else init();

    const ro = new ResizeObserver(init);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [text]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`block w-full ${className}`} />;
}
