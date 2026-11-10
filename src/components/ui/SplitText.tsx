import { useInView } from '@/hooks/useInView';

interface SplitTextProps {
  /** Use "\n" for forced line breaks */
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
  /** Delay before the first word, in ms */
  delay?: number;
  /** Gap between words, in ms */
  stagger?: number;
}

/** Headline that reveals word by word (each word slides up from behind a mask). */
export default function SplitText({ text, as: Tag = 'h2', className = '', delay = 0, stagger = 70 }: SplitTextProps) {
  const { ref, isInView } = useInView<HTMLElement>(0.2);
  let index = 0;

  return (
    <Tag ref={ref as never} aria-label={text.replace(/\n/g, ' ')} className={`split-root ${isInView ? 'is-visible' : ''} ${className}`}>
      {text.split('\n').map((line, lineIndex) => (
        <span key={lineIndex} aria-hidden="true" className="block">
          {line.split(' ').map((word, wordIndex) => {
            const d = delay + index++ * stagger;
            return (
              <span key={`${word}-${wordIndex}`} className="split-word">
                <span style={{ transitionDelay: `${d}ms` }}>{word}</span>
                {wordIndex < line.split(' ').length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
