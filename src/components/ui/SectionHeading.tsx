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
      <h2 className="mt-3 text-[26px] font-semibold text-ink sm:mt-4 sm:text-4xl lg:text-[44px]">{title}</h2>
      {description && (
        <p className="mt-4 text-base leading-[1.65] text-muted sm:mt-5 sm:text-lg sm:leading-[1.7]">{description}</p>
      )}
    </div>
  );
}
