const LOGO_SRC = '/images/logo.png';

interface LogoProps {
  height?: number;
  className?: string;
}

export default function Logo({ height = 56, className = '' }: LogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt="AGS Global Trade logo"
      draggable={false}
      style={{ height, width: 'auto' }}
      className={`block shrink-0 ${className}`}
    />
  );
}
