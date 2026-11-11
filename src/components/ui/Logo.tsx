import { useId } from 'react';

interface LogoProps {
  /** Height of the AGS letters in px */
  height?: number;
  /** 'inline': GLOBAL TRADE beside the letters. 'stacked': below, centred. 'mark': letters only */
  layout?: 'inline' | 'stacked' | 'mark';
  /** Show "Connecting markets. Delivering value." (stacked layout only) */
  tagline?: boolean;
  /** 'light' for dark backgrounds, 'dark' for light ones */
  tone?: 'light' | 'dark';
  className?: string;
}

const A = '10,160 72,20 102,20 164,160 131,160 87,58 43,160';
const G = 'M309.5 50.1 A62 62 0 1 0 324 90 L268 90';
const S = 'M465.8 50.9 A45 27.5 0 1 0 425 90 A45 27.5 0 1 1 384.2 129.1';
const ROUTE = 'M-8 174 C110 100 320 62 534 66 C330 82 150 124 -8 174 Z';

/** The AGS Global Trade logo, drawn as vector so it stays sharp at any size and on any background. */
export function LogoMark({ height = 40, tone = 'light', className = '' }: { height?: number; tone?: 'light' | 'dark'; className?: string }) {
  const id = useId().replace(/:/g, '');
  const ink = tone === 'light' ? '#F3F5FA' : '#0A1640';
  return (
    <svg viewBox="-10 0 540 186" height={height} width={(height * 540) / 186} className={`block shrink-0 ${className}`} aria-hidden="true">
      <defs>
        {/* Cuts a clean gap around the route where it crosses the letters, whatever the background */}
        <mask id={`cut-${id}`} maskUnits="userSpaceOnUse" x="-10" y="0" width="540" height="186">
          <rect x="-10" y="0" width="540" height="186" fill="#fff" />
          <path d={ROUTE} fill="#000" stroke="#000" strokeWidth="14" strokeLinejoin="round" />
        </mask>
        <linearGradient id={`route-${id}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#23408E" />
          <stop offset="0.55" stopColor="#3E5BB0" />
          <stop offset="1" stopColor="#7F9BEA" />
        </linearGradient>
      </defs>
      <g mask={`url(#cut-${id})`}>
        <polygon points={A} fill={ink} />
        <path d={G} fill="none" stroke={ink} strokeWidth="30" />
        <path d={S} fill="none" stroke={ink} strokeWidth="30" />
      </g>
      <path d={ROUTE} fill={`url(#route-${id})`} />
    </svg>
  );
}

export default function Logo({ height = 40, layout = 'inline', tagline = false, tone = 'light', className = '' }: LogoProps) {
  const text = tone === 'light' ? 'text-white' : 'text-[#0A1640]';
  const sub = tone === 'light' ? 'text-[#B8C4E6]' : 'text-accent';

  if (layout === 'mark') {
    return (
      <span role="img" aria-label="AGS Global Trade" className={`inline-flex ${className}`}>
        <LogoMark height={height} tone={tone} />
      </span>
    );
  }

  if (layout === 'stacked') {
    return (
      <span role="img" aria-label="AGS Global Trade" className={`inline-flex flex-col items-center ${text} ${className}`}>
        <LogoMark height={height} tone={tone} />
        <span className="mt-[0.5em] whitespace-nowrap font-medium" style={{ fontSize: height * 0.24, letterSpacing: '0.42em', paddingLeft: '0.42em' }}>
          GLOBAL TRADE
        </span>
        {tagline && (
          <span className={`mt-[0.9em] flex items-center gap-3 whitespace-nowrap font-mono ${sub}`} style={{ fontSize: Math.max(9, height * 0.085), letterSpacing: '0.22em' }}>
            <span className="h-px w-8 bg-current opacity-60" />
            CONNECTING MARKETS. DELIVERING VALUE.
            <span className="h-px w-8 bg-current opacity-60" />
          </span>
        )}
      </span>
    );
  }

  return (
    <span role="img" aria-label="AGS Global Trade" className={`inline-flex items-center ${text} ${className}`} style={{ gap: height * 0.36 }}>
      <LogoMark height={height} tone={tone} />
      <span className={`w-px self-stretch ${tone === 'light' ? 'bg-white/25' : 'bg-ink/15'}`} style={{ marginBlock: height * 0.08 }} />
      <span className="whitespace-nowrap font-medium leading-[1.45]" style={{ fontSize: Math.max(9, height * 0.27), letterSpacing: '0.32em' }}>
        GLOBAL
        <br />
        TRADE
      </span>
    </span>
  );
}
