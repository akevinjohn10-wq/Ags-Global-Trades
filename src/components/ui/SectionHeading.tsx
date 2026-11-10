import type { ReactNode } from 'react';
import SplitText from '@/components/ui/SplitText';

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
      <SplitText
        as="h2"
        text={title}
        stagger={55}
        className="mt-4 text-[26px] font-semibold leading-[1.12] tracking-display text-white sm:mt-5 sm:text-4xl lg:text-[46px]"
      />
      {description && (
        <p className="mt-5 text-base leading-[1.65] text-muted sm:mt-6 sm:text-lg sm:leading-[1.7]">{description}</p>
      )}
    </div>
  );
}
