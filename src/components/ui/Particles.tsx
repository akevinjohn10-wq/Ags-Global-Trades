/** Small glowing specks that drift upwards, like dust in a light beam. */
export default function Particles({ count = 28 }: { count?: number }) {
  // Deterministic pseudo-random so the layout is stable between renders
  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const dots = Array.from({ length: count }, (_, i) => {
    const size = 1.5 + rand() * 2.5;
    return (
      <span
        key={i}
        style={{
          left: `${rand() * 100}%`,
          width: size,
          height: size,
          animationDuration: `${14 + rand() * 18}s`,
          animationDelay: `${-rand() * 30}s`,
          ['--dx' as string]: `${(rand() - 0.5) * 160}px`,
        }}
      />
    );
  });
  return (
    <div aria-hidden="true" className="particles">
      {dots}
    </div>
  );
}
