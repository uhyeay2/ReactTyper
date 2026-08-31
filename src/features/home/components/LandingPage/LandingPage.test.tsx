import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { LandingPage } from "./LandingPage";

function renderLandingPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe("LandingPage", () => {
  it("renders the hero title and subtitle", () => {
    renderLandingPage();
    expect(screen.getByText("ReactTyper")).toBeInTheDocument();
    expect(
      screen.getByText(/Improve your typing speed and accuracy/),
    ).toBeInTheDocument();
  });

  it("links to the typing test settings", () => {
    renderLandingPage();
    const cta = screen.getByRole("link", { name: "Start a Typing Test" });
    expect(cta).toHaveAttribute("href", "/test");
  });

  it("renders feature cards", () => {
    renderLandingPage();
    expect(screen.getByText("Typing Tests")).toBeInTheDocument();
    expect(screen.getByText("Touch Typing Lessons")).toBeInTheDocument();
    expect(screen.getByText("Virtual Keyboard")).toBeInTheDocument();
    expect(screen.getByText("Session History")).toBeInTheDocument();
  });
});
