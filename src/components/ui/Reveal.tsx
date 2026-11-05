import type { ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export default function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const { ref, isInView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`reveal ${isInView ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
