import type { ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'section';
}

/** Fades and lifts its content in the first time it scrolls into view. */
export default function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }: RevealProps) {
  const { ref, isInView } = useInView<HTMLElement>();

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${isInView ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
