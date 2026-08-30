import { useCallback, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  clearAuthError,
  login,
  selectAuthError,
  selectAuthRequestStatus,
} from "../../state/authSlice";
import styles from "../AuthScreen.module.css";

export function LoginScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const error = useAppSelector(selectAuthError);
  const requestStatus = useAppSelector(selectAuthRequestStatus);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const result = await dispatch(login({ username, password }));
      if (login.fulfilled.match(result)) {
        navigate("/");
      }
    },
    [dispatch, username, password, navigate],
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Sign in</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>Username</span>
          <input
            className={styles.input}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error !== null ? <p className={styles.error}>{error}</p> : null}
        <button
          type="submit"
          className={styles.submit}
          disabled={requestStatus === "loading"}
        >
          {requestStatus === "loading" ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className={styles.switch}>
        New here? <Link to="/register">Create an account</Link>
      </p>
      <button
        type="button"
        className={styles.cancel}
        onClick={() => {
          dispatch(clearAuthError());
          navigate("/");
        }}
      >
        Back to home
      </button>
    </div>
  );
}
