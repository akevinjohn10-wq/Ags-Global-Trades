import { Fragment } from 'react';
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
  /** Control the reveal from outside instead of waiting for it to scroll into view */
  play?: boolean;
}

/** Headline that reveals word by word (each word slides up from behind a mask). */
export default function SplitText({ text, as: Tag = 'h2', className = '', delay = 0, stagger = 70, play }: SplitTextProps) {
  const { ref, isInView } = useInView<HTMLElement>(0.2);
  const shown = play ?? isInView;
  let index = 0;

  return (
    <Tag ref={ref as never} aria-label={text.replace(/\n/g, ' ')} className={`split-root ${shown ? 'is-visible' : ''} ${className}`}>
      {text.split('\n').map((line, lineIndex) => (
        <span key={lineIndex} aria-hidden="true" className="block">
          {line.split(' ').map((word, wordIndex, words) => {
            const d = delay + index++ * stagger;
            return (
              <Fragment key={`${word}-${wordIndex}`}>
                <span className="split-word">
                  <span style={{ transitionDelay: `${d}ms` }}>{word}</span>
                </span>
                {wordIndex < words.length - 1 ? ' ' : ''}
              </Fragment>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
