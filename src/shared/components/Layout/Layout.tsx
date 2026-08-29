import type { ReactNode } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  navigateHome,
  selectView,
} from "@/features/typing/state/typingSlice";
import { ThemeToggle } from "@/features/theme/components/ThemeToggle/ThemeToggle";
import styles from "./Layout.module.css";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const dispatch = useAppDispatch();
  const view = useAppSelector(selectView);

  const handleLogoClick = () => {
    if (view === "home") return;
    dispatch(navigateHome());
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.logo}
          onClick={handleLogoClick}
        >
          ReactTyper
        </button>
        <ThemeToggle />
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        ReactTyper &mdash; Built with React &amp; TypeScript
      </footer>
    </div>
  );
}
