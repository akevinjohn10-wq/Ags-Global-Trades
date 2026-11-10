interface HangingContainerProps {
  tone: 'charcoal' | 'blue';
  className?: string;
  /** Show the swoosh mark on the wall (echoes the AGS logo arc) */
  mark?: boolean;
}

const RIBS = Array.from({ length: 15 }, (_, i) => i);
const LINKS = Array.from({ length: 16 }, (_, i) => i);

const palette = {
  charcoal: { light: '#4A4F58', mid: '#2B2F36', dark: '#14161B', rail: '#0B0C10' },
  blue: { light: '#5FA2FF', mid: '#2F6FE0', dark: '#1B3F9C', rail: '#0F2159' },
};

/**
 * Original vector illustration of a shipping container hanging from a chain.
 * Pure SVG so it stays crisp at any size and adds no image weight.
 */
export default function HangingContainer({ tone, className = '', mark = false }: HangingContainerProps) {
  const c = palette[tone];
  const id = `rib-${tone}`;

  return (
    <svg
      viewBox="0 -340 320 600"
      aria-hidden="true"
      focusable="false"
      className={`block h-auto w-full overflow-visible ${className}`}
    >
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={c.dark} />
          <stop offset="0.35" stopColor={c.light} />
          <stop offset="0.7" stopColor={c.mid} />
          <stop offset="1" stopColor={c.dark} />
        </linearGradient>
        <linearGradient id={`${id}-shade`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="0.25" stopColor="#000" stopOpacity="0" />
          <stop offset="0.8" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      {/* Chain running up out of frame */}
      <g fill="none" stroke="#2A2D34" strokeWidth="4" strokeLinecap="round">
        {LINKS.map((i) => (
          <ellipse key={i} cx="36" cy={-i * 21 - 10} rx={i % 2 === 0 ? 7 : 3} ry="12" />
        ))}
      </g>

      {/* Container body */}
      <rect x="0" y="0" width="320" height="260" rx="5" fill={c.mid} />
      {RIBS.map((i) => (
        <rect key={i} x={6 + i * 20.4} y="14" width="15" height="232" fill={`url(#${id})`} />
      ))}
      <rect x="0" y="0" width="320" height="260" rx="5" fill={`url(#${id}-shade)`} />

      {/* Top & bottom rails */}
      <rect x="0" y="0" width="320" height="14" rx="4" fill={c.rail} />
      <rect x="0" y="246" width="320" height="14" rx="4" fill={c.rail} />

      {/* Corner castings */}
      {[
        [0, 0],
        [298, 0],
        [0, 238],
        [298, 238],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="22" height="22" rx="3" fill={c.rail} stroke="#000" strokeOpacity="0.4" />
      ))}

      {/* Lifting shackle where the chain attaches */}
      <circle cx="36" cy="-2" r="7" fill="none" stroke="#2A2D34" strokeWidth="4" />

      {mark && (
        <g>
          <path
            d="M70 190 C 120 105, 200 80, 262 96"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.92"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M96 205 C 140 138, 205 118, 250 128"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.55"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
