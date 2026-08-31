import { useMemo } from "react";
import { useAppSelector } from "@/app/hooks";
import { selectTargetText } from "../../state/typingSlice";
import { selectCurrentIndex } from "../../state/typingSlice";
import {
  KEYBOARD_ROWS,
  SPACEBAR_ROW,
  Finger,
  getNextKeyInfo,
  getFingerDisplacement,
  getShiftDisplacement,
  type FingerDisplacement,
} from "./keyboardLayout";
import { KeyboardRow } from "./KeyboardRow";
import { HandSvg } from "./HandSvg";
import styles from "./VirtualKeyboard.module.css";

function isLeftHandFinger(finger: Finger): boolean {
  return finger.startsWith("left");
}

export function VirtualKeyboard() {
  const targetText = useAppSelector(selectTargetText);
  const currentIndex = useAppSelector(selectCurrentIndex);

  const nextKeyInfo = useMemo(
    () => getNextKeyInfo(targetText, currentIndex),
    [targetText, currentIndex],
  );

  const activeKey = nextKeyInfo?.key ?? null;
  const activeShiftKey = nextKeyInfo?.needsShift ?? false;
  const typingFinger = nextKeyInfo?.finger ?? null;
  const shiftFinger = nextKeyInfo?.needsShift ? nextKeyInfo.shiftFinger : null;

  const hands = useMemo(() => {
    const leftOffsets: Partial<Record<Finger, FingerDisplacement>> = {};
    const rightOffsets: Partial<Record<Finger, FingerDisplacement>> = {};
    const leftActive: Finger[] = [];
    const rightActive: Finger[] = [];

    if (typingFinger !== null && activeKey !== null) {
      const displacement = getFingerDisplacement(typingFinger, activeKey);
      if (isLeftHandFinger(typingFinger)) {
        leftOffsets[typingFinger] = displacement;
        leftActive.push(typingFinger);
      } else {
        rightOffsets[typingFinger] = displacement;
        rightActive.push(typingFinger);
      }
    }

    if (shiftFinger !== null) {
      const displacement = getShiftDisplacement(shiftFinger);
      if (isLeftHandFinger(shiftFinger)) {
        leftOffsets[shiftFinger] = displacement;
        leftActive.push(shiftFinger);
      } else {
        rightOffsets[shiftFinger] = displacement;
        rightActive.push(shiftFinger);
      }
    }

    return { leftOffsets, rightOffsets, leftActive, rightActive };
  }, [typingFinger, activeKey, shiftFinger]);

  const guidanceLabel = useMemo(() => {
    if (!nextKeyInfo) return "No guidance available";
    const fingerName = nextKeyInfo.finger
      .replace("left-", "Left ")
      .replace("right-", "Right ")
      .replace("-", " ");
    const shiftNote = nextKeyInfo.needsShift ? " (hold Shift)" : "";
    return `Press ${nextKeyInfo.key.toUpperCase()} with ${fingerName}${shiftNote}`;
  }, [nextKeyInfo]);

  return (
    <div className={styles.keyboardWrapper}>
      <span className={styles.srOnly}>{guidanceLabel}</span>
      <div className={styles.keyboard}>
        <div className={styles.handsOverlay}>
          <span className={styles.handAnchorLeft}>
            <HandSvg
              hand="left"
              activeFingers={hands.leftActive}
              fingerOffsets={hands.leftOffsets}
            />
          </span>
          <span className={styles.handAnchorRight}>
            <HandSvg
              hand="right"
              activeFingers={hands.rightActive}
              fingerOffsets={hands.rightOffsets}
            />
          </span>
        </div>
        {KEYBOARD_ROWS.map((row, i) => (
          <KeyboardRow
            key={i}
            keys={row}
            activeKey={activeKey}
            activeShiftKey={activeShiftKey}
          />
        ))}
        <KeyboardRow
          keys={SPACEBAR_ROW}
          activeKey={activeKey}
          activeShiftKey={false}
        />
      </div>
    </div>
  );
}
