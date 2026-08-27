import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/app/rootReducer";
import { useTypingTest } from "./useTypingTest";

function createTestStore() {
  return configureStore({ reducer: rootReducer });
}

function TestComponent() {
  const {
    status,
    targetText,
    typedText,
    currentIndex,
    currentWpm,
    currentAccuracy,
    timeRemaining,
    handleKeyDown,
    handleStart,
    handleReset,
  } = useTypingTest();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="target">{targetText}</span>
      <span data-testid="typed">{typedText}</span>
      <span data-testid="index">{currentIndex}</span>
      <span data-testid="wpm">{currentWpm}</span>
      <span data-testid="accuracy">{currentAccuracy}</span>
      <span data-testid="time">{timeRemaining}</span>
      <button data-testid="start" onClick={handleStart}>
        Start
      </button>
      <button data-testid="reset" onClick={handleReset}>
        Reset
      </button>
      <input
        data-testid="input"
        onKeyDown={handleKeyDown}
        aria-label="test input"
      />
    </div>
  );
}

function renderWithStore(store?: ReturnType<typeof createTestStore>) {
  const testStore = store ?? createTestStore();
  return {
    ...render(
      <Provider store={testStore}>
        <TestComponent />
      </Provider>,
    ),
    store: testStore,
  };
}

describe("useTypingTest", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in idle status", () => {
    renderWithStore();
    expect(screen.getByTestId("status")).toHaveTextContent("idle");
  });

  it("transitions to ready on first keystroke", async () => {
    renderWithStore();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "a");
    });

    expect(screen.getByTestId("status")).toHaveTextContent("ready");
    expect(screen.getByTestId("typed")).toHaveTextContent("");
    expect(screen.getByTestId("index")).toHaveTextContent("0");
  });

  it("transitions to active on second keystroke and records character", async () => {
    renderWithStore();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "ab");
    });

    expect(screen.getByTestId("status")).toHaveTextContent("active");
    expect(screen.getByTestId("typed")).toHaveTextContent("b");
    expect(screen.getByTestId("index")).toHaveTextContent("1");
  });

  it("goes to ready on handleStart", () => {
    renderWithStore();
    act(() => {
      screen.getByTestId("start").click();
    });
    expect(screen.getByTestId("status")).toHaveTextContent("ready");
  });

  it("records typed text on keystroke when active", async () => {
    renderWithStore();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "abc");
    });

    expect(screen.getByTestId("status")).toHaveTextContent("active");
    expect(screen.getByTestId("typed")).toHaveTextContent("bc");
    expect(screen.getByTestId("index")).toHaveTextContent("2");
  });

  it("handles backspace", async () => {
    renderWithStore();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "abc{Backspace}");
    });

    expect(screen.getByTestId("typed")).toHaveTextContent("b");
    expect(screen.getByTestId("index")).toHaveTextContent("1");
  });

  it("backspace when idle transitions to ready without processing", async () => {
    renderWithStore();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "{Backspace}");
    });

    expect(screen.getByTestId("status")).toHaveTextContent("ready");
    expect(screen.getByTestId("index")).toHaveTextContent("0");
  });

  it("backspace when ready does nothing", async () => {
    renderWithStore();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "a{Backspace}");
    });

    expect(screen.getByTestId("status")).toHaveTextContent("ready");
    expect(screen.getByTestId("index")).toHaveTextContent("0");
  });

  it("ignores non-printable keys when idle", async () => {
    renderWithStore();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "{Shift}");
    });

    expect(screen.getByTestId("status")).toHaveTextContent("idle");
    expect(screen.getByTestId("index")).toHaveTextContent("0");
  });

  it("resets test on reset", async () => {
    renderWithStore();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "abc");
    });

    expect(screen.getByTestId("status")).toHaveTextContent("active");

    act(() => {
      screen.getByTestId("reset").click();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("ready");
    expect(screen.getByTestId("typed")).toHaveTextContent("");
    expect(screen.getByTestId("index")).toHaveTextContent("0");
  });

  it("computes 100% accuracy for correct keystrokes", async () => {
    const store = createTestStore();
    const target = store.getState().typing.targetText ?? "";
    renderWithStore(store);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, `a${target.charAt(0)}`);
    });

    expect(screen.getByTestId("accuracy")).toHaveTextContent("100");
  });

  it("computes less than 100% accuracy for incorrect keystrokes", async () => {
    const store = createTestStore();
    const target = store.getState().typing.targetText ?? "";
    const wrongChar = target.charAt(0) === "a" ? "b" : "a";
    renderWithStore(store);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, `a${wrongChar}`);
    });

    expect(screen.getByTestId("accuracy")).not.toHaveTextContent("100");
  });
});
