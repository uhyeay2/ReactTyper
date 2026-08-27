import { useThemeContext } from "../../providers/ThemeContext";
import styles from "./ThemeToggle.module.css";

export function ThemeToggle() {
  const { resolved, toggle } = useThemeContext();
  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
    >
      {isDark ? "☀️" : "🌙"} <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
