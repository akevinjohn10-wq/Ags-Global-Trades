const LOGO_SRC = '/images/WhatsApp_Image_2026-11-05_at_7.18.56_PM.jpeg';

// Artwork is 1280x533 with the wordmark in the lower-left; these bounds frame only the wordmark.
const SOURCE = { width: 1280, height: 533, left: 26, top: 282, logoWidth: 294, logoHeight: 130 };

interface LogoProps {
  height?: number;
  className?: string;
}

export default function Logo({ height = 56, className = '' }: LogoProps) {
  const scale = height / SOURCE.logoHeight;

  return (
    <span
      role="img"
      aria-label="AGS Trade logo"
      className={`relative block shrink-0 overflow-hidden ${className}`}
      style={{ width: SOURCE.logoWidth * scale, height }}
    >
      <img
        src={LOGO_SRC}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute max-w-none"
        style={{
          width: SOURCE.width * scale,
          height: SOURCE.height * scale,
          left: -SOURCE.left * scale,
          top: -SOURCE.top * scale,
        }}
      />
    </span>
  );
}
