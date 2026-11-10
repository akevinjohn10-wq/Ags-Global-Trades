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
      <p className="eyebrow inline-flex items-center gap-3">
        <span aria-hidden="true" className="h-px w-8 bg-accent" />
        {eyebrow}
      </p>
      <h2 className="mt-4 text-[30px] font-semibold tracking-display text-ink sm:mt-5 sm:text-5xl lg:text-[56px]">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-base leading-[1.65] text-muted sm:mt-6 sm:text-lg sm:leading-[1.7]">{description}</p>
      )}
    </div>
  );
}
