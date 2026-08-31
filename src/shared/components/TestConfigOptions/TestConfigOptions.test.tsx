import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/app/rootReducer";
import { apiListWordBanks } from "@/features/typingConfig/services/wordBanksApi";
import { loadWordBankWords } from "@/features/typing/utils/wordBankLoader";
import * as wordList from "@/features/typing/utils/wordList";
import { TestConfigOptions } from "./TestConfigOptions";

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
const resetActiveWordPoolSpy = vi.spyOn(wordList, "resetActiveWordPool");

const WORD_BANKS = [
  {
    slug: "english-top-200",
    name: "English \u2014 200 Most Common",
    description: "Top 200 words",
    kind: "Frequency",
    wordCount: 200,
  },
  {
    slug: "english-top-1000",
    name: "English Top 1000",
    description: "Top 1000 words",
    kind: "Frequency",
    wordCount: 1000,
  },
];

function createTestStore() {
  return configureStore({ reducer: rootReducer });
}

function renderWithStore(store?: ReturnType<typeof createTestStore>) {
  const testStore = store ?? createTestStore();
  return {
    ...render(
      <Provider store={testStore}>
        <TestConfigOptions />
      </Provider>,
    ),
    store: testStore,
  };
}

describe("TestConfigOptions", () => {
  beforeEach(() => {
    mockedApiListWordBanks.mockImplementation(() => new Promise(() => {}));
    mockedLoadWordBankWords.mockResolvedValue(true);
    resetActiveWordPoolSpy.mockClear();
  });

  it("renders all section labels", () => {
    renderWithStore();
    expect(screen.getByText("Time Limit")).toBeInTheDocument();
    expect(screen.getByText("Word Limit")).toBeInTheDocument();
    expect(screen.getByText("Max Errors")).toBeInTheDocument();
    expect(screen.getByText("Zen Mode")).toBeInTheDocument();
    expect(screen.getByLabelText("Search word banks")).toBeInTheDocument();
  });

  it("renders time preset buttons", () => {
    renderWithStore();
    expect(screen.getByText("30s")).toBeInTheDocument();
    expect(screen.getByText("1m")).toBeInTheDocument();
    expect(screen.getByText("5m")).toBeInTheDocument();
    expect(screen.getByText("15m")).toBeInTheDocument();
    expect(screen.getAllByText("None").length).toBe(3);
  });

  it("renders word count preset buttons", () => {
    renderWithStore();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders max error preset buttons", () => {
    renderWithStore();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("dispatches setDuration when time preset is clicked", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();

    await user.click(screen.getByText("30s"));

    expect(store.getState().typingConfig.duration).toBe(30);
  });

  it("dispatches setWordCount when word preset is clicked", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();

    await user.click(screen.getByText("25"));

    expect(store.getState().typingConfig.wordCount).toBe(25);
  });

  it("dispatches setMaxErrors when error preset is clicked", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();

    await user.click(screen.getByText("5"));

    expect(store.getState().typingConfig.maxErrors).toBe(5);
  });

  it("dispatches setZenMode when Zen Mode is clicked", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();

    await user.click(screen.getByText("Zen Mode"));

    const state = store.getState().typingConfig;
    expect(state.isZenMode).toBe(true);
    expect(state.duration).toBeNull();
    expect(state.wordCount).toBeNull();
    expect(state.maxErrors).toBeNull();
  });

  it("selecting all None options stays selected and also enables Zen Mode", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();

    await user.click(screen.getAllByText("None")[0]!);
    await user.click(screen.getAllByText("None")[1]!);
    await user.click(screen.getAllByText("None")[2]!);

    const state = store.getState().typingConfig;
    expect(state.isZenMode).toBe(true);
    expect(state.duration).toBeNull();
    expect(state.wordCount).toBeNull();
    expect(state.maxErrors).toBeNull();

    for (const none of screen.getAllByText("None")) {
      expect(none.className).toContain("active");
    }
    expect(screen.getByText("Zen Mode").className).toContain("active");
  });

  it("selecting Zen Mode keeps all None options selected", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();

    await user.click(screen.getByText("Zen Mode"));

    const state = store.getState().typingConfig;
    expect(state.isZenMode).toBe(true);
    expect(state.duration).toBeNull();
    expect(state.wordCount).toBeNull();
    expect(state.maxErrors).toBeNull();

    for (const none of screen.getAllByText("None")) {
      expect(none.className).toContain("active");
    }
    expect(screen.getByText("Zen Mode").className).toContain("active");
  });

  it("selecting Zen Mode again while already in Zen Mode is a no-op", async () => {
    const store = createTestStore();
    store.dispatch({ type: "typingConfig/setZenMode", payload: true });
    renderWithStore(store);
    const user = userEvent.setup();

    const stateBefore = store.getState().typingConfig;
    await user.click(screen.getByText("Zen Mode"));
    const stateAfter = store.getState().typingConfig;

    expect(stateAfter.isZenMode).toBe(true);
    expect(stateAfter.duration).toBeNull();
    expect(stateAfter.wordCount).toBeNull();
    expect(stateAfter.maxErrors).toBeNull();
    expect(stateAfter).toEqual(stateBefore);

    expect(screen.getByText("Zen Mode").className).toContain("active");
    for (const none of screen.getAllByText("None")) {
      expect(none.className).toContain("active");
    }
  });

  it("handles custom time input in mm:ss format", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();
    const input = screen.getByLabelText("Custom time (minutes:seconds)");

    await user.type(input, "2:30");
    await user.tab();

    expect(store.getState().typingConfig.duration).toBe(150);
  });

  it("handles custom time input in seconds only", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();
    const input = screen.getByLabelText("Custom time (minutes:seconds)");

    await user.type(input, "90");
    await user.tab();

    expect(store.getState().typingConfig.duration).toBe(90);
  });

  it("handles custom word count input", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();
    const input = screen.getByLabelText("Custom word count");

    await user.type(input, "75");
    await user.tab();

    expect(store.getState().typingConfig.wordCount).toBe(75);
  });

  it("handles custom max errors input", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();
    const input = screen.getByLabelText("Custom max errors");

    await user.type(input, "7");
    await user.tab();

    expect(store.getState().typingConfig.maxErrors).toBe(7);
  });

  it("shows 1m as active by default", () => {
    renderWithStore();
    const btn = screen.getByText("1m");
    expect(btn.className).toContain("active");
  });

  it("highlights selected time preset", async () => {
    renderWithStore();
    const user = userEvent.setup();

    await user.click(screen.getByText("30s"));

    expect(screen.getByText("30s").className).toContain("active");
    expect(screen.getByText("1m").className).not.toContain("active");
  });

  it("unhighlight zen mode when preset is clicked", async () => {
    const store = createTestStore();
    store.dispatch({
      type: "typingConfig/setZenMode",
      payload: true,
    });
    renderWithStore(store);
    const user = userEvent.setup();

    await user.click(screen.getByText("30s"));

    const state = store.getState().typingConfig;
    expect(state.isZenMode).toBe(false);
    expect(state.duration).toBe(30);
  });

  it("None button clears the word count", async () => {
    const { store } = renderWithStore();
    act(() => {
      store.dispatch({ type: "typingConfig/setWordCount", payload: 25 });
    });
    const user = userEvent.setup();

    await user.click(screen.getAllByText("None")[1]!);

    expect(store.getState().typingConfig.wordCount).toBeNull();
  });

  it("None button clears the max errors", async () => {
    const { store } = renderWithStore();
    act(() => {
      store.dispatch({ type: "typingConfig/setMaxErrors", payload: 3 });
    });
    const user = userEvent.setup();

    await user.click(screen.getAllByText("None")[2]!);

    expect(store.getState().typingConfig.maxErrors).toBeNull();
  });

  it("None button clears the duration", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();

    await user.click(screen.getAllByText("None")[0]!);

    expect(store.getState().typingConfig.duration).toBeNull();
  });

  it("does not dispatch on blur when custom word count is empty", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();
    const input = screen.getByLabelText("Custom word count");

    await user.click(input);
    await user.tab();

    expect(store.getState().typingConfig.wordCount).toBeNull();
  });

  it("normalizes a valid custom word count on blur", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();
    const input = screen.getByLabelText("Custom word count");

    await user.type(input, "042");
    await user.tab();

    expect(store.getState().typingConfig.wordCount).toBe(42);
    expect(input).toHaveValue("42");
  });

  it("commits custom word count and max errors on Enter", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();
    const wordInput = screen.getByLabelText("Custom word count");
    const errorsInput = screen.getByLabelText("Custom max errors");

    await user.type(wordInput, "88{enter}");
    await user.type(errorsInput, "9{enter}");

    expect(store.getState().typingConfig.wordCount).toBe(88);
    expect(store.getState().typingConfig.maxErrors).toBe(9);
  });

  it("clears an invalid zero word count on blur", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();
    const input = screen.getByLabelText("Custom word count");

    await user.type(input, "0");
    await user.tab();

    expect(store.getState().typingConfig.wordCount).toBeNull();
    expect(input).toHaveValue("");
  });

  it("clears an invalid zero max error count on blur", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();
    const input = screen.getByLabelText("Custom max errors");

    await user.type(input, "0");
    await user.tab();

    expect(store.getState().typingConfig.maxErrors).toBeNull();
    expect(input).toHaveValue("");
  });

  it("clears an invalid custom time on blur", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();
    const input = screen.getByLabelText("Custom time (minutes:seconds)");

    await user.type(input, "0");
    await user.tab();

    expect(store.getState().typingConfig.duration).toBe(60);
    expect(input).toHaveValue("");
  });

  it("commits custom time on Enter", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();
    const input = screen.getByLabelText("Custom time (minutes:seconds)");

    await user.type(input, "90{enter}");

    expect(store.getState().typingConfig.duration).toBe(90);
  });

  it("loads word banks and lets the user select one", async () => {
    mockedApiListWordBanks.mockResolvedValue(WORD_BANKS);
    const { store } = renderWithStore();
    const user = userEvent.setup();
    const search = screen.getByLabelText("Search word banks");

    await user.click(search);

    const option = await screen.findByRole("button", {
      name: "English \u2014 200 Most Common",
    });
    await user.click(option);

    expect(store.getState().typingConfig.wordBankSlug).toBe("english-top-200");
    expect(mockedLoadWordBankWords).toHaveBeenCalledWith("english-top-200");
    expect(search).toHaveValue("English \u2014 200 Most Common");
  });

  it("filters word banks by search text", async () => {
    mockedApiListWordBanks.mockResolvedValue(WORD_BANKS);
    renderWithStore();
    const user = userEvent.setup();
    const search = screen.getByLabelText("Search word banks");

    await user.clear(search);
    await user.type(search, "1000");

    expect(
      screen.queryByRole("option", {
        name: "English \u2014 200 Most Common",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "English Top 1000" }),
    ).toBeInTheDocument();
  });

  it("shows all word banks in the dropdown when opened without typing", async () => {
    mockedApiListWordBanks.mockResolvedValue(WORD_BANKS);
    renderWithStore();
    const user = userEvent.setup();
    const search = screen.getByLabelText("Search word banks");

    await user.click(search);

    expect(
      screen.getByRole("option", { name: "English \u2014 200 Most Common" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "English Top 1000" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Default" }),
    ).not.toBeInTheDocument();
  });

  it("highlights the currently selected word bank", async () => {
    mockedApiListWordBanks.mockResolvedValue(WORD_BANKS);
    const store = createTestStore();
    store.dispatch({
      type: "typingConfig/setWordBankSlug",
      payload: "english-top-200",
    });
    renderWithStore(store);
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("Search word banks"));
    const option = await screen.findByRole("option", {
      name: "English \u2014 200 Most Common",
    });
    expect(option).toHaveAttribute("aria-selected", "true");
  });

  it("preloads words for a word bank that is already selected", async () => {
    mockedApiListWordBanks.mockResolvedValue(WORD_BANKS);
    const store = createTestStore();
    store.dispatch({
      type: "typingConfig/setWordBankSlug",
      payload: "english-top-200",
    });
    renderWithStore(store);

    await waitFor(() =>
      expect(mockedLoadWordBankWords).toHaveBeenCalledWith("english-top-200"),
    );
  });

  it("shows the default bank label instead of the placeholder before the list loads", () => {
    renderWithStore();
    const search = screen.getByLabelText("Search word banks");

    expect(search).toHaveValue("English Top 200");
  });

  it("swaps in the selected bank's real name once the list loads", async () => {
    mockedApiListWordBanks.mockResolvedValue(WORD_BANKS);
    renderWithStore();
    const search = screen.getByLabelText("Search word banks");

    await waitFor(() =>
      expect(search).toHaveValue("English \u2014 200 Most Common"),
    );
  });

  it("shows a previously selected word bank's name once the list loads", async () => {
    mockedApiListWordBanks.mockResolvedValue(WORD_BANKS);
    const store = createTestStore();
    store.dispatch({
      type: "typingConfig/setWordBankSlug",
      payload: "english-top-1000",
    });
    renderWithStore(store);
    const search = screen.getByLabelText("Search word banks");

    await waitFor(() => expect(search).toHaveValue("English Top 1000"));
  });
});

