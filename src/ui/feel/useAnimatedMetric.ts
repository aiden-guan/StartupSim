import { useEffect, useRef, useState } from "react";

export function shouldAnimateMetric(before: number, after: number, minimum: number): boolean {
  return Number.isFinite(before) && Number.isFinite(after) && Math.abs(after - before) >= minimum;
}

export function useAnimatedMetric(value: number, reducedMotion: boolean, minimum: number, delay = 0, animateOnMount = false): number {
  const previous = useRef(animateOnMount ? 0 : value);
  const frame = useRef(0);
  const [display, setDisplay] = useState(animateOnMount && !reducedMotion ? 0 : value);
  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    window.cancelAnimationFrame(frame.current);
    if (reducedMotion || !shouldAnimateMetric(from, value, minimum)) { setDisplay(value); return; }
    const start = performance.now() + delay;
    const duration = 650;
    const animate = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / duration));
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) frame.current = window.requestAnimationFrame(animate);
    };
    frame.current = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame.current);
  }, [value, reducedMotion, minimum, delay]);
  return display;
}
