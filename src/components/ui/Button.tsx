import type { ReactNode } from 'react';

type ButtonVariant = 'solid' | 'outline';

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
  'inline-flex h-12 items-center justify-center gap-2 rounded-[4px] px-6 text-sm font-semibold tracking-wide transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60';

const variantClass: Record<ButtonVariant, string> = {
  solid: 'bg-ink text-canvas hover:bg-[#C9D6EA]',
  outline: 'border border-muted bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-canvas',
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
