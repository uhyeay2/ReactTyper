import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { navigateHome } from "@/features/typing/state/typingSlice";
import {
  logout,
  selectAuthStatus,
  selectAuthUser,
  selectIsAdmin,
} from "@/features/auth/state/authSlice";
import { ThemeToggle } from "@/features/theme/components/ThemeToggle/ThemeToggle";
import styles from "./Layout.module.css";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authStatus = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectAuthUser);
  const isAdmin = useAppSelector(selectIsAdmin);

  const handleLogoClick = () => {
    dispatch(navigateHome());
    navigate("/");
  };

  const handleLogout = () => {
    void dispatch(logout());
    navigate("/");
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

        <nav className={styles.nav}>
          <Link className={styles.navLink} to="/lessons">
            Lessons
          </Link>
          {authStatus === "authenticated" ? (
            <Link className={styles.navLink} to="/history">
              History
            </Link>
          ) : null}
          {isAdmin ? (
            <Link className={styles.navLink} to="/admin/lessons">
              Admin
            </Link>
          ) : null}
        </nav>

        <div className={styles.actions}>
          {authStatus === "authenticated" && user !== null ? (
            <>
              <span className={styles.user}>{user.username}</span>
              <button
                type="button"
                className={styles.userBtn}
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className={styles.userBtn} to="/login">
                Login
              </Link>
              <Link className={styles.userBtn} to="/register">
                Register
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
