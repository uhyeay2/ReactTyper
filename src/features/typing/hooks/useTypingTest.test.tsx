import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/app/rootReducer";
import { startFromHome } from "@/features/typing/state/typingSlice";
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
    liveWpm,
    timeRemaining,
    handleKeyDown,
    handleStart,
    handleReset,
    handleQuit,
  } = useTypingTest();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="target">{targetText}</span>
      <span data-testid="typed">{typedText}</span>
      <span data-testid="index">{currentIndex}</span>
      <span data-testid="wpm">{currentWpm}</span>
      <span data-testid="accuracy">{currentAccuracy}</span>
      <span data-testid="live-wpm">{liveWpm}</span>
      <span data-testid="time">{timeRemaining ?? "unlimited"}</span>
      <button data-testid="start" onClick={handleStart}>
        Start
      </button>
      <button data-testid="reset" onClick={handleReset}>
        Reset
      </button>
      <button data-testid="quit" onClick={handleQuit}>
        Quit
      </button>
      <input
        data-testid="input"
        onKeyDown={handleKeyDown}
        aria-label="test input"
      />
    </div>
  );
}

function renderInTestView(store?: ReturnType<typeof createTestStore>) {
  const testStore = store ?? createTestStore();
  testStore.dispatch(startFromHome({ wordCount: 50 }));
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

  it("starts in ready status", () => {
    renderInTestView();
    expect(screen.getByTestId("status")).toHaveTextContent("ready");
  });

  it("transitions to active on first keystroke and records character", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "a");
    });

    expect(screen.getByTestId("status")).toHaveTextContent("active");
    expect(screen.getByTestId("typed")).toHaveTextContent("a");
    expect(screen.getByTestId("index")).toHaveTextContent("1");
  });

  it("records typed text on second keystroke when active", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "abc");
    });

    expect(screen.getByTestId("status")).toHaveTextContent("active");
    expect(screen.getByTestId("typed")).toHaveTextContent("abc");
    expect(screen.getByTestId("index")).toHaveTextContent("3");
  });

  it("goes to active on handleStart", () => {
    renderInTestView();
    act(() => {
      screen.getByTestId("start").click();
    });
    expect(screen.getByTestId("status")).toHaveTextContent("active");
  });

  it("records typed text on keystroke when active", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "abc");
    });

    expect(screen.getByTestId("status")).toHaveTextContent("active");
    expect(screen.getByTestId("typed")).toHaveTextContent("abc");
    expect(screen.getByTestId("index")).toHaveTextContent("3");
  });

  it("handles backspace", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "abc{Backspace}");
    });

    expect(screen.getByTestId("typed")).toHaveTextContent("ab");
    expect(screen.getByTestId("index")).toHaveTextContent("2");
  });

  it("backspace when ready does nothing", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "{Backspace}");
    });

    expect(screen.getByTestId("status")).toHaveTextContent("ready");
    expect(screen.getByTestId("index")).toHaveTextContent("0");
  });

  it("backspace when ready does nothing", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "{Backspace}");
    });

    expect(screen.getByTestId("status")).toHaveTextContent("ready");
    expect(screen.getByTestId("index")).toHaveTextContent("0");
  });

  it("ignores non-printable keys when ready", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "{Shift}");
    });

    expect(screen.getByTestId("status")).toHaveTextContent("ready");
    expect(screen.getByTestId("index")).toHaveTextContent("0");
  });

  it("resets test on reset", async () => {
    renderInTestView();
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
    renderInTestView(store);
    const target = store.getState().typing.targetText;
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, `${target.charAt(0)}${target.charAt(1)}`);
    });

    expect(screen.getByTestId("accuracy")).toHaveTextContent("100");
  });

  it("computes less than 100% accuracy for incorrect keystrokes", () => {
    const store = createTestStore();
    renderInTestView(store);
    const target = store.getState().typing.targetText;
    const first = target.charAt(0);
    const secondTarget = target.charAt(1);
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const wrong =
      [...alphabet].find((c) => c !== secondTarget && c !== first) ?? "z";
    const input = screen.getByTestId("input");

    act(() => {
      fireEvent.keyDown(input, { key: first });
      fireEvent.keyDown(input, { key: wrong });
    });

    expect(screen.getByTestId("accuracy")).not.toHaveTextContent("100");
  });

  it("shows unlimited for null duration", () => {
    const store = createTestStore();
    store.dispatch({
      type: "typingConfig/setZenMode",
      payload: true,
    });
    store.dispatch(startFromHome({ wordCount: 50 }));

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    expect(screen.getByTestId("time")).toHaveTextContent("unlimited");
  });

  it("completes when the target word count is reached", async () => {
    const store = createTestStore();
    store.dispatch({ type: "typingConfig/setWordCount", payload: 2 });
    store.dispatch({ type: "typingConfig/setDuration", payload: null });
    store.dispatch({ type: "typingConfig/setMaxErrors", payload: null });
    renderInTestView(store);

    const words = store.getState().typing.targetText.split(" ");
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, `${words[0]} ${words[1]} `);
    });

    expect(screen.getByTestId("status")).toHaveTextContent("completed");
  });

  it("completes when the max error count is reached", async () => {
    const store = createTestStore();
    store.dispatch({ type: "typingConfig/setMaxErrors", payload: 1 });
    store.dispatch({ type: "typingConfig/setDuration", payload: null });
    store.dispatch({ type: "typingConfig/setWordCount", payload: null });
    renderInTestView(store);

    const target = store.getState().typing.targetText;
    const second = target.charAt(1);
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const wrong = [...alphabet].find((c) => c !== second) ?? "z";
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, `${target.charAt(0)}${wrong}${target.charAt(2)}`);
    });

    expect(screen.getByTestId("status")).toHaveTextContent("completed");
  });

  it("completes the test when Quit is clicked", async () => {
    const store = createTestStore();
    renderInTestView(store);
    const target = store.getState().typing.targetText;
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, `${target.charAt(0)}${target.charAt(1)}`);
    });

    act(() => {
      screen.getByTestId("quit").click();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("completed");
  });

  it("counts incorrect characters when quitting early", async () => {
    const store = createTestStore();
    renderInTestView(store);
    const target = store.getState().typing.targetText;
    const second = target.charAt(1);
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const wrong = [...alphabet].find((c) => c !== second) ?? "z";
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, `${target.charAt(0)}${wrong}`);
    });

    act(() => {
      screen.getByTestId("quit").click();
    });

    expect(store.getState().typing.status).toBe("completed");
    expect(store.getState().typing.results).not.toBeNull();
  });

  it("completes when every target character is typed", async () => {
    const store = createTestStore();
    store.dispatch({ type: "typingConfig/setWordCount", payload: 50 });
    store.dispatch(startFromHome({ wordCount: 1 }));

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    const target = store.getState().typing.targetText;
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, target);
    });

    expect(screen.getByTestId("status")).toHaveTextContent("completed");
  });

  it("records a keystroke log with timestamps during the test", async () => {
    const store = createTestStore();
    renderInTestView(store);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "abc");
    });

    const keystrokes = store.getState().typing.keystrokes;
    expect(keystrokes).toHaveLength(3);
    expect(keystrokes[0]).toMatchObject({
      charIndex: 0,
      timestamp: expect.any(Number),
    });
    expect(keystrokes[1]).toMatchObject({
      charIndex: 1,
      timestamp: expect.any(Number),
    });
  });

  it("removes keystrokes from the log when a character is undone", async () => {
    const store = createTestStore();
    renderInTestView(store);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "ab{Backspace}");
    });

    const keystrokes = store.getState().typing.keystrokes;
    expect(keystrokes).toHaveLength(1);
    expect(keystrokes[0]).toMatchObject({ charIndex: 0 });
  });

  it("keeps the live WPM readout at zero until the window is satisfied", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, "abc");
    });

    expect(screen.getByTestId("live-wpm")).toHaveTextContent("0");
  });

  it("builds the WPM timeline when the test completes", async () => {
    const store = createTestStore();
    store.dispatch({ type: "typingConfig/setWordCount", payload: 2 });
    store.dispatch({ type: "typingConfig/setDuration", payload: null });
    store.dispatch({ type: "typingConfig/setMaxErrors", payload: null });
    renderInTestView(store);

    const words = store.getState().typing.targetText.split(" ");
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
      delay: 250,
    });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, `${words[0]} ${words[1]} `);
    });

    expect(screen.getByTestId("status")).toHaveTextContent("completed");
    const state = store.getState().typing;
    expect(state.wpmTimeline.length).toBeGreaterThan(0);
    expect(state.results?.wordStates.length).toBeGreaterThan(0);
  });

  it("keeps word states aligned with the completed graph timeline", async () => {
    const store = createTestStore();
    store.dispatch({ type: "typingConfig/setWordCount", payload: 2 });
    store.dispatch({ type: "typingConfig/setDuration", payload: null });
    store.dispatch({ type: "typingConfig/setMaxErrors", payload: null });
    renderInTestView(store);

    const words = store.getState().typing.targetText.split(" ");
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
      delay: 250,
    });
    const input = screen.getByTestId("input");

    await act(async () => {
      await user.type(input, `${words[0]} ${words[1]} `);
    });

    const { wpmTimeline, results } = store.getState().typing;
    expect(wpmTimeline.length).toBeGreaterThan(0);
    const states = results?.wordStates ?? [];
    expect(states.length).toBeGreaterThan(0);
    for (const state of states) {
      const point = wpmTimeline.find((p) => p.second === state.second);
      expect(point).toBeDefined();
      expect(state.wpm).toBe(point!.wpm);
    }
  });
});
