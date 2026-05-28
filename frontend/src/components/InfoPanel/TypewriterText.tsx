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
      {isTyping && <span className="inline-block w-[2px] h-[1em] ml-0.5 bg-cyan-400 animate-pulse align-middle" />}
    </span>
  );
}

interface TypewriterListProps {
  items: string[];
  speed?: number;
  startDelay?: number;
  className?: string;
  itemClassName?: string;
}

export function TypewriterList({ items, speed = 30, startDelay = 200, className = '', itemClassName = '' }: TypewriterListProps) {
  return (
    <ul className={className}>
      {items.map((item, i) => (
        <li key={item} className={itemClassName}>
          <TypewriterText text={item} speed={speed} startDelay={startDelay + i * 800} />
        </li>
      ))}
    </ul>
  );
}
