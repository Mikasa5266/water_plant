import { useEffect, useRef, useState } from 'react';

export interface UseTypewriterOptions {
  speed?: number;
  startDelay?: number;
}

export function useTypewriter(
  text: string | null,
  options: UseTypewriterOptions = {},
): { displayText: string; isTyping: boolean } {
  const { speed = 35, startDelay = 300 } = options;
  const [charIndex, setCharIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const prevTextRef = useRef<string | null>(null);

  useEffect(() => {
    if (text === prevTextRef.current) return;
    prevTextRef.current = text;
    setCharIndex(0);
    setStarted(false);

    if (!text) return;

    const delayTimer = window.setTimeout(() => setStarted(true), startDelay);
    return () => window.clearTimeout(delayTimer);
  }, [text, startDelay]);

  useEffect(() => {
    if (!started || !text) return;
    if (charIndex >= text.length) return;

    const timer = window.setTimeout(() => setCharIndex((i) => i + 1), speed);
    return () => window.clearTimeout(timer);
  }, [started, text, charIndex, speed]);

  if (!text) return { displayText: '', isTyping: false };
  if (!started) return { displayText: '', isTyping: true };

  return {
    displayText: text.slice(0, charIndex),
    isTyping: charIndex < text.length,
  };
}
