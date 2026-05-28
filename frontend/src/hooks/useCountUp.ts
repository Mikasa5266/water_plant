import { useEffect, useRef, useState } from 'react';

export interface UseCountUpOptions {
  duration?: number;
  decimals?: number;
}

export function useCountUp(
  target: number,
  options: UseCountUpOptions = {},
): number {
  const { duration = 600, decimals = 1 } = options;
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef({ value: target, time: 0 });

  useEffect(() => {
    const from = display;
    if (from === target) return;

    startRef.current = { value: from, time: performance.now() };

    const animate = () => {
      const elapsed = performance.now() - startRef.current.time;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const current = startRef.current.value + (target - startRef.current.value) * eased;
      const factor = 10 ** decimals;
      setDisplay(Math.round(current * factor) / factor);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, decimals]);

  return display;
}
