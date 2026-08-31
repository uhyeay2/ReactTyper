import styles from "./VirtualKeyboard.module.css";

interface KeyboardKeyProps {
  label: string;
  width: number;
  isActive: boolean;
  isShiftActive: boolean;
  isSpecial: boolean;
}

export function KeyboardKey({
  label,
  width,
  isActive,
  isShiftActive,
  isSpecial,
}: KeyboardKeyProps) {
  const classNames = [
    styles.key,
    isActive ? styles.keyActive : "",
    isShiftActive ? styles.keyShiftActive : "",
    isSpecial ? styles.keySpecial : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classNames}
      style={{ width: `${width * 36 + (width - 1) * 4}px` }}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}
