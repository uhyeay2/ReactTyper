import { render, screen } from "@testing-library/react";
import { LiveWpm } from "./LiveWpm";

describe("LiveWpm", () => {
  it("renders the rounded WPM value when ready", () => {
    render(<LiveWpm ready={true} value={64.6} />);

    expect(screen.getByText("65")).toBeInTheDocument();
    expect(screen.queryByLabelText("Calculating WPM")).not.toBeInTheDocument();
  });

  it("renders the loading indicator while not ready", () => {
    render(<LiveWpm ready={false} value={0} />);

    expect(screen.getByLabelText("Calculating WPM")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("renders a set of orbiting dots while loading", () => {
    render(<LiveWpm ready={false} value={0} />);

    const loader = screen.getByLabelText("Calculating WPM");
    expect(loader.querySelectorAll("span").length).toBeGreaterThan(1);
  });
});
