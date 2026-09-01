import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { GamesScreen } from "./GamesScreen";

describe("GamesScreen", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("renders the Word Drop game card", () => {
    render(<GamesScreen />);
    expect(screen.getByText("Word Drop")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("navigates to the Word Drop route when Play is clicked", () => {
    render(<GamesScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(mockNavigate).toHaveBeenCalledWith("/games/word-drop");
  });
});
