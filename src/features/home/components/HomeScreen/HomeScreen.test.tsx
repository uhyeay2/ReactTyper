import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/app/rootReducer";
import { HomeScreen } from "./HomeScreen";

function createTestStore() {
  return configureStore({ reducer: rootReducer });
}

function renderWithStore(store?: ReturnType<typeof createTestStore>) {
  const testStore = store ?? createTestStore();
  return {
    ...render(
      <Provider store={testStore}>
        <HomeScreen />
      </Provider>,
    ),
    store: testStore,
  };
}

describe("HomeScreen", () => {
  it("renders title and subtitle", () => {
    renderWithStore();
    expect(screen.getByText("ReactTyper")).toBeInTheDocument();
    expect(
      screen.getByText("Test your typing speed and accuracy"),
    ).toBeInTheDocument();
  });

  it("renders Start Typing button", () => {
    renderWithStore();
    expect(
      screen.getByRole("button", { name: "Start Typing" }),
    ).toBeInTheDocument();
  });

  it("renders config options", () => {
    renderWithStore();
    expect(screen.getByText("Time Limit")).toBeInTheDocument();
    expect(screen.getByText("Word Limit")).toBeInTheDocument();
    expect(screen.getByText("Max Errors")).toBeInTheDocument();
    expect(screen.getByText("Zen Mode")).toBeInTheDocument();
  });

  it("dispatches startFromHome when Start Typing is clicked", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Start Typing" }));

    const state = store.getState();
    expect(state.typing.view).toBe("test");
    expect(state.typing.status).toBe("ready");
  });

  it("uses configured word count when starting", async () => {
    const store = createTestStore();
    store.dispatch({
      type: "typingConfig/setWordCount",
      payload: 25,
    });
    renderWithStore(store);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Start Typing" }));

    const state = store.getState();
    expect(state.typing.wordCount).toBe(25);
    const words = state.typing.targetText.split(" ");
    expect(words.length).toBe(25);
  });

  it("uses default word count when config is null", async () => {
    const { store } = renderWithStore();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Start Typing" }));

    const state = store.getState();
    expect(state.typing.wordCount).toBe(50);
  });
});
