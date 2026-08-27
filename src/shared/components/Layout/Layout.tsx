import type { ReactNode } from "react";
import { ThemeToggle } from "@/features/theme/components/ThemeToggle/ThemeToggle";
import styles from "./Layout.module.css";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.logo}>ReactTyper</span>
        <ThemeToggle />
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        ReactTyper &mdash; Built with React &amp; TypeScript
      </footer>
    </div>
  );
}
