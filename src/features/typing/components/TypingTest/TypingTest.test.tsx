import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/app/rootReducer";
import {
  startFromHome,
  startLessonSession,
} from "@/features/typing/state/typingSlice";
import { SessionTypeValue } from "@/features/history/state/historyTypes";
import { apiGetLesson } from "@/features/lessons/services/lessonsApi";
import type { LessonDetail } from "@/features/lessons/state/lessonTypes";
import {
  ThemeContext,
  type ThemeContextValue,
} from "@/features/theme/providers/ThemeContext";
import { Layout } from "@/shared/components/Layout/Layout";
import { apiListWordBanks } from "@/features/typingConfig/services/wordBanksApi";
import { loadWordBankWords } from "@/features/typing/utils/wordBankLoader";
import { TypingTest } from "./TypingTest";

vi.mock("@/features/lessons/services/lessonsApi", () => ({
  apiGetLesson: vi.fn(),
  apiListLessons: vi.fn(),
}));

vi.mock("@/features/typingConfig/services/wordBanksApi", () => ({
  apiListWordBanks: vi.fn(),
  apiGetWordBank: vi.fn(),
}));

vi.mock("@/features/typing/utils/wordBankLoader", () => ({
  loadWordBankWords: vi.fn(),
  clearWordBankCache: vi.fn(),
}));

const apiGetLessonMock = vi.mocked(apiGetLesson);
const mockedApiListWordBanks = vi.mocked(apiListWordBanks);
const mockedLoadWordBankWords = vi.mocked(loadWordBankWords);

beforeEach(() => {
  mockedApiListWordBanks.mockReset().mockReturnValue(new Promise(() => {}));
  mockedLoadWordBankWords.mockReset().mockResolvedValue(true);
});

const MOCK_LESSON: LessonDetail = {
  slug: "lesson-a",
  title: "Lesson A",
  description: "A lesson",
  difficultyLevel: 1,
  units: [
    { order: 0, title: "Unit One", content: "first unit words here" },
    { order: 1, title: "Unit Two", content: "second unit words here" },
  ],
};

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
        <MemoryRouter>
          <TypingTest />
        </MemoryRouter>
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
          <MemoryRouter>
            <Layout>
              <TypingTest />
            </Layout>
          </MemoryRouter>
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
          <MemoryRouter>
            <Layout>
              <TypingTest />
            </Layout>
          </MemoryRouter>
        </ThemeContext.Provider>
      </Provider>,
    ),
    store,
  };
}

function renderLessonSession(
  store: ReturnType<typeof createTestStore>,
  targetText: string,
  lessonUnitOrder = 0,
) {
  apiGetLessonMock.mockReset();
  apiGetLessonMock.mockResolvedValue(MOCK_LESSON);
  store.dispatch(
    startLessonSession({
      targetText,
      sessionType: SessionTypeValue.LessonUnit,
      lessonSlug: "lesson-a",
      lessonUnitOrder,
    }),
  );
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <TypingTest />
      </MemoryRouter>
    </Provider>,
  );
}

async function completeLessonSessionViaQuit() {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const input = screen.getByLabelText("Typing input");
  await user.type(input, "fi");
  act(() => {
    screen.getByText("Quit").click();
  });
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
    expect(screen.getByText("Typing Test")).toBeInTheDocument();
    expect(screen.getByText("Press any key to start")).toBeInTheDocument();
  });

  it("hides prompt and shows display and stats bar after first keystroke", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await user.type(input, "a");

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

    await user.type(input, "ab");

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

    await user.type(input, "a");

    expect(screen.getByText("Pause")).toBeInTheDocument();
    expect(screen.getByText("Quit")).toBeInTheDocument();
    expect(screen.getByText("Reset")).toBeInTheDocument();
    expect(screen.getByText("Refresh")).toBeInTheDocument();
  });

  it("shows Pause in active state", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await user.type(input, "ab");

    expect(screen.getByText("Pause")).toBeInTheDocument();
  });

  it("shows WPM stat value during active test", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await user.type(input, "ab");

    const statsBar = screen.getByText("WPM").closest("div");
    expect(statsBar).toBeInTheDocument();
    const statValue = statsBar?.querySelector("span");
    expect(statValue).toBeInTheDocument();
  });

  it("shows a WPM loading indicator until the live window has data", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await user.type(input, "ab");

    expect(screen.getByLabelText("Calculating WPM")).toBeInTheDocument();
  });

  it("shows timer with seconds during active test", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await user.type(input, "ab");

    expect(screen.getAllByText("60s").length).toBeGreaterThanOrEqual(1);
  });

  it("shows Try Again and New Words after test completes via timer", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await user.type(input, "ab");

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText("Try Again")).toBeInTheDocument();
    expect(screen.getByText("New Words")).toBeInTheDocument();
  });

  it("returns to ready state when Try Again is clicked from results", async () => {
    const { store } = renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await user.type(input, "ab");

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    const originalTarget = store.getState().typing.targetText;

    act(() => {
      screen.getByText("Try Again").click();
    });

    expect(screen.getByText("Press any key to start")).toBeInTheDocument();
    expect(store.getState().typing.targetText).toBe(originalTarget);
  });

  it("renders typing display with target text after first keystroke", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await user.type(input, "a");

    expect(screen.getByLabelText("Typing test text")).toBeInTheDocument();
  });

  it("pauses and resumes test", async () => {
    renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await user.type(input, "ab");

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

    await user.type(input, "ab");

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

    await user.type(input, "ab");

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

    await user.type(input, "ab");

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

    await user.type(input, "ab");

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

    await user.type(input, "ab");

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
    const { store } = renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await user.type(input, "ab");

    const originalTarget = store.getState().typing.targetText;

    act(() => {
      screen.getByText("Reset").click();
    });

    expect(screen.getByText("Press any key to start")).toBeInTheDocument();
    expect(store.getState().typing.targetText).toBe(originalTarget);
  });

  it("refreshes to a new ready state when Refresh is clicked during the test", async () => {
    const { store } = renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await user.type(input, "ab");

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

    await user.type(input, "ab");

    act(() => {
      screen.getByText("Quit").click();
    });

    expect(screen.getByText("Test Complete")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("refreshes to a new ready state when New Words is clicked from results", async () => {
    const { store } = renderInTestView();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await user.type(input, "ab");

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText("New Words")).toBeInTheDocument();
    const originalTarget = store.getState().typing.targetText;

    act(() => {
      screen.getByText("New Words").click();
    });

    expect(screen.getByText("Press any key to start")).toBeInTheDocument();
    expect(store.getState().typing.targetText).not.toBe(originalTarget);
  });

  it("shows word progress when a word limit is set", async () => {
    const store = createTestStore();
    store.dispatch({ type: "typingConfig/setWordCount", payload: 25 });
    store.dispatch(startFromHome({ wordCount: 25 }));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithLayoutAndTheme(store);
    const input = screen.getByLabelText("Typing input");

    await user.type(input, "abc");

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

    await user.type(input, "/");

    expect(screen.getByText("Errors")).toBeInTheDocument();
    expect(screen.getByText(/^1\/5$/)).toBeInTheDocument();
  });

  it("hides Test Settings and shows lesson actions when a lesson completes", async () => {
    const store = createTestStore();
    renderLessonSession(store, "first unit words here", 0);

    await completeLessonSessionViaQuit();

    await waitFor(() => {
      expect(screen.getByText("Next Lesson")).toBeInTheDocument();
    });

    expect(screen.getByText("Retry")).toBeInTheDocument();
    expect(screen.getByText("Return to Lessons")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Test Settings/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Try Again")).not.toBeInTheDocument();
    expect(screen.queryByText("New Words")).not.toBeInTheDocument();
  });

  it("retries the same lesson unit from the results screen", async () => {
    const store = createTestStore();
    renderLessonSession(store, "first unit words here", 0);

    await completeLessonSessionViaQuit();

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    act(() => {
      screen.getByText("Retry").click();
    });

    expect(screen.getByText("Press any key to start")).toBeInTheDocument();
    expect(
      store.getState().typing.targetText.split(" ").sort(),
    ).toEqual("first unit words here".split(" ").sort());
    expect(store.getState().typing.sessionContext.sessionType).toBe(
      SessionTypeValue.LessonUnit,
    );
  });

  it("starts the next unit when Next Lesson is clicked", async () => {
    const store = createTestStore();
    renderLessonSession(store, "first unit words here", 0);

    await completeLessonSessionViaQuit();

    await waitFor(() => {
      expect(screen.getByText("Next Lesson")).toBeInTheDocument();
    });

    act(() => {
      screen.getByText("Next Lesson").click();
    });

    expect(
      store.getState().typing.targetText.split(" ").sort(),
    ).toEqual("second unit words here".split(" ").sort());
    expect(store.getState().typing.sessionContext.lessonUnitOrder).toBe(1);
    expect(store.getState().typing.status).toBe("ready");
    expect(screen.getByText("Press any key to start")).toBeInTheDocument();
  });

  it("omits Next Lesson when there is no next unit", async () => {
    const store = createTestStore();
    renderLessonSession(store, "second unit words here", 1);

    await completeLessonSessionViaQuit();

    await waitFor(() => {
      expect(apiGetLessonMock).toHaveBeenCalledWith("lesson-a");
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText("Retry")).toBeInTheDocument();
    expect(screen.getByText("Return to Lessons")).toBeInTheDocument();
    expect(screen.queryByText("Next Lesson")).not.toBeInTheDocument();
  });

  it("returns to lessons from the results screen", async () => {
    const store = createTestStore();
    renderLessonSession(store, "first unit words here", 0);

    await completeLessonSessionViaQuit();

    await waitFor(() => {
      expect(screen.getByText("Return to Lessons")).toBeInTheDocument();
    });

    act(() => {
      screen.getByText("Return to Lessons").click();
    });

    expect(store.getState().typing.view).toBe("home");
  });

  it("hides word/error stats and Refresh during a lesson session", async () => {
    const store = createTestStore();
    store.dispatch({ type: "typingConfig/setWordCount", payload: 25 });
    store.dispatch({ type: "typingConfig/setMaxErrors", payload: 5 });
    renderLessonSession(store, "first unit words here", 0);

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText("Typing input");

    await user.type(input, "first ");

    expect(screen.getByText("WPM")).toBeInTheDocument();
    expect(screen.getByText("Accuracy")).toBeInTheDocument();
    expect(screen.queryByText("Words")).not.toBeInTheDocument();
    expect(screen.queryByText("Errors")).not.toBeInTheDocument();
    expect(screen.queryByText("Refresh")).not.toBeInTheDocument();
  });

  it("shows the lesson and unit titles during a lesson session", async () => {
    const store = createTestStore();
    renderLessonSession(store, "first unit words here", 0);

    await waitFor(() => {
      expect(apiGetLessonMock).toHaveBeenCalledWith("lesson-a");
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.getByText("Typing Lesson: Lesson A"),
    ).toBeInTheDocument();
    expect(screen.getByText("Unit 1: Unit One")).toBeInTheDocument();
    expect(screen.queryByText("Typing Test")).not.toBeInTheDocument();
  });
});
