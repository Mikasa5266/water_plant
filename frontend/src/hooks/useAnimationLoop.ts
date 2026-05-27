import { useState, useEffect, useRef } from 'react';

export function useAnimationLoop() {
  const [animationTick, setAnimationTick] = useState<number>(0);
  const animationTickRef = useRef(animationTick);

  useEffect(() => {
    animationTickRef.current = animationTick;
  }, [animationTick]);

  useEffect(() => {
    let frameId: number;
    const update = () => {
      setAnimationTick(prev => (prev + 1) % 100000);
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return { animationTick, animationTickRef };
}
