import { useEffect, useRef, useState } from "react";

interface UseTimerOptions {
  duration: number;
  isRunning: boolean;
  onComplete: () => void;
  onTick?: (elapsedSeconds: number) => void;
  offset?: number;
}

export function useTimer({
  duration,
  isRunning,
  onComplete,
  onTick,
  offset = 0,
}: UseTimerOptions) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);
  const offsetRef = useRef(offset);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    if (isRunning) {
      completedRef.current = false;
      startTimeRef.current = performance.now();

      const tick = (now: number) => {
        if (startTimeRef.current === null) return;
        const elapsed =
          offsetRef.current + (now - startTimeRef.current) / 1000;
        const remaining = Math.max(0, duration - elapsed);

        setElapsedTime(Math.floor(elapsed));
        setTimeRemaining(Math.ceil(remaining));
        onTickRef.current?.(Math.floor(elapsed));

        if (remaining <= 0) {
          completedRef.current = true;
          onCompleteRef.current();
          return;
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(rafRef.current);
      };
    }

    if (!completedRef.current) {
      setTimeRemaining(duration);
      setElapsedTime(0);
    }

    return undefined;
  }, [isRunning, duration]);

  return { timeRemaining, elapsedTime };
}
