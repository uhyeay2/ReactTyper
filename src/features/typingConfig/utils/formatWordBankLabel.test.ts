import { describe, it, expect } from "vitest";
import { formatWordBankLabel } from "./formatWordBankLabel";

describe("formatWordBankLabel", () => {
  it("formats a hyphenated slug into a title-cased label", () => {
    expect(formatWordBankLabel("english-top-200")).toBe("English Top 200");
  });

  it("formats a misspelled bank slug", () => {
    expect(formatWordBankLabel("english-commonly-misspelled-200")).toBe(
      "English Commonly Misspelled 200",
    );
  });

  it("handles a single-word slug", () => {
    expect(formatWordBankLabel("common")).toBe("Common");
  });

  it("ignores empty segments produced by consecutive hyphens", () => {
    expect(formatWordBankLabel("a--b")).toBe("A B");
  });
});
