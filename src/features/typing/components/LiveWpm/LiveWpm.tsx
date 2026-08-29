import styles from "./LiveWpm.module.css";

const DOT_COUNT = 12;
const ROTATION_STEP_DEG = 360 / DOT_COUNT;
const ORBIT_RADIUS_PX = 10;
const PULSE_PERIOD_MS = 1200;

interface LiveWpmProps {
  ready: boolean;
  value: number;
}

export function LiveWpm({ ready, value }: LiveWpmProps) {
  if (ready) {
    return <span className={styles.value}>{Math.round(value)}</span>;
  }

  return (
    <span className={styles.loader} role="status" aria-label="Calculating WPM">
      {Array.from({ length: DOT_COUNT }, (_, index) => (
        <span
          key={index}
          className={styles.dot}
          style={{
            transform: `rotate(${index * ROTATION_STEP_DEG}deg) translateX(${ORBIT_RADIUS_PX}px)`,
            animationDelay: `${(index * PULSE_PERIOD_MS) / DOT_COUNT}ms`,
          }}
        />
      ))}
    </span>
  );
}
