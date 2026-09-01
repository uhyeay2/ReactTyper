/** Pixel height of a single stack slot in the game field. */
export const ROW_HEIGHT = 44;

/**
 * Maximum words that can be on screen (stacked + the active one) before the
 * game is lost. The stack is anchored at the bottom; the word at the bottom of
 * the stack is the one being typed.
 */
export const MAX_STACK_SIZE = 3;

/**
 * Total height of the play field in rows. The field is about ten words tall so
 * that words appear high up and fall a long, gradual distance to the stack.
 */
export const FIELD_ROWS = 10;

/**
 * Total height of the play field in pixels (about ten words tall).
 */
export const FIELD_HEIGHT = FIELD_ROWS * ROW_HEIGHT;

/** Stack count after which a further word ends the game (the fourth word). */
export const LOSE_STACK_SIZE = MAX_STACK_SIZE + 1;

/** Starting spawn rate in WPM (words per minute). */
export const START_SPEED_WPM = 10;

/** WPM gained per second of elapsed game time. */
export const SPEED_ACCELERATION = 0.6;

/** Upper bound on the spawn rate in WPM to keep the game playable. */
export const MAX_SPEED_WPM = 60;

/** Number of characters treated as a single "word" for WPM math. */
export const CHARS_PER_WORD = 5;

/** Minimum duration (seconds) used to guard against a divide-by-zero WPM. */
export const MIN_WORD_DURATION_SECONDS = 0.05;

/**
 * Effective spawn rate in WPM at a given elapsed game time. The game starts
 * slow (10 WPM = one word every six seconds) and ramps up over time.
 */
export function dropSpeedWpm(elapsedSeconds: number): number {
  const speed = START_SPEED_WPM + SPEED_ACCELERATION * elapsedSeconds;
  return Math.min(speed, MAX_SPEED_WPM);
}

/** Seconds between new words spawning at the given elapsed game time. */
export function spawnIntervalSeconds(elapsedSeconds: number): number {
  return 60 / dropSpeedWpm(elapsedSeconds);
}

/** Shortest fall-in duration (seconds) at the maximum speed. */
export const MIN_FALL_SECONDS = 1.5;
/** Longest fall-in duration (seconds) at the slowest starting speed. */
export const MAX_FALL_SECONDS = 5;

/**
 * How long a newly spawned word takes to visually fall from the top of the
 * field down onto the stack. It starts very gradual (~5s) so the player feels
 * there is plenty of time to type, and quickens as the game speed ramps up.
 */
export function fallDurationSeconds(elapsedSeconds: number): number {
  const speed = dropSpeedWpm(elapsedSeconds);
  const progress = (speed - START_SPEED_WPM) / (MAX_SPEED_WPM - START_SPEED_WPM);
  return MAX_FALL_SECONDS - progress * (MAX_FALL_SECONDS - MIN_FALL_SECONDS);
}

/**
 * Whether a new word that would become the `nextStackCount`-th word in the
 * stack loses the game (i.e. it would be the fourth word).
 */
export function stackWouldLose(nextStackCount: number): boolean {
  return nextStackCount >= LOSE_STACK_SIZE;
}
