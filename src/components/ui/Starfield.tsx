// Deterministic star positions so server/client renders match and there are no layout shifts.
function makeStars(count: number, seed: number, size: number, alpha: number): string {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const layers: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = (rand() * 100).toFixed(2);
    const y = (rand() * 100).toFixed(2);
    const a = (alpha * (0.45 + rand() * 0.55)).toFixed(2);
    layers.push(`radial-gradient(${size}px ${size}px at ${x}% ${y}%, rgba(214,230,255,${a}), transparent)`);
  }
  return layers.join(',');
}

const SMALL = makeStars(90, 7, 1, 0.8);
const MEDIUM = makeStars(34, 21, 1.6, 0.9);
const LARGE = makeStars(9, 53, 2.4, 1);

/** Twinkling star layers for dark hero backgrounds. */
export default function Starfield({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      <div className="absolute inset-0" style={{ backgroundImage: SMALL }} />
      <div className="absolute inset-0 animate-glow" style={{ backgroundImage: MEDIUM }} />
      <div className="absolute inset-0 animate-glow [animation-delay:-2.5s]" style={{ backgroundImage: LARGE }} />
    </div>
  );
}
