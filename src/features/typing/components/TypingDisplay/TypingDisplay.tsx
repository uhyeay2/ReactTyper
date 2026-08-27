import { useEffect, useMemo, useRef } from "react";
import { useAppSelector } from "@/app/hooks";
import { selectTargetText, selectCurrentIndex } from "../../state/typingSlice";
import { selectCharStates } from "../../state/typingSelectors";
import styles from "./TypingDisplay.module.css";

const LINE_HEIGHT_PX = 36;

interface WordSegment {
  type: "word";
  wordIndex: number;
  chars: { globalIndex: number; char: string; state: string }[];
}

interface SpaceSegment {
  type: "space";
  globalIndex: number;
  state: string;
}

type Segment = WordSegment | SpaceSegment;

export function TypingDisplay() {
  const targetText = useAppSelector(selectTargetText);
  const currentIndex = useAppSelector(selectCurrentIndex);
  const charStates = useAppSelector(selectCharStates);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const currentChar = container.querySelector(
      `[data-char-index="${currentIndex}"]`,
    ) as HTMLElement | null;
    if (!currentChar) return;

    const charTop = currentChar.offsetTop;
    const line = Math.floor(charTop / LINE_HEIGHT_PX);

    if (line >= 2) {
      container.scrollTop = (line - 1) * LINE_HEIGHT_PX;
    } else {
      container.scrollTop = 0;
    }
  }, [currentIndex]);

  const segments = useMemo<Segment[]>(() => {
    const words = targetText.split(" ");
    const result: Segment[] = [];
    let gi = 0;

    words.forEach((word, wordIdx) => {
      const chars = word.split("").map((char, i) => {
        const idx = gi + i;
        return { globalIndex: idx, char, state: charStates[idx] ?? "pending" };
      });
      gi += word.length;
      result.push({ type: "word", wordIndex: wordIdx, chars });

      if (wordIdx < words.length - 1) {
        const spaceState = charStates[gi] ?? "pending";
        result.push({ type: "space", globalIndex: gi, state: spaceState });
        gi += 1;
      }
    });

    return result;
  }, [targetText, charStates]);

  return (
    <div
      ref={scrollRef}
      className={styles.scrollWrapper}
      aria-label="Typing test text"
    >
      <div className={styles.display}>
        {segments.map((segment) => {
          if (segment.type === "word") {
            return (
              <span key={`w-${segment.wordIndex}`} className={styles.word}>
                {segment.chars.map((c) => (
                  <span
                    key={c.globalIndex}
                    data-char-index={c.globalIndex}
                    className={`${styles.char} ${styles[c.state]}`}
                  >
                    {c.char}
                  </span>
                ))}
              </span>
            );
          }

          return (
            <span
              key={`s-${segment.globalIndex}`}
              data-char-index={segment.globalIndex}
              className={`${styles.char} ${styles[segment.state]}`}
            >
              {" "}
            </span>
          );
        })}
      </div>
    </div>
  );
}
