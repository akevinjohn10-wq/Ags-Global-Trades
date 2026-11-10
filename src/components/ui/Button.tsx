import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

type ButtonVariant = 'dark' | 'accent' | 'outline' | 'light' | 'outline-light';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  /** Show the square arrow box (on by default) */
  arrow?: boolean;
  /** Plain text label used for the hover roll; defaults to children when it is a string */
  label?: string;
}

const variantClass: Record<ButtonVariant, { root: string; box: string }> = {
  dark: { root: 'bg-ink text-white hover:bg-accent', box: 'bg-white/10' },
  accent: { root: 'bg-accent text-white hover:bg-ink', box: 'bg-white/15' },
  outline: { root: 'border border-ink/15 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-white', box: 'bg-ink/5 group-hover:bg-white/10' },
  light: { root: 'bg-white text-ink hover:bg-mist', box: 'bg-ink/5' },
  'outline-light': { root: 'border border-white/30 text-white hover:bg-white hover:text-ink', box: 'bg-white/10 group-hover:bg-ink/5' },
};

/** bluesqx-style button: label rolls on hover, the arrow slides out and back in. */
export default function Button({
  children,
  variant = 'dark',
  href,
  type = 'button',
  disabled,
  onClick,
  className = '',
  arrow = true,
  label,
}: ButtonProps) {
  const v = variantClass[variant];
  const text = label ?? (typeof children === 'string' ? children : undefined);
  const classes = `group inline-flex h-12 items-center justify-between gap-4 rounded-md pl-5 ${arrow ? 'pr-1.5' : 'pr-5'} text-[15px] font-normal tracking-[-0.01em] transition-[background-color,color,border-color,transform] duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${v.root} ${className}`;

  const content = (
    <>
      {text ? (
        <span className="roll">
          <span data-text={text}>{text}</span>
        </span>
      ) : (
        children
      )}
      {arrow && (
        <span
          aria-hidden="true"
          className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded transition-colors duration-300 ${v.box}`}
        >
          <ArrowUpRight
            size={18}
            strokeWidth={1.75}
            className="transition-transform duration-500 ease-expo group-hover:-translate-y-6 group-hover:translate-x-6"
          />
          <ArrowUpRight
            size={18}
            strokeWidth={1.75}
            className="absolute -translate-x-6 translate-y-6 transition-transform duration-500 ease-expo group-hover:translate-x-0 group-hover:translate-y-0"
          />
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} data-magnetic className={classes} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} data-magnetic disabled={disabled} onClick={onClick} className={classes}>
      {content}
    </button>
  );
}
