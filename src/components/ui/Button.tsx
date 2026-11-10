import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

type ButtonVariant = 'solid' | 'outline' | 'pill' | 'pill-light';

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
  'group inline-flex h-12 items-center justify-center gap-2 text-sm font-semibold tracking-wide transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60';

const variantClass: Record<ButtonVariant, string> = {
  // Dark sections: light button
  solid: 'rounded-full bg-ink px-7 text-canvas hover:bg-white hover:shadow-[0_0_40px_-8px_rgba(61,139,255,0.8)]',
  outline: 'rounded-full border border-muted/60 bg-transparent px-7 text-ink hover:border-ink hover:bg-ink hover:text-canvas',
  // Light hero: dark pill with a blue arrow bubble
  pill: 'h-14 rounded-full bg-graphite pl-7 pr-2 text-white hover:bg-black',
  'pill-light':
    'h-14 rounded-full border border-graphite/20 bg-transparent px-7 text-graphite hover:border-graphite hover:bg-graphite hover:text-white',
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
  const content = (
    <>
      {children}
      {variant === 'pill' && (
        <span
          aria-hidden="true"
          className="ml-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white transition-transform duration-300 group-hover:rotate-45"
        >
          <ArrowUpRight size={18} />
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={classes}>
      {content}
    </button>
  );
}
