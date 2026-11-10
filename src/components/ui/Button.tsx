import type { ReactNode } from 'react';

type ButtonVariant = 'solid' | 'outline' | 'accent';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

const baseClass =
  'group inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 font-mono text-[13px] font-medium uppercase tracking-[0.06em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60';

const variantClass: Record<ButtonVariant, string> = {
  solid: 'bg-white text-canvas hover:bg-ice hover:shadow-[0_0_44px_-6px_rgba(47,123,255,0.9)]',
  outline: 'border border-white/25 bg-transparent text-white hover:border-white hover:bg-white hover:text-canvas',
  accent: 'bg-accent text-white hover:bg-[#4E8FFF] hover:shadow-[0_0_44px_-6px_rgba(47,123,255,0.95)]',
};

export default function Button({
  children,
  variant = 'solid',
  href,
  type = 'button',
  disabled,
  onClick,
  className = '',
}: ButtonProps) {
  const classes = `${baseClass} ${variantClass[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
