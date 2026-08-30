import type { SavedCharState, TypedWord } from "../../state/historyTypes";
import styles from "./HistoryTypedWords.module.css";

interface HistoryTypedWordsProps {
  words: TypedWord[];
}

const CHAR_STATE_CLASSES: Record<SavedCharState, string | undefined> = {
  correct: styles.correct,
  fixed: styles.fixed,
  incorrect: styles.incorrect,
};

/**
 * Renders the words a user completed during a saved session as monospace word
 * chips with a per-word WPM label, mirroring the post-test typed words review.
 * When persisted per-character states are available the characters are colored
 * correct/fixed/incorrect exactly like the live results; legacy records without
 * character data fall back to plain text.
 */
function getCharClassName(
  charStates: SavedCharState[] | undefined,
  index: number,
): string {
  if (!charStates) return "";
  const state = charStates[index];
  return state ? CHAR_STATE_CLASSES[state] ?? "" : "";
}

export function HistoryTypedWords({ words }: HistoryTypedWordsProps) {
  if (words.length === 0) {
    return <div className={styles.empty}>No words typed</div>;
  }

  return (
    <div
      className={styles.scrollWrapper}
      aria-label="Typed test text review"
    >
      <div className={styles.display}>
        {words.map((word, index) => {
          const hasCharStates =
            Array.isArray(word.charStates) &&
            word.charStates.length === word.wordText.length;
          return (
            <span key={`${index}-${word.wordText}`} className={styles.word}>
              <span className={styles.wordChars}>
                {Array.from(word.wordText).map((char, charIndex) => (
                  <span
                    key={charIndex}
                    data-char-index={charIndex}
                    className={`${styles.char} ${getCharClassName(
                      hasCharStates ? word.charStates : undefined,
                      charIndex,
                    )}`.trim()}
                  >
                    {char}
                  </span>
                ))}
              </span>
              <span className={styles.wordLabel}>{word.wpm} WPM</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}