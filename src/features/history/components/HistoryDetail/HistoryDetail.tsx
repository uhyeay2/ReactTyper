import type { TypingTestResult } from "../../state/historyTypes";
import { sessionTypeLabel } from "../../utils/sessionType";
import { describeSessionContext } from "../../utils/describeSessionContext";
import { buildGraphTimeline } from "../../utils/buildGraphTimeline";
import { ResultsMetrics, type ResultStats } from "@/shared/components/ResultsMetrics/ResultsMetrics";
import { WpmGraph } from "@/shared/components/WpmGraph/WpmGraph";
import { CollapsibleSection } from "@/shared/components/CollapsibleSection/CollapsibleSection";
import { HistoryTypedWords } from "../HistoryTypedWords/HistoryTypedWords";
import styles from "./HistoryDetail.module.css";

const TYPED_WORDS_STORAGE_KEY = "reacttyper-results-typed-words";
const WPM_OVER_TIME_STORAGE_KEY = "reacttyper-results-wpm-over-time";

interface HistoryDetailProps {
  result: TypingTestResult;
  onBack: () => void;
}

function toResultStats(result: TypingTestResult): ResultStats {
  return {
    adjustedWpm: result.wpm,
    accuracy: result.accuracy,
    rawWpm: result.rawWpm,
    totalWordsTyped: result.totalWordsTyped,
    wordsTypedWithErrors: result.wordsTypedWithErrors,
    wordsTypedWithCorrections: result.wordsTypedWithCorrections,
    wordsTypedPerfectly: result.wordsTypedPerfectly,
    timeTypedSeconds: result.durationSeconds,
    lowestWpm: result.lowestWpm,
    highestWpm: result.highestWpm,
    averageWpm: result.averageWpm,
  };
}

/**
 * Renders a saved typing result with the same presentation as the post-test
 * results review: headline metrics, collapsible "Extra Details", collapsible
 * typed words, and an interactive line graph of WPM over time. The only
 * differences from the live review are the back-to-history button, the session
 * type badge, and the timestamp the result was saved at.
 */
export function HistoryDetail({ result, onBack }: HistoryDetailProps) {
  const timeline = buildGraphTimeline(result);
  const context = describeSessionContext(result);

  return (
    <div className={styles.container}>
      <button type="button" className={styles.back} onClick={onBack}>
        &larr; Back to history
      </button>

      <div className={styles.card}>
        <header className={styles.header}>
          <span className={styles.badge}>{sessionTypeLabel(result.sessionType)}</span>
          <span className={styles.timestamp}>
            {new Date(result.completedAtUtc).toLocaleString()}
          </span>
        </header>

        <p className={styles.context}>{context.summary}</p>

        <ResultsMetrics stats={toResultStats(result)} />

        <CollapsibleSection
          title="Your Typed Words"
          storageKey={TYPED_WORDS_STORAGE_KEY}
          defaultOpen={false}
        >
          <HistoryTypedWords words={result.typedWords} />
        </CollapsibleSection>

        <CollapsibleSection
          title="WPM Over Time"
          storageKey={WPM_OVER_TIME_STORAGE_KEY}
          defaultOpen={true}
        >
          <WpmGraph wpmTimeline={timeline} />
        </CollapsibleSection>
      </div>
    </div>
  );
}