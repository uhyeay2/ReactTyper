import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/app/rootReducer";
import { apiGetLesson, apiListLessons } from "../../services/lessonsApi";
import type { LessonDetail } from "../../state/lessonTypes";
import { LessonsScreen } from "./LessonsScreen";

vi.mock("../../services/lessonsApi", () => ({
  apiListLessons: vi.fn(),
  apiGetLesson: vi.fn(),
}));

const mockedApiListLessons = vi.mocked(apiListLessons);
const mockedApiGetLesson = vi.mocked(apiGetLesson);

function createTestStore() {
  return configureStore({ reducer: rootReducer });
}

function renderWithStore(store?: ReturnType<typeof createTestStore>) {
  const testStore = store ?? createTestStore();
  return {
    ...render(
      <Provider store={testStore}>
        <MemoryRouter>
          <LessonsScreen />
        </MemoryRouter>
      </Provider>,
    ),
    store: testStore,
  };
}

function makeLessons() {
  return [
    {
      slug: "home-row",
      title: "Home Row",
      description: "Master the home row keys.",
      difficultyLevel: 1,
      unitCount: 2,
    },
  ];
}

function makeLessonDetail(): LessonDetail {
  return {
    slug: "home-row",
    title: "Home Row",
    description: "Master the home row keys.",
    difficultyLevel: 1,
    units: [
      { order: 0, title: "Sequences", content: "asdf jkl;" },
      { order: 1, title: "Words", content: "dad fall add" },
    ],
  };
}

describe("LessonsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApiListLessons.mockResolvedValue(makeLessons());
  });

  it("renders lesson summaries", async () => {
    renderWithStore();
    expect(await screen.findByText("Home Row")).toBeInTheDocument();
  });

  it("shows units inline after expanding a lesson", async () => {
    mockedApiGetLesson.mockResolvedValue(makeLessonDetail());
    const user = userEvent.setup();
    renderWithStore();

    await user.click(
      await screen.findByRole("button", { name: /Home Row/ }),
    );

    expect(await screen.findByText("Sequences")).toBeInTheDocument();
    expect(screen.getByText("Words")).toBeInTheDocument();
  });

  it("does not load unit details before a lesson is expanded", async () => {
    renderWithStore();
    await screen.findByText("Home Row");
    expect(mockedApiGetLesson).not.toHaveBeenCalled();
  });

  it("collapses units when an expanded lesson is clicked again", async () => {
    mockedApiGetLesson.mockResolvedValue(makeLessonDetail());
    const user = userEvent.setup();
    renderWithStore();

    const header = await screen.findByRole("button", { name: /Home Row/ });
    await user.click(header);
    expect(await screen.findByText("Sequences")).toBeInTheDocument();

    await user.click(header);
    expect(screen.queryByText("Sequences")).not.toBeInTheDocument();
  });

  it("starts a lesson unit session and navigates home", async () => {
    mockedApiGetLesson.mockResolvedValue(makeLessonDetail());
    const user = userEvent.setup();
    const { store } = renderWithStore();

    await user.click(
      await screen.findByRole("button", { name: /Home Row/ }),
    );
    const startButtons = await screen.findAllByRole("button", {
      name: "Start",
    });
    await user.click(startButtons[0]!);

    const state = store.getState();
    expect(state.typing.view).toBe("test");
    expect(state.typing.status).toBe("ready");
    expect(state.typing.sessionContext.lessonSlug).toBe("home-row");
    expect(state.typing.sessionContext.lessonUnitOrder).toBe(0);
    expect(state.typing.targetText.split(" ").sort()).toEqual(
      "asdf jkl;".split(" ").sort(),
    );
  });

  it("shows an error when a lesson fails to load", async () => {
    mockedApiGetLesson.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderWithStore();

    await user.click(
      await screen.findByRole("button", { name: /Home Row/ }),
    );

    expect(
      await screen.findByText("Unable to load this lesson."),
    ).toBeInTheDocument();
  });
});
