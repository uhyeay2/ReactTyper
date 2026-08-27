import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { useAppDispatch } from "@/app/hooks";
import { setResolvedTheme } from "../state/themeSlice";
import type { ThemeMode, ResolvedTheme } from "../state/themeTypes";
import { ThemeContext, type ThemeContextValue } from "./ThemeContext";

type Action = { type: "SET_MODE"; payload: ThemeMode };

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveMode(mode: ThemeMode): ResolvedTheme {
  return mode === "system" ? getSystemTheme() : mode;
}

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem("reacttyper-theme");
  if (stored === "light" || stored === "dark") return stored;
  return "system";
}

function applyToDom(resolved: ResolvedTheme) {
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.style.colorScheme = resolved;
}

function themeReducer(
  state: { mode: ThemeMode },
  action: Action,
): { mode: ThemeMode } {
  switch (action.type) {
    case "SET_MODE":
      return { mode: action.payload };
    default:
      return state;
  }
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const initialMode = useMemo(() => getInitialMode(), []);
  const [state, dispatch] = useReducer(themeReducer, { mode: initialMode });
  const reduxDispatch = useAppDispatch();

  const resolved: ResolvedTheme = useMemo(
    () => resolveMode(state.mode),
    [state.mode],
  );

  useEffect(() => {
    applyToDom(resolved);
    reduxDispatch(setResolvedTheme(resolved));

    if (state.mode === "system") {
      localStorage.removeItem("reacttyper-theme");
    } else {
      localStorage.setItem("reacttyper-theme", state.mode);
    }
  }, [state.mode, resolved, reduxDispatch]);

  useEffect(() => {
    if (state.mode !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const newResolved = getSystemTheme();
      applyToDom(newResolved);
      reduxDispatch(setResolvedTheme(newResolved));
    };

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [state.mode, reduxDispatch]);

  const setMode = useCallback((mode: ThemeMode) => {
    dispatch({ type: "SET_MODE", payload: mode });
  }, []);

  const toggle = useCallback(() => {
    setMode(resolved === "dark" ? "light" : "dark");
  }, [resolved, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode: state.mode, resolved, setMode, toggle }),
    [state.mode, resolved, setMode, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
