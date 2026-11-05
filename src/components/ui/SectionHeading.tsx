import type { ReactNode } from 'react';

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  align?: 'left' | 'center';
}

export default function SectionHeading({ eyebrow, title, description, align = 'left' }: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'mx-auto text-center' : '';

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold text-ink sm:text-4xl lg:text-[44px]">{title}</h2>
      {description && <p className="mt-5 text-lg leading-[1.7] text-muted">{description}</p>}
    </div>
  );
}
