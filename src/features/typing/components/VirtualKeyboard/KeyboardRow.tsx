import type { KeyType } from "./keyboardLayout";
import { KeyboardKey } from "./KeyboardKey";
import styles from "./VirtualKeyboard.module.css";

interface KeyboardRowProps {
  keys: KeyType[];
  activeKey: string | null;
  activeShiftKey: boolean;
}

export function KeyboardRow({
  keys,
  activeKey,
  activeShiftKey,
}: KeyboardRowProps) {
  return (
    <div className={styles.keyboardRow}>
      {keys.map((k, index) => (
        <KeyboardKey
          key={`${index}-${k.key}`}
          label={k.label}
          width={k.width}
          isActive={k.isSpecial !== true && k.key === activeKey}
          isShiftActive={
            k.isSpecial === true && k.label === "Shift" && activeShiftKey
          }
          isSpecial={k.isSpecial === true}
        />
      ))}
    </div>
  );
}
