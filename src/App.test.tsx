import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/app/rootReducer";
import { startFromHome } from "@/features/typing/state/typingSlice";
import { ThemeProvider } from "@/features/theme/providers/ThemeProvider";
import { App } from "@/App";

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

function renderApp(store: ReturnType<typeof createStore>) {
  return render(
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>,
  );
}

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("renders the home screen by default", () => {
    installMatchMedia();
    renderApp(createStore());
    expect(
      screen.getByText("Test your typing speed and accuracy"),
    ).toBeInTheDocument();
  });

  it("renders the typing test when the test view is active", () => {
    installMatchMedia();
    const store = createStore();
    store.dispatch(startFromHome({ wordCount: 25 }));
    renderApp(store);
    expect(screen.getByText("Press any key to start")).toBeInTheDocument();
  });
});
