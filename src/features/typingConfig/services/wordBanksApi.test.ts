import { describe, it, expect, vi, afterEach } from "vitest";
import { apiFetch } from "@/infrastructure/api/client";
import { apiListWordBanks, apiGetWordBank } from "./wordBanksApi";
import type { WordBankDetail, WordBankSummary } from "./wordBanksApi";

vi.mock("@/infrastructure/api/client", () => ({
  apiFetch: vi.fn(),
}));

const mockedApiFetch = vi.mocked(apiFetch);

const BANK_LIST: WordBankSummary[] = [
  {
    slug: "english-top-200",
    name: "English Top 200",
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

const BANK_DETAIL: WordBankDetail = {
  slug: "english-top-200",
  name: "English Top 200",
  description: "Top 200 words",
  kind: "Frequency",
  words: ["the", "be", "to"],
};

describe("wordBanksApi", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("apiListWordBanks fetches and returns the word banks", async () => {
    mockedApiFetch.mockResolvedValueOnce({ wordBanks: BANK_LIST });
    const result = await apiListWordBanks();
    expect(mockedApiFetch).toHaveBeenCalledWith("/word-banks");
    expect(result).toEqual(BANK_LIST);
  });

  it("apiGetWordBank fetches and maps words to strings", async () => {
    mockedApiFetch.mockResolvedValueOnce({
      slug: "english-top-200",
      name: "English Top 200",
      description: "Top 200 words",
      kind: "Frequency",
      words: [{ value: "the" }, { value: "be" }, { value: "to" }],
    });
    const result = await apiGetWordBank("english-top-200");
    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/word-banks/english-top-200",
    );
    expect(result).toEqual(BANK_DETAIL);
  });

  it("apiGetWordBank encodes the slug in the URL", async () => {
    mockedApiFetch.mockResolvedValueOnce({
      slug: "a b",
      name: "A B",
      description: "",
      kind: "Frequency",
      words: [],
    });
    await apiGetWordBank("a b");
    expect(mockedApiFetch).toHaveBeenCalledWith("/word-banks/a%20b");
  });
});
