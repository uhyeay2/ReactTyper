import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/app/rootReducer";
import { TestConfigOptions } from "./TestConfigOptions";

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
  it("renders all section labels", () => {
    renderWithStore();
    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText("Words")).toBeInTheDocument();
    expect(screen.getByText("Max Errors")).toBeInTheDocument();
    expect(screen.getByText("Zen Mode")).toBeInTheDocument();
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
    store.dispatch({ type: "typingConfig/setWordCount", payload: 25 });
    const user = userEvent.setup();

    await user.click(screen.getAllByText("None")[1]);

    expect(store.getState().typingConfig.wordCount).toBeNull();
  });

  it("None button clears the max errors", async () => {
    const { store } = renderWithStore();
    store.dispatch({ type: "typingConfig/setMaxErrors", payload: 3 });
    const user = userEvent.setup();

    await user.click(screen.getAllByText("None")[2]);

    expect(store.getState().typingConfig.maxErrors).toBeNull();
  });

  it("None button clears the duration", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();

    await user.click(screen.getAllByText("None")[0]);

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
});
