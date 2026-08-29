import { useEffect, useRef, useState } from "react";

interface UseTimerOptions {
  duration: number | null;
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
  const isUnlimited = duration === null;
  const effectiveDuration = duration ?? 0;
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    effectiveDuration,
  );
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

        if (isUnlimited) {
          setElapsedTime(Math.floor(elapsed));
          setTimeRemaining(null);
          onTickRef.current?.(Math.floor(elapsed));
        } else {
          const remaining = Math.max(0, effectiveDuration - elapsed);
          setElapsedTime(Math.floor(elapsed));
          setTimeRemaining(Math.ceil(remaining));
          onTickRef.current?.(Math.floor(elapsed));

          if (remaining <= 0) {
            completedRef.current = true;
            onCompleteRef.current();
            return;
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(rafRef.current);
      };
    }

    if (!completedRef.current) {
      setTimeRemaining(isUnlimited ? null : effectiveDuration);
      setElapsedTime(0);
    }

    return undefined;
  }, [isRunning, effectiveDuration, isUnlimited]);

  return { timeRemaining, elapsedTime };
}
