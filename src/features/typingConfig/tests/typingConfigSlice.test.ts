import typingConfigReducer, {
  setDuration,
  setWordCount,
  setMaxErrors,
  setZenMode,
  setWordBankSlug,
  resetConfig,
  selectDuration,
  selectWordCount,
  selectMaxErrors,
  selectIsZenMode,
  selectWordBankSlug,
  selectTypingConfig,
} from "../state/typingConfigSlice";
import type { TypingConfigState } from "../state/typingConfigTypes";

describe("typingConfigSlice", () => {
  const initialState: TypingConfigState = {
    duration: 60,
    wordCount: null,
    maxErrors: null,
    isZenMode: false,
    wordBankSlug: "english-top-200",
  };

  it("returns initial state", () => {
    expect(typingConfigReducer(undefined, { type: "unknown" })).toEqual(
      initialState,
    );
  });

  it("setDuration updates duration and clears zenMode", () => {
    const state = typingConfigReducer(
      { ...initialState, isZenMode: true },
      setDuration(30),
    );
    expect(state.duration).toBe(30);
    expect(state.isZenMode).toBe(false);
  });

  it("setDuration with null sets unlimited and auto-enables zen mode", () => {
    const state = typingConfigReducer(initialState, setDuration(null));
    expect(state.duration).toBeNull();
    expect(state.isZenMode).toBe(true);
  });

  it("setDuration with null does not enable zen when other limits exist", () => {
    const state = typingConfigReducer(
      { ...initialState, wordCount: 25 },
      setDuration(null),
    );
    expect(state.duration).toBeNull();
    expect(state.isZenMode).toBe(false);
  });

  it("setWordCount updates wordCount and clears zenMode", () => {
    const state = typingConfigReducer(
      { ...initialState, isZenMode: true },
      setWordCount(25),
    );
    expect(state.wordCount).toBe(25);
    expect(state.isZenMode).toBe(false);
  });

  it("setMaxErrors updates maxErrors and clears zenMode", () => {
    const state = typingConfigReducer(
      { ...initialState, isZenMode: true },
      setMaxErrors(5),
    );
    expect(state.maxErrors).toBe(5);
    expect(state.isZenMode).toBe(false);
  });

  it("setWordCount with null auto-enables zen mode when no limits set", () => {
    const state = typingConfigReducer(
      { duration: null, wordCount: 25, maxErrors: null, isZenMode: false, wordBankSlug: null },
      setWordCount(null),
    );
    expect(state.wordCount).toBeNull();
    expect(state.isZenMode).toBe(true);
  });

  it("setWordCount with null keeps zen mode off when other limits exist", () => {
    const state = typingConfigReducer(
      { duration: 60, wordCount: 25, maxErrors: 5, isZenMode: false, wordBankSlug: null },
      setWordCount(null),
    );
    expect(state.wordCount).toBeNull();
    expect(state.isZenMode).toBe(false);
  });

  it("setMaxErrors with null auto-enables zen mode when no limits set", () => {
    const state = typingConfigReducer(
      { duration: null, wordCount: null, maxErrors: 5, isZenMode: false, wordBankSlug: null },
      setMaxErrors(null),
    );
    expect(state.maxErrors).toBeNull();
    expect(state.isZenMode).toBe(true);
  });

  it("setMaxErrors with null keeps zen mode off when other limits exist", () => {
    const state = typingConfigReducer(
      { duration: 60, wordCount: 25, maxErrors: 5, isZenMode: false, wordBankSlug: null },
      setMaxErrors(null),
    );
    expect(state.maxErrors).toBeNull();
    expect(state.isZenMode).toBe(false);
  });

  it("setZenMode(true) clears all limits", () => {
    const state = typingConfigReducer(
      { duration: 30, wordCount: 50, maxErrors: 5, isZenMode: false, wordBankSlug: null },
      setZenMode(true),
    );
    expect(state.isZenMode).toBe(true);
    expect(state.duration).toBeNull();
    expect(state.wordCount).toBeNull();
    expect(state.maxErrors).toBeNull();
  });

  it("setZenMode(false) does not change limits", () => {
    const state = typingConfigReducer(
      { duration: 30, wordCount: 50, maxErrors: 5, isZenMode: true, wordBankSlug: null },
      setZenMode(false),
    );
    expect(state.isZenMode).toBe(false);
    expect(state.duration).toBe(30);
    expect(state.wordCount).toBe(50);
    expect(state.maxErrors).toBe(5);
  });

  it("setWordBankSlug updates the word bank slug", () => {
    const state = typingConfigReducer(
      initialState,
      setWordBankSlug("english-top-1000"),
    );
    expect(state.wordBankSlug).toBe("english-top-1000");
    expect(state.isZenMode).toBe(false);
    expect(state.duration).toBe(60);
  });

  it("setWordBankSlug with null clears the word bank", () => {
    const state = typingConfigReducer(
      { ...initialState, wordBankSlug: "english-top-200" },
      setWordBankSlug(null),
    );
    expect(state.wordBankSlug).toBeNull();
  });

  it("resetConfig restores initial state", () => {
    const modified: TypingConfigState = {
      duration: 120,
      wordCount: 100,
      maxErrors: 10,
      isZenMode: true,
      wordBankSlug: "english-top-500",
    };
    const state = typingConfigReducer(modified, resetConfig());
    expect(state).toEqual(initialState);
  });
});

describe("typingConfigSlice selectors", () => {
  const configState: TypingConfigState = {
    duration: 30,
    wordCount: 50,
    maxErrors: 5,
    isZenMode: false,
    wordBankSlug: "english-top-200",
  };

  it("selectDuration returns duration", () => {
    expect(selectDuration({ typingConfig: configState })).toBe(30);
  });

  it("selectWordCount returns wordCount", () => {
    expect(selectWordCount({ typingConfig: configState })).toBe(50);
  });

  it("selectMaxErrors returns maxErrors", () => {
    expect(selectMaxErrors({ typingConfig: configState })).toBe(5);
  });

  it("selectIsZenMode returns isZenMode", () => {
    expect(selectIsZenMode({ typingConfig: configState })).toBe(false);
  });

  it("selectWordBankSlug returns wordBankSlug", () => {
    expect(selectWordBankSlug({ typingConfig: configState })).toBe(
      "english-top-200",
    );
  });

  it("selectTypingConfig returns full config", () => {
    expect(selectTypingConfig({ typingConfig: configState })).toEqual(
      configState,
    );
  });
});
