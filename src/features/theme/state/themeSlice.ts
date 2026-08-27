import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ThemeMode, ThemeState, ResolvedTheme } from "./themeTypes";

const initialState: ThemeState = {
  mode: "system",
  resolved: "light",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
    },
    toggleTheme(state) {
      state.resolved = state.resolved === "dark" ? "light" : "dark";
    },
    setResolvedTheme(state, action: PayloadAction<ResolvedTheme>) {
      state.resolved = action.payload;
    },
  },
});

export const { setTheme, toggleTheme, setResolvedTheme } = themeSlice.actions;

export const selectResolvedTheme = (state: { theme: ThemeState }) =>
  state.theme.resolved;

export default themeSlice.reducer;
