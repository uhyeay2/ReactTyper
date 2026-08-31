export enum Finger {
  LeftPinky = "left-pinky",
  LeftRing = "left-ring",
  LeftMiddle = "left-middle",
  LeftIndex = "left-index",
  RightIndex = "right-index",
  RightMiddle = "right-middle",
  RightRing = "right-ring",
  RightPinky = "right-pinky",
  LeftThumb = "left-thumb",
  RightThumb = "right-thumb",
}

export interface KeyType {
  key: string;
  label: string;
  width: number;
  finger: Finger;
  row: number;
  col: number;
  isSpecial?: boolean;
}

const HOME_ROW = 2;
const SPACE_ROW = 4;

export const KEYBOARD_ROWS: KeyType[][] = [
  [
    { key: "`", label: "`", width: 1, finger: Finger.LeftPinky, row: 0, col: 0 },
    { key: "1", label: "1", width: 1, finger: Finger.LeftPinky, row: 0, col: 1 },
    { key: "2", label: "2", width: 1, finger: Finger.LeftRing, row: 0, col: 2 },
    { key: "3", label: "3", width: 1, finger: Finger.LeftMiddle, row: 0, col: 3 },
    { key: "4", label: "4", width: 1, finger: Finger.LeftIndex, row: 0, col: 4 },
    { key: "5", label: "5", width: 1, finger: Finger.LeftIndex, row: 0, col: 5 },
    { key: "6", label: "6", width: 1, finger: Finger.RightIndex, row: 0, col: 6 },
    { key: "7", label: "7", width: 1, finger: Finger.RightIndex, row: 0, col: 7 },
    { key: "8", label: "8", width: 1, finger: Finger.RightMiddle, row: 0, col: 8 },
    { key: "9", label: "9", width: 1, finger: Finger.RightRing, row: 0, col: 9 },
    { key: "0", label: "0", width: 1, finger: Finger.RightRing, row: 0, col: 10 },
    { key: "-", label: "-", width: 1, finger: Finger.RightPinky, row: 0, col: 11 },
    { key: "=", label: "=", width: 1, finger: Finger.RightPinky, row: 0, col: 12 },
  ],
  [
    {
      key: "Tab",
      label: "Tab",
      width: 1.5,
      finger: Finger.LeftPinky,
      row: 1,
      col: 0,
      isSpecial: true,
    },
    { key: "q", label: "Q", width: 1, finger: Finger.LeftPinky, row: 1, col: 1.5 },
    { key: "w", label: "W", width: 1, finger: Finger.LeftRing, row: 1, col: 2.5 },
    { key: "e", label: "E", width: 1, finger: Finger.LeftMiddle, row: 1, col: 3.5 },
    { key: "r", label: "R", width: 1, finger: Finger.LeftIndex, row: 1, col: 4.5 },
    { key: "t", label: "T", width: 1, finger: Finger.LeftIndex, row: 1, col: 5.5 },
    { key: "y", label: "Y", width: 1, finger: Finger.RightIndex, row: 1, col: 6.5 },
    { key: "u", label: "U", width: 1, finger: Finger.RightIndex, row: 1, col: 7.5 },
    { key: "i", label: "I", width: 1, finger: Finger.RightMiddle, row: 1, col: 8.5 },
    { key: "o", label: "O", width: 1, finger: Finger.RightRing, row: 1, col: 9.5 },
    { key: "p", label: "P", width: 1, finger: Finger.RightPinky, row: 1, col: 10.5 },
    { key: "[", label: "[", width: 1, finger: Finger.RightPinky, row: 1, col: 11.5 },
    { key: "]", label: "]", width: 1, finger: Finger.RightPinky, row: 1, col: 12.5 },
    { key: "\\", label: "\\", width: 1, finger: Finger.RightPinky, row: 1, col: 13.5 },
  ],
  [
    {
      key: "CapsLock",
      label: "Caps",
      width: 1.75,
      finger: Finger.LeftPinky,
      row: 2,
      col: 0,
      isSpecial: true,
    },
    { key: "a", label: "A", width: 1, finger: Finger.LeftPinky, row: 2, col: 1.75 },
    { key: "s", label: "S", width: 1, finger: Finger.LeftRing, row: 2, col: 2.75 },
    { key: "d", label: "D", width: 1, finger: Finger.LeftMiddle, row: 2, col: 3.75 },
    { key: "f", label: "F", width: 1, finger: Finger.LeftIndex, row: 2, col: 4.75 },
    { key: "g", label: "G", width: 1, finger: Finger.LeftIndex, row: 2, col: 5.75 },
    { key: "h", label: "H", width: 1, finger: Finger.RightIndex, row: 2, col: 6.75 },
    { key: "j", label: "J", width: 1, finger: Finger.RightIndex, row: 2, col: 7.75 },
    { key: "k", label: "K", width: 1, finger: Finger.RightMiddle, row: 2, col: 8.75 },
    { key: "l", label: "L", width: 1, finger: Finger.RightRing, row: 2, col: 9.75 },
    { key: ";", label: ";", width: 1, finger: Finger.RightPinky, row: 2, col: 10.75 },
    { key: "'", label: "'", width: 1, finger: Finger.RightPinky, row: 2, col: 11.75 },
    {
      key: "Enter",
      label: "Enter",
      width: 2.25,
      finger: Finger.RightPinky,
      row: 2,
      col: 12.75,
      isSpecial: true,
    },
  ],
  [
    {
      key: "Shift",
      label: "Shift",
      width: 2.25,
      finger: Finger.LeftPinky,
      row: 3,
      col: 0,
      isSpecial: true,
    },
    { key: "z", label: "Z", width: 1, finger: Finger.LeftPinky, row: 3, col: 2.25 },
    { key: "x", label: "X", width: 1, finger: Finger.LeftRing, row: 3, col: 3.25 },
    { key: "c", label: "C", width: 1, finger: Finger.LeftMiddle, row: 3, col: 4.25 },
    { key: "v", label: "V", width: 1, finger: Finger.LeftIndex, row: 3, col: 5.25 },
    { key: "b", label: "B", width: 1, finger: Finger.LeftIndex, row: 3, col: 6.25 },
    { key: "n", label: "N", width: 1, finger: Finger.RightIndex, row: 3, col: 7.25 },
    { key: "m", label: "M", width: 1, finger: Finger.RightIndex, row: 3, col: 8.25 },
    { key: ",", label: ",", width: 1, finger: Finger.RightMiddle, row: 3, col: 9.25 },
    { key: ".", label: ".", width: 1, finger: Finger.RightRing, row: 3, col: 10.25 },
    { key: "/", label: "/", width: 1, finger: Finger.RightPinky, row: 3, col: 11.25 },
    {
      key: "Shift",
      label: "Shift",
      width: 2.75,
      finger: Finger.RightPinky,
      row: 3,
      col: 12.25,
      isSpecial: true,
    },
  ],
];

export const SPACEBAR_ROW: KeyType[] = [
  {
    key: "Ctrl",
    label: "Ctrl",
    width: 1.5,
    finger: Finger.LeftPinky,
    row: 4,
    col: 0,
    isSpecial: true,
  },
  {
    key: "Alt",
    label: "Alt",
    width: 1.25,
    finger: Finger.LeftMiddle,
    row: 4,
    col: 1.5,
    isSpecial: true,
  },
  { key: " ", label: "Space", width: 6, finger: Finger.RightThumb, row: 4, col: 2.75 },
  {
    key: "Alt",
    label: "Alt",
    width: 1.25,
    finger: Finger.RightMiddle,
    row: 4,
    col: 8.75,
    isSpecial: true,
  },
  {
    key: "Ctrl",
    label: "Ctrl",
    width: 1.5,
    finger: Finger.RightPinky,
    row: 4,
    col: 10,
    isSpecial: true,
  },
];

function buildFingerKeyMap(): Record<string, Finger> {
  const map: Record<string, Finger> = {};
  const allRows = [...KEYBOARD_ROWS, SPACEBAR_ROW];
  for (const row of allRows) {
    for (const k of row) {
      if (!k.isSpecial) {
        map[k.key] = k.finger;
      }
    }
  }
  return map;
}

export const FINGER_KEY_MAP: Record<string, Finger> = buildFingerKeyMap();

const SHIFTED_CHAR_MAP: Record<string, string> = {
  a: "A", b: "B", c: "C", d: "D", e: "E", f: "F", g: "G",
  h: "H", i: "I", j: "J", k: "K", l: "L", m: "M", n: "N",
  o: "O", p: "P", q: "Q", r: "R", s: "S", t: "T", u: "U",
  v: "V", w: "W", x: "X", y: "Y", z: "Z",
  "1": "!", "2": "@", "3": "#", "4": "$", "5": "%",
  "6": "^", "7": "&", "8": "*", "9": "(", "0": ")",
  "-": "_", "=": "+", "[": "{", "]": "}", "\\": "|",
  ";": ":", "'": "\"", ",": "<", ".": ">", "/": "?",
  "`": "~",
};

const UNSHIFTED_CHAR_MAP: Record<string, string> = {};
for (const [lower, upper] of Object.entries(SHIFTED_CHAR_MAP)) {
  UNSHIFTED_CHAR_MAP[upper] = lower;
}

function getBaseKeyForChar(char: string): string | null {
  if (FINGER_KEY_MAP[char] !== undefined) return char;
  const lower = UNSHIFTED_CHAR_MAP[char];
  if (lower && FINGER_KEY_MAP[lower] !== undefined) return lower;
  return null;
}

function isShiftedChar(char: string): boolean {
  return char in UNSHIFTED_CHAR_MAP;
}

export interface NextKeyInfo {
  key: string;
  finger: Finger;
  needsShift: boolean;
  shiftFinger: Finger;
}

export function getNextKeyInfo(
  targetText: string,
  currentIndex: number,
): NextKeyInfo | null {
  if (currentIndex >= targetText.length) return null;
  const char = targetText[currentIndex];
  if (char === undefined) return null;
  const baseKey = getBaseKeyForChar(char);
  if (baseKey === null) return null;
  const finger = FINGER_KEY_MAP[baseKey];
  if (finger === undefined) return null;
  const needsShift = isShiftedChar(char);
  return {
    key: baseKey,
    finger,
    needsShift,
    shiftFinger: Finger.LeftPinky,
  };
}

// ---------------------------------------------------------------------------
// Hand geometry: each finger rests on its home-row key, and only the finger
// responsible for the next key extends away from the home row toward it.
// ---------------------------------------------------------------------------

export interface FingerDisplacement {
  dx: number;
  dy: number;
}

// Absolute horizontal position per row, accounting for leading special keys.
const ROW_BASE_X: Record<number, number> = {
  0: 0,
  1: 1.5,
  2: 1.75,
  3: 2.25,
  4: 1.5,
};

// Absolute horizontal position (in key units) of each finger's resting key.
// Home-row keys for the digits, and the space bar for the thumbs.
const FINGER_HOME_X: Record<Finger, number> = {
  [Finger.LeftPinky]: 1.75 + 1.75, // 'a'
  [Finger.LeftRing]: 1.75 + 2.75, // 's'
  [Finger.LeftMiddle]: 1.75 + 3.75, // 'd'
  [Finger.LeftIndex]: 1.75 + 4.75, // 'f'
  [Finger.RightIndex]: 1.75 + 7.75, // 'j'
  [Finger.RightMiddle]: 1.75 + 8.75, // 'k'
  [Finger.RightRing]: 1.75 + 9.75, // 'l'
  [Finger.RightPinky]: 1.75 + 10.75, // ';'
  [Finger.LeftThumb]: 2.75 + 1.0, // left part of space bar
  [Finger.RightThumb]: 2.75 + 5.0, // right part of space bar
};

// Scale factors (in SVG view-box units) bridging the hand overlay coordinate
// space to the rendered keyboard. The hand SVG uses a uniform grid where one
// key spans `COL_PX` units horizontally and one keyboard row spans `ROW_PX`
// units vertically; the rendered overlay renders `COL_PX` units as the same
// pixel pitch as a real key (40px) so fingers land exactly on key centers.
const COL_PX = 20;
const ROW_PX = 20;

export function getFingerDisplacement(
  finger: Finger,
  targetKey: string,
): FingerDisplacement {
  if (targetKey === " ") {
    // Thumbs already rest over the space bar, so they do not move.
    return { dx: 0, dy: 0 };
  }
  const targetKeyInfo = KEY_BY_KEY[targetKey];
  if (targetKeyInfo === undefined) {
    // Fall back to the home-row resting position (no movement).
    return { dx: 0, dy: 0 };
  }
  const homeRow = finger === Finger.LeftThumb || finger === Finger.RightThumb
    ? SPACE_ROW
    : HOME_ROW;
  const homeX = FINGER_HOME_X[finger]!;
  const targetX = ROW_BASE_X[targetKeyInfo.row]! + targetKeyInfo.col;
  return {
    dx: (targetX - homeX) * COL_PX,
    dy: (targetKeyInfo.row - homeRow) * ROW_PX,
  };
}

// Map every non-special key to its { row, col } for displacement lookups.
const KEY_BY_KEY: Record<string, { row: number; col: number }> = {};
for (const row of [...KEYBOARD_ROWS, SPACEBAR_ROW]) {
  for (const k of row) {
    if (!k.isSpecial && !KEY_BY_KEY[k.key]) {
      KEY_BY_KEY[k.key] = { row: k.row, col: k.col };
    }
  }
}

const SHIFT_LEFT_X = ROW_BASE_X[3]! + 1.125;
const SHIFT_RIGHT_X = ROW_BASE_X[3]! + 12.25 + 1.375;

export function getShiftDisplacement(shiftFinger: Finger): FingerDisplacement {
  if (shiftFinger === Finger.RightPinky) {
    return {
      dx: (SHIFT_RIGHT_X - FINGER_HOME_X[Finger.RightPinky]!) * COL_PX,
      dy: (3 - HOME_ROW) * ROW_PX,
    };
  }
  return {
    dx: (SHIFT_LEFT_X - FINGER_HOME_X[Finger.LeftPinky]!) * COL_PX,
    dy: (3 - HOME_ROW) * ROW_PX,
  };
}
