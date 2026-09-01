import type { WordDropResults } from "../../state/gamesTypes";
import { formatConfigSummary } from "@/features/typingConfig/utils/formatConfigSummary";
import styles from "./WordDropResults.module.css";

export interface WordDropResultsProps {
  results: WordDropResults;
  onPlayAgain: () => void;
  onEditSettings: () => void;
  onBackToGames: () => void;
}

export function WordDropResults({
  results,
  onPlayAgain,
  onEditSettings,
  onBackToGames,
}: WordDropResultsProps) {
  const summary = formatConfigSummary(
    results.isZenMode,
    results.timeLimit,
    results.wordLimit,
    results.maxErrors,
    results.wordBankSlug,
  );

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.heading}>
          {results.maxWordsReached ? "Word Limit Reached!" : "Game Over"}
        </h2>
        <div className={styles.scoreBlock}>
          <span className={styles.scoreValue}>{results.score}</span>
          <span className={styles.scoreLabel}>SCORE</span>
        </div>

        <p className={styles.context}>{summary}</p>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {Math.round(results.averageWpm)}
            </span>
            <span className={styles.statLabel}>WPM</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{results.accuracy}%</span>
            <span className={styles.statLabel}>Accuracy</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{results.wordsCompleted}</span>
            <span className={styles.statLabel}>Words</span>
          </div>
        </div>

        <div className={styles.qualityRow}>
          <span className={styles.qualityPerfect}>
            {results.wordsPerfect} perfect
          </span>
          <span className={styles.qualityCorrected}>
            {results.wordsCorrected} corrected
          </span>
          <span className={styles.qualityErrored}>
            {results.wordsErrored} errored
          </span>
        </div>

        <div className={styles.controls}>
          <button type="button" className={styles.controlBtn} onClick={onPlayAgain}>
            Play Again
          </button>
          <button type="button" className={styles.controlBtn} onClick={onEditSettings}>
            Edit Settings
          </button>
          <button type="button" className={styles.controlBtn} onClick={onBackToGames}>
            Back to Games
          </button>
        </div>
      </div>
    </div>
  );
}
