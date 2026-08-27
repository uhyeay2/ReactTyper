import type { TypingResults } from "../../state/typingTypes";
import styles from "./ResultsDisplay.module.css";

interface ResultsDisplayProps {
  results: TypingResults;
}

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  return (
    <div className={styles.results}>
      <h2 className={styles.title}>Test Complete</h2>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{results.wpm}</span>
          <span className={styles.metricLabel}>WPM</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{results.accuracy}%</span>
          <span className={styles.metricLabel}>Accuracy</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{results.grossWpm}</span>
          <span className={styles.metricLabel}>Raw WPM</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.details}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Correct</span>
          <span className={styles.detailValue}>{results.correctChars}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Errors</span>
          <span className={styles.detailValue}>{results.incorrectChars}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Time</span>
          <span className={styles.detailValue}>{results.elapsedTime}s</span>
        </div>
      </div>
    </div>
  );
}
