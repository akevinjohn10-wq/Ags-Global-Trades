import type { ReactElement } from 'react';

// Original side-view and top-down illustrations used in the scroll story.
// Palette: ink #1B1E24, accent #0229D5, mist #ECF0F8, sky #AEBDF3, signal #F73636.

const INK = '#1B1E24';
const BLUE = '#0229D5';
const MIST = '#ECF0F8';
const SKY = '#AEBDF3';

export function Crate({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
      <rect x="2" y="2" width="116" height="86" rx="3" fill={MIST} stroke={INK} strokeWidth="3" />
      <rect x="2" y="38" width="116" height="12" fill={BLUE} />
      <rect x="52" y="2" width="14" height="86" fill={BLUE} opacity="0.85" />
      <rect x="10" y="10" width="22" height="16" fill="none" stroke={INK} strokeWidth="2" />
      <line x1="13" y1="15" x2="29" y2="15" stroke={INK} strokeWidth="2" />
      <line x1="13" y1="20" x2="25" y2="20" stroke={INK} strokeWidth="2" />
      <rect x="88" y="62" width="20" height="20" fill={INK} />
      <rect x="94" y="68" width="8" height="8" fill={BLUE} />
    </svg>
  );
}

/** Forklift facing right. `lift` (0–1) raises the carriage; children render on the forks. */
export function Forklift({ lift = 0, crate = true, className = '' }: { lift?: number; crate?: boolean; className?: string }) {
  const y = -lift * 70;
  return (
    <svg viewBox="0 0 300 230" className={className} aria-hidden="true" overflow="visible">
      {/* mast */}
      <rect x="196" y="20" width="10" height="180" fill={INK} />
      <rect x="210" y="20" width="10" height="180" fill={INK} />
      {/* carriage + forks + crate */}
      <g data-carriage transform={`translate(0 ${y})`}>
        <rect x="218" y="138" width="10" height="56" fill={INK} />
        <rect x="218" y="186" width="80" height="8" fill={INK} />
        {crate && (
          <g data-crate transform="translate(222 98)">
            <rect x="0" y="0" width="76" height="88" rx="2" fill={MIST} stroke={INK} strokeWidth="3" />
            <rect x="0" y="38" width="76" height="10" fill={BLUE} />
            <rect x="32" y="0" width="12" height="88" fill={BLUE} opacity="0.85" />
            <rect x="52" y="64" width="16" height="16" fill={INK} />
          </g>
        )}
      </g>
      {/* overhead guard */}
      <path d="M70 120 L92 40 L176 40 L190 120" fill="none" stroke={INK} strokeWidth="7" strokeLinejoin="round" />
      <line x1="92" y1="40" x2="180" y2="40" stroke={INK} strokeWidth="9" strokeLinecap="round" />
      {/* seat + wheel */}
      <rect x="104" y="96" width="34" height="24" rx="4" fill={INK} />
      <path d="M150 104 l14 -18" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      {/* body */}
      <path d="M22 196 L22 140 Q22 120 42 120 L196 120 L196 196 Z" fill={BLUE} />
      <rect x="22" y="132" width="40" height="64" fill={INK} />
      <rect x="150" y="132" width="34" height="10" fill="rgba(255,255,255,0.35)" />
      {/* wheels */}
      <circle cx="62" cy="198" r="24" fill={INK} />
      <circle cx="62" cy="198" r="9" fill="#9FA6B4" />
      <circle cx="166" cy="194" r="30" fill={INK} />
      <circle cx="166" cy="194" r="11" fill="#9FA6B4" />
      <rect x="10" y="150" width="8" height="10" fill="#F73636" />
    </svg>
  );
}

/** Box truck facing right, side view. */
export function TruckSide({ className = '' }: { className?: string }) {
  const ribs = Array.from({ length: 15 }, (_, i) => 28 + i * 22);
  return (
    <svg viewBox="0 0 540 230" className={className} aria-hidden="true">
      <rect x="14" y="18" width="360" height="156" rx="4" fill="#F4F6FB" stroke={INK} strokeWidth="3" />
      <g stroke="#D3DAEA" strokeWidth="3">
        {ribs.map((x) => (
          <line key={x} x1={x} y1="26" x2={x} y2="166" />
        ))}
      </g>
      <rect x="14" y="120" width="360" height="16" fill={BLUE} />
      <rect x="28" y="40" width="18" height="18" fill={BLUE} />
      <text x="56" y="55" fontFamily="Geist Mono, monospace" fontSize="15" fontWeight="600" fill={INK} letterSpacing="2">
        AGS GLOBAL TRADE
      </text>
      {/* chassis */}
      <rect x="10" y="174" width="500" height="14" fill={INK} />
      {/* cab */}
      <path d="M384 64 L470 64 Q484 64 492 78 L520 130 L520 186 L384 186 Z" fill={INK} />
      <path d="M398 78 L462 78 Q470 78 476 88 L500 130 L398 130 Z" fill={SKY} />
      <rect x="506" y="150" width="14" height="12" fill="#F73636" />
      <rect x="384" y="146" width="136" height="6" fill={BLUE} />
      {/* wheels */}
      {[86, 150, 444].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="194" r="26" fill={INK} />
          <circle cx={cx} cy="194" r="10" fill="#9FA6B4" />
        </g>
      ))}
    </svg>
  );
}

/** Truck seen from above, driving down the screen. */
export function TruckTop({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 380" className={className} aria-hidden="true">
      <rect x="12" y="10" width="96" height="276" rx="4" fill="#F4F6FB" stroke={INK} strokeWidth="3" />
      <g stroke="#D3DAEA" strokeWidth="3">
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1="20" y1={30 + i * 22} x2="100" y2={30 + i * 22} />
        ))}
      </g>
      <rect x="52" y="10" width="16" height="276" fill={BLUE} opacity="0.9" />
      <rect x="18" y="294" width="84" height="76" rx="10" fill={INK} />
      <rect x="28" y="340" width="64" height="22" rx="4" fill={SKY} />
      <rect x="6" y="300" width="8" height="18" rx="2" fill={INK} />
      <rect x="106" y="300" width="8" height="18" rx="2" fill={INK} />
    </svg>
  );
}

/** Container ship seen from above, heading up the screen. */
export function ShipTop({ className = '' }: { className?: string }) {
  const colors = [BLUE, '#F4F6FB', SKY, INK, '#2546E0', '#6F86EA', '#F73636', '#DCE1EB'];
  const rows: ReactElement[] = [];
  for (let r = 0; r < 18; r++) {
    for (let c = 0; c < 4; c++) {
      const col = colors[(r * 7 + c * 3 + (r % 3)) % colors.length];
      rows.push(<rect key={`${r}-${c}`} x={22 + c * 39} y={150 + r * 34} width="36" height="31" rx="1.5" fill={col} />);
    }
  }
  return (
    <svg viewBox="0 0 200 900" className={className} aria-hidden="true">
      <path d="M100 6 Q190 90 190 220 L190 840 Q190 890 150 890 L50 890 Q10 890 10 840 L10 220 Q10 90 100 6 Z" fill={INK} />
      <path d="M100 26 Q176 100 176 220 L176 830 L24 830 L24 220 Q24 100 100 26 Z" fill="#2E333D" />
      {rows}
      <rect x="40" y="776" width="120" height="62" rx="4" fill="#F4F6FB" />
      <rect x="54" y="788" width="92" height="12" rx="2" fill={SKY} />
      <circle cx="100" cy="96" r="8" fill="#F4F6FB" />
    </svg>
  );
}
