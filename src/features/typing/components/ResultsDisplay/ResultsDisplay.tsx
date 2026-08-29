import type { TypingResults } from "../../state/typingTypes";
import type { WpmTimelinePoint } from "../../metrics/wpm";
import { TypedWordsDisplay } from "../TypedWordsDisplay/TypedWordsDisplay";
import { WpmGraph } from "../WpmGraph/WpmGraph";
import { CollapsibleSection } from "@/shared/components/CollapsibleSection/CollapsibleSection";
import styles from "./ResultsDisplay.module.css";

const TYPED_WORDS_STORAGE_KEY = "reacttyper-results-typed-words";
const WPM_OVER_TIME_STORAGE_KEY = "reacttyper-results-wpm-over-time";
const EXTRA_DETAILS_STORAGE_KEY = "reacttyper-results-extra-details";

interface ResultsDisplayProps {
  results: TypingResults;
  targetText: string;
  typedText: string;
  currentIndex: number;
  fixedChars: string;
  wpmTimeline: WpmTimelinePoint[];
}

export function ResultsDisplay({
  results,
  targetText,
  typedText,
  currentIndex,
  fixedChars,
  wpmTimeline,
}: ResultsDisplayProps) {
  return (
    <div className={styles.results}>
      <h2 className={styles.title}>Test Complete</h2>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{results.wpm}</span>
          <span className={styles.metricLabel}>Adjusted WPM</span>
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

      <CollapsibleSection
        title="Extra Details"
        storageKey={EXTRA_DETAILS_STORAGE_KEY}
        defaultOpen={false}
      >
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Total Words Typed</span>
            <span className={styles.detailValue}>{results.totalWordsTyped}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Words With Errors</span>
            <span className={styles.detailValue}>
              {results.wordsTypedWithErrors}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Words With Corrections</span>
            <span className={styles.detailValue}>
              {results.wordsTypedWithCorrections}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Words Typed Perfectly</span>
            <span className={styles.detailValue}>
              {results.wordsTypedPerfectly}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Time Typed</span>
            <span className={styles.detailValue}>{results.elapsedTime}s</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Lowest WPM</span>
            <span className={styles.detailValue}>{results.lowestWpm}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Highest WPM</span>
            <span className={styles.detailValue}>{results.highestWpm}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Average WPM</span>
            <span className={styles.detailValue}>{results.averageWpm}</span>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Your Typed Words"
        storageKey={TYPED_WORDS_STORAGE_KEY}
        defaultOpen={false}
      >
        <TypedWordsDisplay
          targetText={targetText}
          typedText={typedText}
          currentIndex={currentIndex}
          fixedChars={fixedChars}
          wordStates={results.wordStates}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="WPM Over Time"
        storageKey={WPM_OVER_TIME_STORAGE_KEY}
        defaultOpen={true}
      >
        <WpmGraph wpmTimeline={wpmTimeline} />
      </CollapsibleSection>
    </div>
  );
}