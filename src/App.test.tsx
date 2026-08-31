import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/app/rootReducer";
import { startFromHome } from "@/features/typing/state/typingSlice";
import { ThemeProvider } from "@/features/theme/providers/ThemeProvider";
import { apiListWordBanks } from "@/features/typingConfig/services/wordBanksApi";
import { loadWordBankWords } from "@/features/typing/utils/wordBankLoader";
import { App } from "@/App";

vi.mock("@/features/typingConfig/services/wordBanksApi", () => ({
  apiListWordBanks: vi.fn(),
  apiGetWordBank: vi.fn(),
}));

vi.mock("@/features/typing/utils/wordBankLoader", () => ({
  loadWordBankWords: vi.fn(),
  clearWordBankCache: vi.fn(),
}));

const mockedApiListWordBanks = vi.mocked(apiListWordBanks);
const mockedLoadWordBankWords = vi.mocked(loadWordBankWords);

beforeEach(() => {
  mockedApiListWordBanks.mockReset();
  mockedLoadWordBankWords.mockReset();
  mockedApiListWordBanks.mockReturnValue(new Promise(() => {}));
  mockedLoadWordBankWords.mockResolvedValue(true);
});

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
        <MemoryRouter>
          <App />
        </MemoryRouter>
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
