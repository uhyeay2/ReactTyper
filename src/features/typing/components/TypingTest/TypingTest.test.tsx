import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/app/rootReducer";
import { startFromHome } from "@/features/typing/state/typingSlice";
import {
  ThemeContext,
  type ThemeContextValue,
} from "@/features/theme/providers/ThemeContext";
import { Layout } from "@/shared/components/Layout/Layout";
import { TypingTest } from "./TypingTest";

function createTestStore() {
  return configureStore({ reducer: rootReducer });
}

const mockThemeContext: ThemeContextValue = {
  mode: "system",
  resolved: "light",
  setMode: vi.fn(),
  toggle: vi.fn(),
};

function renderInTestView(store?: ReturnType<typeof createTestStore>) {
  const testStore = store ?? createTestStore();
  testStore.dispatch(startFromHome({ wordCount: 50 }));
  return {
    ...render(
      <Provider store={testStore}>
        <TypingTest />
      </Provider>,
    ),
    store: testStore,
  };
}

function renderInTestViewWithLayout(
  store?: ReturnType<typeof createTestStore>,
) {
  const testStore = store ?? createTestStore();
  testStore.dispatch(startFromHome({ wordCount: 50 }));
  return {
    ...render(
      <Provider store={testStore}>
        <ThemeContext.Provider value={mockThemeContext}>
          <Layout>
            <TypingTest />
          </Layout>
        </ThemeContext.Provider>
      </Provider>,
    ),
    store: testStore,
  };
}

function renderWithLayoutAndTheme(store: ReturnType<typeof createTestStore>) {
  return {
    ...render(
      <Provider store={store}>
        <ThemeContext.Provider value={mockThemeContext}>
          <Layout>
            <TypingTest />
          </Layout>
        </ThemeContext.Provider>
      </Provider>,
    ),
    store,
  };
}

describe("TypingTest", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it("renders ready state with prompt text", () => {
    renderInTestView();
    expect(screen.getByText("Type Test")).toBeInTheDocument();
    expect(screen.getByText("Press any key to start")).toBeInTheDocument();
  });

  it("hides prompt and shows display and stats bar after first keystroke", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "a");
    });

    expect(
      screen.queryByText("Press any key to start"),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Typing test text")).toBeInTheDocument();
    expect(screen.getByText("WPM")).toBeInTheDocument();
  });

  it("shows stats bar after second keystroke", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    expect(
      screen.queryByText("Press any key to start"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("WPM")).toBeInTheDocument();
    expect(screen.getByText("Accuracy")).toBeInTheDocument();
  });

  it("shows all control buttons in active state", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "a");
    });

    expect(screen.getByText("Pause")).toBeInTheDocument();
    expect(screen.getByText("Quit")).toBeInTheDocument();
    expect(screen.getByText("Reset")).toBeInTheDocument();
    expect(screen.getByText("Refresh")).toBeInTheDocument();
  });

  it("shows Pause in active state", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    expect(screen.getByText("Pause")).toBeInTheDocument();
  });

  it("shows WPM stat value during active test", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    const statsBar = screen.getByText("WPM").closest("div");
    expect(statsBar).toBeInTheDocument();
    const statValue = statsBar?.querySelector("span");
    expect(statValue).toBeInTheDocument();
  });

  it("shows a WPM loading indicator until the live window has data", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    expect(screen.getByLabelText("Calculating WPM")).toBeInTheDocument();
  });

  it("shows timer with seconds during active test", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    expect(screen.getAllByText("60s").length).toBeGreaterThanOrEqual(1);
  });

  it("shows Try Again and New Words after test completes via timer", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText("Try Again")).toBeInTheDocument();
    expect(screen.getByText("New Words")).toBeInTheDocument();
  });

  it("returns to ready state when Try Again is clicked from results", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    act(() => {
      screen.getByText("Try Again").click();
    });

    expect(screen.getByText("Press any key to start")).toBeInTheDocument();
  });

  it("renders typing display with target text after first keystroke", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "a");
    });

    expect(screen.getByLabelText("Typing test text")).toBeInTheDocument();
  });

  it("pauses and resumes test", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    act(() => {
      screen.getByText("Pause").click();
    });

    expect(screen.getByText("Resume")).toBeInTheDocument();

    act(() => {
      screen.getByText("Resume").click();
    });

    expect(screen.getByText("Pause")).toBeInTheDocument();
  });

  it("shows Test Settings collapsed by default on the results screen", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    const settingsButton = screen.getByRole("button", {
      name: /Test Settings/,
    });
    expect(settingsButton).toBeInTheDocument();
    expect(settingsButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Zen Mode")).not.toBeInTheDocument();
  });

  it("renders Test Settings and actions above the results", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    const settingsButton = screen.getByRole("button", {
      name: /Test Settings/,
    });
    const tryAgain = screen.getByText("Try Again");
    const newWords = screen.getByText("New Words");
    const heading = screen.getByText("Test Complete");

    const isAbove = (a: HTMLElement, b: HTMLElement): boolean =>
      (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

    expect(isAbove(settingsButton, heading)).toBe(true);
    expect(isAbove(tryAgain, heading)).toBe(true);
    expect(isAbove(newWords, heading)).toBe(true);
  });

  it("expands Test Settings to reveal the config options", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Test Settings/ }),
    );

    expect(screen.getByText("Zen Mode")).toBeInTheDocument();
  });

  it("shows the selected settings summary next to Test Settings", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    const settingsButton = screen.getByRole("button", {
      name: /Test Settings/,
    });
    expect(settingsButton).toHaveTextContent("1m Time Limit");
  });

  it("shows the zen mode summary next to Test Settings", async () => {
    const store = createTestStore();
    store.dispatch({ type: "typingConfig/setZenMode", payload: true });
    renderInTestView(store);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    act(() => {
      fireEvent.click(screen.getByText("Quit"));
    });

    const settingsButton = screen.getByRole("button", {
      name: /Test Settings/,
    });
    expect(settingsButton).toHaveTextContent("Zen Mode");
  });

  it("navigates home when logo is clicked", async () => {
    const { store } = renderInTestViewWithLayout();
    const user = userEvent.setup();

    const logo = screen.getByRole("button", { name: "ReactTyper" });
    await user.click(logo);

    expect(store.getState().typing.view).toBe("home");
  });

  it("returns to ready state when Reset is clicked during the test", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    act(() => {
      screen.getByText("Reset").click();
    });

    expect(screen.getByText("Press any key to start")).toBeInTheDocument();
  });

  it("refreshes to a new ready state when Refresh is clicked during the test", async () => {
    const { store } = renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    const originalTarget = store.getState().typing.targetText;

    act(() => {
      screen.getByText("Refresh").click();
    });

    expect(screen.getByText("Press any key to start")).toBeInTheDocument();
    expect(store.getState().typing.targetText).not.toBe(originalTarget);
  });

  it("shows results when Quit is clicked during the test", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    act(() => {
      screen.getByText("Quit").click();
    });

    expect(screen.getByText("Test Complete")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("refreshes to a new ready state when New Words is clicked from results", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText("New Words")).toBeInTheDocument();

    act(() => {
      screen.getByText("New Words").click();
    });

    expect(screen.getByText("Press any key to start")).toBeInTheDocument();
  });

  it("shows word progress when a word limit is set", async () => {
    const store = createTestStore();
    store.dispatch({ type: "typingConfig/setWordCount", payload: 25 });
    store.dispatch(startFromHome({ wordCount: 25 }));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithLayoutAndTheme(store);
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "abc");
    });

    expect(screen.getByText("Words")).toBeInTheDocument();
    expect(screen.getAllByText(/^0\/25$/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows error progress when a max errors limit is set", async () => {
    const store = createTestStore();
    store.dispatch({ type: "typingConfig/setMaxErrors", payload: 5 });
    store.dispatch(startFromHome({ wordCount: 50 }));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithLayoutAndTheme(store);
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "/");
    });

    expect(screen.getByText("Errors")).toBeInTheDocument();
    expect(screen.getByText(/^1\/5$/)).toBeInTheDocument();
  });
});
