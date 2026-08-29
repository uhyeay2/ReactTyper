import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/app/rootReducer";
import {
  startFromHome,
  navigateHome,
} from "@/features/typing/state/typingSlice";
import { ThemeProvider } from "@/features/theme/providers/ThemeProvider";
import { Layout } from "./Layout";

function createStore() {
  return configureStore({ reducer: rootReducer });
}

function installMatchMedia() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
    })),
  );
}

function renderLayout(store: ReturnType<typeof createStore>) {
  return render(
    <Provider store={store}>
      <ThemeProvider>
        <Layout>
          <div>Page Content</div>
        </Layout>
      </ThemeProvider>
    </Provider>,
  );
}

describe("Layout", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("renders children, theme toggle, and footer", () => {
    installMatchMedia();
    const store = createStore();
    renderLayout(store);

    expect(screen.getByText("Page Content")).toBeInTheDocument();
    expect(screen.getByText(/Built with React.*TypeScript/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ReactTyper/i })).toBeInTheDocument();
  });

  it("renders the dark mode toggle button", () => {
    installMatchMedia();
    const store = createStore();
    renderLayout(store);
    expect(screen.getByRole("button", { name: /switch to dark/i })).toBeInTheDocument();
  });

  it("navigates home when the logo is clicked from a non-home view", () => {
    installMatchMedia();
    const store = createStore();
    store.dispatch(startFromHome({ wordCount: 25 }));
    renderLayout(store);

    expect(store.getState().typing.view).toBe("test");

    fireEvent.click(screen.getByRole("button", { name: /ReactTyper/i }));

    expect(store.getState().typing.view).toBe("home");
  });

  it("does not navigate when already on the home view", () => {
    installMatchMedia();
    const store = createStore();
    store.dispatch(startFromHome({ wordCount: 25 }));
    store.dispatch(navigateHome());
    renderLayout(store);

    expect(store.getState().typing.view).toBe("home");

    fireEvent.click(screen.getByRole("button", { name: /ReactTyper/i }));

    expect(store.getState().typing.view).toBe("home");
  });
});
