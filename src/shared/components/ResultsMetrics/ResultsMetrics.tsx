import { CollapsibleSection } from "../CollapsibleSection/CollapsibleSection";
import styles from "./ResultsMetrics.module.css";

export const EXTRA_DETAILS_STORAGE_KEY = "reacttyper-results-extra-details";

/**
 * The headline metrics (Adjusted WPM, Accuracy, Raw WPM) plus the collapsible
 * "Extra Details" breakdown. Shared by the post-test results review and the
 * history detail view so the two surfaces stay identical.
 */
export interface ResultStats {
  adjustedWpm: number;
  accuracy: number;
  rawWpm: number;
  totalWordsTyped: number;
  wordsTypedWithErrors: number;
  wordsTypedWithCorrections: number;
  wordsTypedPerfectly: number;
  timeTypedSeconds: number;
  lowestWpm: number;
  highestWpm: number;
  averageWpm: number;
}

interface ResultsMetricsProps {
  stats: ResultStats;
  storageKey?: string;
}

export function ResultsMetrics({
  stats,
  storageKey = EXTRA_DETAILS_STORAGE_KEY,
}: ResultsMetricsProps) {
  return (
    <>
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{stats.adjustedWpm}</span>
          <span className={styles.metricLabel}>Adjusted WPM</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{stats.accuracy}%</span>
          <span className={styles.metricLabel}>Accuracy</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{stats.rawWpm}</span>
          <span className={styles.metricLabel}>Raw WPM</span>
        </div>
      </div>

      <CollapsibleSection
        title="Extra Details"
        storageKey={storageKey}
        defaultOpen={false}
      >
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Total Words Typed</span>
            <span className={styles.detailValue}>{stats.totalWordsTyped}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Words With Errors</span>
            <span className={styles.detailValue}>
              {stats.wordsTypedWithErrors}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Words With Corrections</span>
            <span className={styles.detailValue}>
              {stats.wordsTypedWithCorrections}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Words Typed Perfectly</span>
            <span className={styles.detailValue}>
              {stats.wordsTypedPerfectly}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Time Typed</span>
            <span className={styles.detailValue}>{stats.timeTypedSeconds}s</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Lowest WPM</span>
            <span className={styles.detailValue}>{stats.lowestWpm}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Highest WPM</span>
            <span className={styles.detailValue}>{stats.highestWpm}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Average WPM</span>
            <span className={styles.detailValue}>{stats.averageWpm}</span>
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}