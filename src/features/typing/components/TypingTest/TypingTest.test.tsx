import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/app/rootReducer";
import { TypingTest } from "./TypingTest";

function createTestStore() {
  return configureStore({ reducer: rootReducer });
}

function renderWithStore(store?: ReturnType<typeof createTestStore>) {
  const testStore = store ?? createTestStore();
  return {
    ...render(
      <Provider store={testStore}>
        <TypingTest />
      </Provider>,
    ),
    store: testStore,
  };
}

describe("TypingTest", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders idle state with prompt text", () => {
    renderWithStore();
    expect(screen.getByText("Type Test")).toBeInTheDocument();
    expect(screen.getByText(/Click here or start typing/)).toBeInTheDocument();
  });

  it("shows display and stats bar after first keystroke", async () => {
    renderWithStore();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "a");
    });

    expect(screen.queryByText(/Click here or start typing/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Typing test text")).toBeInTheDocument();
    expect(screen.getByText("WPM")).toBeInTheDocument();
  });

  it("hides prompt and shows stats bar after second keystroke", async () => {
    renderWithStore();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    expect(screen.queryByText(/Press any key to start/)).not.toBeInTheDocument();
    expect(screen.getByText("WPM")).toBeInTheDocument();
    expect(screen.getByText("Accuracy")).toBeInTheDocument();
  });

  it("shows all control buttons in active state", async () => {
    renderWithStore();
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
    renderWithStore();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    expect(screen.getByText("Pause")).toBeInTheDocument();
  });

  it("shows WPM stat value during active test", async () => {
    renderWithStore();
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

  it("shows timer with seconds during active test", async () => {
    renderWithStore();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "ab");
    });

    expect(screen.getByText("60s")).toBeInTheDocument();
  });

  it("shows Try Again and New Words after test completes via timer", async () => {
    renderWithStore();
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
    renderWithStore();
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
    renderWithStore();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await act(async () => {
      await user.type(input, "a");
    });

    expect(screen.getByLabelText("Typing test text")).toBeInTheDocument();
  });

  it("pauses and resumes test", async () => {
    renderWithStore();
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
});
