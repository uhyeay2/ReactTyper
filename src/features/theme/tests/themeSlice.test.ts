import { describe, it, expect } from "vitest";
import themeReducer, {
  setTheme,
  toggleTheme,
  setResolvedTheme,
  selectResolvedTheme,
} from "../state/themeSlice";
import type { ThemeState } from "../state/themeTypes";

const initialState: ThemeState = {
  mode: "system",
  resolved: "light",
};

describe("themeSlice", () => {
  describe("setTheme", () => {
    it("sets the mode", () => {
      const state = themeReducer(initialState, setTheme("dark"));
      expect(state.mode).toBe("dark");
    });
  });

  describe("toggleTheme", () => {
    it("toggles from light to dark", () => {
      const state = themeReducer(
        { ...initialState, resolved: "light" },
        toggleTheme(),
      );
      expect(state.resolved).toBe("dark");
    });

    it("toggles from dark to light", () => {
      const state = themeReducer(
        { ...initialState, resolved: "dark" },
        toggleTheme(),
      );
      expect(state.resolved).toBe("light");
    });
  });

  describe("setResolvedTheme", () => {
    it("sets resolved theme directly", () => {
      const state = themeReducer(initialState, setResolvedTheme("dark"));
      expect(state.resolved).toBe("dark");
    });
  });

  describe("selectors", () => {
    it("selectResolvedTheme returns resolved theme", () => {
      const state: { theme: ThemeState } = {
        theme: { ...initialState, resolved: "dark" },
      };
      expect(selectResolvedTheme(state)).toBe("dark");
    });
  });
});
