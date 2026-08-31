import { memo } from "react";
import { Finger, type FingerDisplacement } from "./keyboardLayout";
import styles from "./VirtualKeyboard.module.css";

interface HandSvgProps {
  hand: "left" | "right";
  activeFingers: Finger[];
  fingerOffsets: Partial<Record<Finger, FingerDisplacement>>;
}

interface FingerDef {
  finger: Finger;
  x: number;
  width: number;
  height: number;
  roundness: number;
}

// Fingers sit on a uniform 20-unit grid (one grid step == one home-row key ==
// COL_PX from keyboardLayout). Each `x` is the finger rect's left edge and its
// center lines up with a home-row key when the hand is positioned in CSS.
const LEFT_FINGERS: FingerDef[] = [
  { finger: Finger.LeftPinky, x: 7, width: 14, height: 46, roundness: 7 },
  { finger: Finger.LeftRing, x: 26, width: 16, height: 58, roundness: 8 },
  { finger: Finger.LeftMiddle, x: 46, width: 16, height: 64, roundness: 8 },
  { finger: Finger.LeftIndex, x: 66, width: 16, height: 56, roundness: 8 },
];

const RIGHT_FINGERS: FingerDef[] = [
  { finger: Finger.RightIndex, x: 18, width: 16, height: 56, roundness: 8 },
  { finger: Finger.RightMiddle, x: 38, width: 16, height: 64, roundness: 8 },
  { finger: Finger.RightRing, x: 58, width: 16, height: 58, roundness: 8 },
  { finger: Finger.RightPinky, x: 79, width: 14, height: 46, roundness: 7 },
];

const PALM = {
  x: 5,
  y: 84,
  width: 90,
  height: 50,
  roundness: 18,
};

const SVG_WIDTH = 100;
const SVG_HEIGHT = 140;
const FINGER_BASE_Y = PALM.y + 12;

const ZERO: FingerDisplacement = { dx: 0, dy: 0 };

function HandSvgBase({ hand, activeFingers, fingerOffsets }: HandSvgProps) {
  const fingers = hand === "left" ? LEFT_FINGERS : RIGHT_FINGERS;
  const isLeft = hand === "left";

  // The thumb is anatomically on the inside of the hand: the left hand's thumb
  // sits on the right (toward the index finger) and the right hand's thumb on
  // the left.
  const thumbX = isLeft ? 80 : 0;
  const thumbY = 96;
  const thumbFinger = isLeft ? Finger.LeftThumb : Finger.RightThumb;
  const thumbActive = activeFingers.includes(thumbFinger);
  const thumbOffset = fingerOffsets[thumbFinger] ?? ZERO;

  return (
    <svg
      width={SVG_WIDTH}
      height={SVG_HEIGHT}
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className={styles.handSvg}
      data-testid={isLeft ? "left-hand" : "right-hand"}
      aria-hidden="true"
    >
      <g transform={`translate(${thumbOffset.dx}, ${thumbOffset.dy})`}>
        <rect
          x={thumbX}
          y={thumbY}
          width={20}
          height={38}
          rx={10}
          ry={10}
          data-finger={thumbFinger}
          className={thumbActive ? styles.fingerActive : styles.fingerInactive}
        />
      </g>
      <rect
        x={PALM.x}
        y={PALM.y}
        width={PALM.width}
        height={PALM.height}
        rx={PALM.roundness}
        ry={PALM.roundness}
        className={styles.fingerInactive}
      />
      {fingers.map((f) => {
        const isActive = activeFingers.includes(f.finger);
        const off = fingerOffsets[f.finger] ?? ZERO;
        const fingerY = FINGER_BASE_Y - f.height;
        return (
          <g
            key={f.finger}
            transform={`translate(${off.dx}, ${off.dy})`}
          >
            <rect
              x={f.x}
              y={fingerY}
              width={f.width}
              height={f.height}
              rx={f.roundness}
              ry={f.roundness}
              data-finger={f.finger}
              className={isActive ? styles.fingerActive : styles.fingerInactive}
            />
          </g>
        );
      })}
    </svg>
  );
}

export const HandSvg = memo(HandSvgBase);
