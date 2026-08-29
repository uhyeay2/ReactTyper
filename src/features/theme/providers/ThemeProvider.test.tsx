import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import themeReducer, {
  selectResolvedTheme,
} from "../state/themeSlice";
import { ThemeProvider } from "./ThemeProvider";
import { useTheme } from "../hooks/useTheme";
import { useThemeContext } from "./ThemeContext";

const THEME_KEY = "reacttyper-theme";

function createTestStore() {
  return configureStore({ reducer: { theme: themeReducer } });
}

function Consumer() {
  const { mode, resolved, setMode, toggle } = useTheme();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="resolved">{resolved}</span>
      <button
        onClick={() => {
          toggle();
        }}
      >
        toggle
      </button>
      <button
        onClick={() => {
          setMode("dark");
        }}
      >
        set-dark
      </button>
    </div>
  );
}

function installMatchMedia(preferDark: boolean) {
  let changeHandler: (() => void) | null = null;
  const mq = {
    matches: preferDark,
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_type: string, cb: () => void) => {
      changeHandler = cb;
    },
    removeEventListener: () => {
      changeHandler = null;
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchChange: () => {
      if (changeHandler) changeHandler();
    },
    onchange: null,
  };
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mq));
  return mq;
}

function renderProvider(
  store: ReturnType<typeof createTestStore>,
  {
    preferDark = false,
    stored,
  }: { preferDark?: boolean; stored?: string | null } = {},
) {
  installMatchMedia(preferDark);
  if (stored === null || stored === undefined) {
    localStorage.removeItem(THEME_KEY);
  } else {
    localStorage.setItem(THEME_KEY, stored);
  }
  return render(
    <Provider store={store}>
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    </Provider>,
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("defaults to system mode and applies the resolved theme", () => {
    const store = createTestStore();
    renderProvider(store, { preferDark: false });

    expect(screen.getByTestId("mode")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(selectResolvedTheme(store.getState())).toBe("light");
  });

  it("uses system preference dark when mode is system", () => {
    const store = createTestStore();
    renderProvider(store, { preferDark: true });

    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("reads a stored light theme", () => {
    const store = createTestStore();
    renderProvider(store, { stored: "light" });

    expect(screen.getByTestId("mode")).toHaveTextContent("light");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(localStorage.getItem(THEME_KEY)).toBe("light");
  });

  it("reads a stored dark theme", () => {
    const store = createTestStore();
    renderProvider(store, { stored: "dark" });

    expect(screen.getByTestId("mode")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
  });

  it("toggles between resolved themes", () => {
    const store = createTestStore();
    renderProvider(store, { preferDark: false });

    fireEvent.click(screen.getByText("toggle"));

    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
  });

  it("setMode switches to an explicit theme and persists it", () => {
    const store = createTestStore();
    renderProvider(store, { preferDark: false });

    fireEvent.click(screen.getByText("set-dark"));

    expect(screen.getByTestId("mode")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
  });

  it("persists toggled theme changes to localStorage", () => {
    const store = createTestStore();
    renderProvider(store, { stored: "light" });

    fireEvent.click(screen.getByText("toggle"));

    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
  });

  it("reacts to system preference changes while in system mode", () => {
    const store = createTestStore();
    const mq = installMatchMedia(false);
    localStorage.removeItem(THEME_KEY);
    render(
      <Provider store={store}>
        <ThemeProvider>
          <Consumer />
        </ThemeProvider>
      </Provider>,
    );

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    mq.matches = true;
    act(() => {
      mq.dispatchChange();
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(selectResolvedTheme(store.getState())).toBe("dark");
  });

  it("throws when useThemeContext is used outside a provider", () => {
    function BadConsumer() {
      useThemeContext();
      return null;
    }

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<BadConsumer />)).toThrow(
      "useThemeContext must be used within a ThemeProvider",
    );
    spy.mockRestore();
  });
});
