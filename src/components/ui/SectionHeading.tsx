import type { ReactNode } from 'react';
import SplitText from '@/components/ui/SplitText';
import Reveal from '@/components/ui/Reveal';

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  align?: 'left' | 'center' | 'split';
  tone?: 'dark' | 'light';
  className?: string;
}

/**
 * Section intro. "split" puts the headline left and the description right,
 * the way unitedcarriers.com lays out its section openers.
 */
export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'dark',
  className = '',
}: SectionHeadingProps) {
  const titleColor = tone === 'light' ? 'text-white' : 'text-ink';
  const descColor = tone === 'light' ? 'text-white/70' : 'text-muted';
  const titleClass = `mt-5 text-[32px] font-medium leading-[1.02] sm:text-[48px] lg:text-[64px] ${titleColor}`;

  if (align === 'split') {
    return (
      <div className={`grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-12 ${className}`}>
        <div className="lg:col-span-8">
          <Reveal>
            <p className={`eyebrow ${tone === 'light' ? 'eyebrow-light' : ''}`}>{eyebrow}</p>
          </Reveal>
          <SplitText as="h2" text={title} stagger={60} className={titleClass} />
        </div>
        {description && (
          <Reveal delay={200} className="lg:col-span-4 lg:col-start-9">
            <p className={`text-base leading-[1.7] sm:text-lg ${descColor}`}>{description}</p>
          </Reveal>
        )}
      </div>
    );
  }

  const alignClass = align === 'center' ? 'mx-auto text-center' : '';
  return (
    <div className={`max-w-3xl ${alignClass} ${className}`}>
      <Reveal>
        <p className={`eyebrow ${tone === 'light' ? 'eyebrow-light' : ''}`}>{eyebrow}</p>
      </Reveal>
      <SplitText as="h2" text={title} stagger={60} className={titleClass} />
      {description && (
        <Reveal delay={200}>
          <p className={`mt-6 text-base leading-[1.7] sm:text-lg ${descColor} ${align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl'}`}>
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
