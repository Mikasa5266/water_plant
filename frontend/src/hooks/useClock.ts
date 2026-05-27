import { useState, useEffect } from 'react';

export function useClock() {
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const now = new Date();
    const pad = (v: number) => v.toString().padStart(2, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const pad = (v: number) => v.toString().padStart(2, '0');
      setCurrentTime(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return currentTime;
}
