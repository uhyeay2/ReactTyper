import { useMemo } from "react";
import { computeCharStates } from "../../state/typingSelectors";
import type { WordState } from "../../metrics/wpm";
import styles from "./TypedWordsDisplay.module.css";

interface TypedWordsDisplayProps {
  targetText: string;
  typedText: string;
  currentIndex: number;
  fixedChars: string;
  wordStates?: WordState[];
}

interface RenderedChar {
  globalIndex: number;
  char: string;
  state: string;
}

interface WordSegment {
  wordIndex: number;
  chars: RenderedChar[];
  wordWpm: number | null;
}

const TYPED_STATES = new Set(["correct", "fixed", "incorrect"]);

function getStateClass(state: string): string {
  return TYPED_STATES.has(state) ? state : "pending";
}

function formatWordWpm(wordWpm: number | null): string {
  if (wordWpm === null) return "\u2013";
  return `${wordWpm} wpm`;
}

export function TypedWordsDisplay({
  targetText,
  typedText,
  currentIndex,
  fixedChars,
  wordStates = [],
}: TypedWordsDisplayProps) {
  const charStates = useMemo(
    () => computeCharStates(targetText, typedText, currentIndex, fixedChars),
    [targetText, typedText, currentIndex, fixedChars],
  );

  const words = useMemo<WordSegment[]>(() => {
    const typedWords = typedText.split(" ");
    const result: WordSegment[] = [];
    let gi = 0;

    for (const word of typedWords) {
      if (word.length === 0) {
        gi += 1;
        continue;
      }
      const chars: RenderedChar[] = [];
      for (let i = 0; i < word.length; i++) {
        chars.push({
          globalIndex: gi + i,
          char: word.charAt(i),
          state: charStates[gi + i] ?? "pending",
        });
      }
      result.push({
        wordIndex: result.length,
        chars,
        wordWpm: wordStates[result.length]?.wordWpm ?? null,
      });
      gi += word.length + 1;
    }

    return result;
  }, [typedText, charStates, wordStates]);

  if (typedText.length === 0) {
    return <div className={styles.empty}>No words typed</div>;
  }

  return (
    <div className={styles.scrollWrapper} aria-label="Typed test text review">
      <div className={styles.display}>
        {words.map((word) => (
          <span key={word.wordIndex} className={styles.word}>
            <span className={styles.wordChars}>
              {word.chars.map((c) => (
                <span
                  key={c.globalIndex}
                  data-char-index={c.globalIndex}
                  className={`${styles.char} ${styles[getStateClass(c.state)]}`}
                >
                  {c.char}
                </span>
              ))}
              <span className={styles.space}> </span>
            </span>
            <span className={styles.wordLabel}>
              {formatWordWpm(word.wordWpm)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
