import { describe, it, expect, vi, afterEach } from "vitest";
import { apiGetWordBank } from "@/features/typingConfig/services/wordBanksApi";
import { loadWordBankWords, clearWordBankCache } from "./wordBankLoader";
import * as wordList from "./wordList";

vi.mock("@/features/typingConfig/services/wordBanksApi", () => ({
  apiGetWordBank: vi.fn(),
}));

const mockedApiGetWordBank = vi.mocked(apiGetWordBank);
const setActiveWordPoolSpy = vi.spyOn(wordList, "setActiveWordPool");
const resetActiveWordPoolSpy = vi.spyOn(wordList, "resetActiveWordPool");

describe("loadWordBankWords", () => {
  afterEach(() => {
    vi.clearAllMocks();
    clearWordBankCache();
    resetActiveWordPoolSpy.mockRestore();
  });

  it("fetches the bank words and applies them to the active pool", async () => {
    mockedApiGetWordBank.mockResolvedValue({
      slug: "english-top-200",
      name: "English Top 200",
      description: "Top 200 words",
      kind: "Frequency",
      words: ["the", "be", "to"],
    });

    const loaded = await loadWordBankWords("english-top-200");
    expect(loaded).toBe(true);
    expect(mockedApiGetWordBank).toHaveBeenCalledWith("english-top-200");
    expect(setActiveWordPoolSpy).toHaveBeenCalledWith(["the", "be", "to"]);
  });

  it("caches the bank words so it does not re-fetch on subsequent loads", async () => {
    mockedApiGetWordBank.mockResolvedValue({
      slug: "english-top-200",
      name: "English Top 200",
      description: "Top 200 words",
      kind: "Frequency",
      words: ["the"],
    });

    await loadWordBankWords("english-top-200");
    await loadWordBankWords("english-top-200");

    expect(mockedApiGetWordBank).toHaveBeenCalledTimes(1);
  });

  it("returns false and leaves the pool unchanged on failure", async () => {
    mockedApiGetWordBank.mockRejectedValue(new Error("boom"));
    const loaded = await loadWordBankWords("missing-bank");
    expect(loaded).toBe(false);
    expect(setActiveWordPoolSpy).not.toHaveBeenCalled();
  });
});
