import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { WordDropQueuedWord } from "../../state/gamesTypes";
import {
  ROW_HEIGHT,
  LOSE_STACK_SIZE,
  FIELD_HEIGHT,
} from "../../utils/wordDropEngine";
import styles from "./WordDropField.module.css";

export interface WordDropFieldProps {
  /** The on-screen stack, ordered bottom (index 0 = active target) upward. */
  words: WordDropQueuedWord[];
  /** Typed prefix for the active (bottom) word. */
  typed: string;
  /** Target duration (seconds) of the fall-from-top animation. */
  fallDuration: number;
  /** Whether the game is currently running and words should animate. */
  active: boolean;
  /** Invoked once when the fourth word visually lands on the stack. */
  onStackOverflow?: () => void;
}

/** Distance treated as "settled" when deciding a word has landed. */
const SETTLE_EPSILON_PX = 2;

interface WordFallState {
  /** Current pixel position measured from the bottom of the field. */
  current: number;
  /** Constant downward speed in pixels per second. */
  velocity: number;
}

function charState(char: string, typedPrefix: string, index: number): string {
  const typed = typedPrefix[index];
  if (typed === undefined) {
    return styles.charPending ?? "";
  }
  return typed === char ? (styles.charCorrect ?? "") : (styles.charError ?? "");
}

/**
 * Renders the Word Drop stack and smooths each word falling from the top of the
 * field down onto its slot at a constant pace. Each word descends at a fixed
 * speed (the full field height spread over its fall duration), so there is no
 * start-fast-then-slow easing. Removing the bottom word simply lowers the
 * target slot; the words above keep gliding down at the same constant speed,
 * which reads as a smooth, jump-free shift.
 */
export function WordDropField({
  words,
  typed,
  fallDuration,
  active,
  onStackOverflow,
}: WordDropFieldProps) {
  const boxHeight = ROW_HEIGHT - 10;

  const fallRef = useRef<Map<number, WordFallState>>(new Map());
  const elementsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const overflowFiredRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    let frameId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dtSeconds = Math.min(0.05, (now - last) / 1000);
      last = now;

      const fallStates = fallRef.current;

      const currentIds = new Set<number>();
      for (const word of words) {
        currentIds.add(word.id);
      }
      for (const id of [...fallStates.keys()]) {
        if (!currentIds.has(id)) {
          fallStates.delete(id);
          elementsRef.current.delete(id);
        }
      }

      for (let i = 0; i < words.length; i += 1) {
        const word = words[i];
        if (!word) continue;
        const target = i * ROW_HEIGHT;
        const state = fallRef.current.get(word.id);
        if (!state) continue;
        let current = state.current - state.velocity * dtSeconds;
        if (current < target) {
          current = target;
        }
        state.current = current;
        const el = elementsRef.current.get(word.id);
        if (el) {
          el.style.bottom = `${current}px`;
        }
      }

      const topWord = words[LOSE_STACK_SIZE - 1];
      if (
        topWord &&
        !overflowFiredRef.current &&
        words.length >= LOSE_STACK_SIZE
      ) {
        const target = (LOSE_STACK_SIZE - 1) * ROW_HEIGHT;
        const state = fallRef.current.get(topWord.id);
        if (state && state.current - target <= SETTLE_EPSILON_PX) {
          overflowFiredRef.current = true;
          onStackOverflow?.();
          return;
        }
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active, words, fallDuration, onStackOverflow]);

  const fallVelocity = active ? FIELD_HEIGHT / fallDuration : 0;

  const dangerLineBottom = (LOSE_STACK_SIZE - 0.5) * ROW_HEIGHT;

  return (
    <div className={styles.outer} style={{ height: `${FIELD_HEIGHT}px` }}>
      <div className={styles.field}>
        {words.map((queued) => {
          const isActive = queued.id === words[0]?.id;
          const wordStyle = {
            bottom: `${FIELD_HEIGHT}px`,
            height: `${boxHeight}px`,
          } as CSSProperties;
          return (
            <div
              key={queued.id}
              ref={(el) => {
                if (el) {
                  elementsRef.current.set(queued.id, el);
                  if (!fallRef.current.has(queued.id)) {
                    fallRef.current.set(queued.id, {
                      current: FIELD_HEIGHT,
                      velocity: fallVelocity,
                    });
                  }
                } else {
                  elementsRef.current.delete(queued.id);
                }
              }}
              className={isActive ? styles.activeWord : styles.word}
              style={wordStyle}
            >
              {queued.text.split("").map((char, charIndex) => (
                <span
                  key={charIndex}
                  className={
                    isActive
                      ? charState(char, typed, charIndex)
                      : (styles.charPending ?? "")
                  }
                >
                  {char}
                </span>
              ))}
            </div>
          );
        })}
      </div>
      <div
        className={styles.dangerLine}
        style={{ bottom: `${dangerLineBottom}px` }}
        aria-hidden="true"
      />
    </div>
  );
}