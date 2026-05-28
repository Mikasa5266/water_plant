import { useEffect, useRef } from 'react';
import { useTypewriter } from '../../hooks/useTypewriter';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  startDelay?: number;
  className?: string;
}

export function TypewriterText({ text, speed, startDelay, className = '' }: TypewriterTextProps) {
  const { displayText, isTyping } = useTypewriter(text, { speed, startDelay });

  return (
    <span className={className}>
      {displayText}
      {isTyping && (
        <span className="inline-block w-[2px] h-[1em] ml-0.5 align-middle bg-cyan-400 animate-[blink_1s_steps(2)_infinite]" />
      )}
    </span>
  );
}

interface TypewriterListProps {
  items: string[];
  speed?: number;
  startDelay?: number;
  className?: string;
  itemClassName?: string;
  autoScroll?: boolean;
}

export function TypewriterList({
  items,
  speed = 30,
  startDelay = 200,
  className = '',
  itemClassName = '',
  autoScroll = true,
}: TypewriterListProps) {
  const containerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!autoScroll || !containerRef.current) return;
    const el = containerRef.current;
    el.scrollTop = el.scrollHeight;
  }, [items, autoScroll]);

  return (
    <ul ref={containerRef} className={`${className} ${autoScroll ? 'overflow-y-auto' : ''}`}>
      {items.map((item, i) => (
        <li
          key={item}
          className={`${itemClassName} animate-[fadeSlideIn_0.3s_ease-out_both]`}
          style={{ animationDelay: `${startDelay + i * 800}ms` }}
        >
          <TypewriterText text={item} speed={speed} startDelay={startDelay + i * 800} />
        </li>
      ))}
    </ul>
  );
}

