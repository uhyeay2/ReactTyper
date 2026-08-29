import { useMemo } from "react";
import { computeCharStates } from "../../state/typingSelectors";
import styles from "./TypedWordsDisplay.module.css";

interface TypedWordsDisplayProps {
  targetText: string;
  typedText: string;
  currentIndex: number;
  fixedChars: string;
}

interface RenderedChar {
  globalIndex: number;
  char: string;
  state: string;
}

interface WordSegment {
  wordIndex: number;
  chars: RenderedChar[];
}

const TYPED_STATES = new Set(["correct", "fixed", "incorrect"]);

function getStateClass(state: string): string {
  return TYPED_STATES.has(state) ? state : "pending";
}

export function TypedWordsDisplay({
  targetText,
  typedText,
  currentIndex,
  fixedChars,
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
          char: word[i],
          state: charStates[gi + i] ?? "pending",
        });
      }
      result.push({ wordIndex: result.length, chars });
      gi += word.length + 1;
    }

    return result;
  }, [typedText, charStates]);

  if (typedText.length === 0) {
    return <div className={styles.empty}>No words typed</div>;
  }

  return (
    <div className={styles.scrollWrapper} aria-label="Typed test text review">
      <div className={styles.display}>
        {words.map((word) => (
          <span key={word.wordIndex} className={styles.word}>
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
        ))}
      </div>
    </div>
  );
}
