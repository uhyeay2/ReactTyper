import type { TypingResults } from "../../state/typingTypes";
import type { WpmTimelinePoint } from "../../metrics/wpm";
import { TypedWordsDisplay } from "../TypedWordsDisplay/TypedWordsDisplay";
import { WpmGraph } from "@/shared/components/WpmGraph/WpmGraph";
import {
  ResultsMetrics,
  type ResultStats,
} from "@/shared/components/ResultsMetrics/ResultsMetrics";
import { CollapsibleSection } from "@/shared/components/CollapsibleSection/CollapsibleSection";
import styles from "./ResultsDisplay.module.css";

const TYPED_WORDS_STORAGE_KEY = "reacttyper-results-typed-words";
const WPM_OVER_TIME_STORAGE_KEY = "reacttyper-results-wpm-over-time";

interface ResultsDisplayProps {
  results: TypingResults;
  targetText: string;
  typedText: string;
  currentIndex: number;
  fixedChars: string;
  wpmTimeline: WpmTimelinePoint[];
}

function toResultStats(results: TypingResults): ResultStats {
  return {
    adjustedWpm: results.wpm,
    accuracy: results.accuracy,
    rawWpm: results.grossWpm,
    totalWordsTyped: results.totalWordsTyped,
    wordsTypedWithErrors: results.wordsTypedWithErrors,
    wordsTypedWithCorrections: results.wordsTypedWithCorrections,
    wordsTypedPerfectly: results.wordsTypedPerfectly,
    timeTypedSeconds: results.elapsedTime,
    lowestWpm: results.lowestWpm,
    highestWpm: results.highestWpm,
    averageWpm: results.averageWpm,
  };
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

      <ResultsMetrics stats={toResultStats(results)} />

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