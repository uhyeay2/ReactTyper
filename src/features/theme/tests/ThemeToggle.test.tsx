import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "../state/themeSlice";
import { ThemeContext, type ThemeContextValue } from "../providers/ThemeContext";
import { ThemeToggle } from "../components/ThemeToggle/ThemeToggle";

function createTestStore() {
  return configureStore({
    reducer: { theme: themeReducer },
  });
}

function renderWithProviders(
  ui: React.ReactElement,
  contextValue: ThemeContextValue,
) {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <ThemeContext.Provider value={contextValue}>
        {ui}
      </ThemeContext.Provider>
    </Provider>,
  );
}

describe("ThemeToggle", () => {
  const mockToggle = vi.fn();
  const mockSetMode = vi.fn();

  const lightContext: ThemeContextValue = {
    mode: "system",
    resolved: "light",
    setMode: mockSetMode,
    toggle: mockToggle,
  };

  const darkContext: ThemeContextValue = {
    mode: "dark",
    resolved: "dark",
    setMode: mockSetMode,
    toggle: mockToggle,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with switch-to-dark label when light", () => {
    renderWithProviders(<ThemeToggle />, lightContext);
    expect(screen.getByRole("button")).toHaveTextContent("Dark");
  });

  it("renders with switch-to-light label when dark", () => {
    renderWithProviders(<ThemeToggle />, darkContext);
    expect(screen.getByRole("button")).toHaveTextContent("Light");
  });

  it("calls toggle when clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />, lightContext);
    await user.click(screen.getByRole("button"));
    expect(mockToggle).toHaveBeenCalledOnce();
  });

  it("has correct aria-label for light mode", () => {
    renderWithProviders(<ThemeToggle />, lightContext);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Switch to dark mode",
    );
  });

  it("has correct aria-label for dark mode", () => {
    renderWithProviders(<ThemeToggle />, darkContext);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Switch to light mode",
    );
  });

  it("sets aria-pressed to true when dark", () => {
    renderWithProviders(<ThemeToggle />, darkContext);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("sets aria-pressed to false when light", () => {
    renderWithProviders(<ThemeToggle />, lightContext);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });
});
