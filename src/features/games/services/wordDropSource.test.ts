import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/features/typing/utils/wordList", () => ({
  getRandomWords: vi.fn(),
}));

import { getRandomWords } from "@/features/typing/utils/wordList";
import { getNextGameWord } from "./wordDropSource";

const mockedGetRandomWords = vi.mocked(getRandomWords);

describe("wordDropSource", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the first word drawn from the active pool", () => {
    mockedGetRandomWords.mockReturnValue(["hello"]);
    expect(getNextGameWord()).toBe("hello");
    expect(mockedGetRandomWords).toHaveBeenCalledWith(1);
  });

  it("returns a fallback when the pool yields nothing", () => {
    mockedGetRandomWords.mockReturnValue([]);
    expect(getNextGameWord()).toBe("the");
  });
});
