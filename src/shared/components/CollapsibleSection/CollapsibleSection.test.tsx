import { render, screen, fireEvent } from "@testing-library/react";
import { CollapsibleSection } from "./CollapsibleSection";

describe("CollapsibleSection", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the title and summary", () => {
    render(
      <CollapsibleSection
        title="Test Settings"
        summary="1m Time Limit"
        storageKey="test-key"
        defaultOpen={false}
      >
        <div>Content</div>
      </CollapsibleSection>,
    );

    const header = screen.getByRole("button", { name: /Test Settings/ });
    expect(header).toHaveTextContent("1m Time Limit");
  });

  it("is closed by default when defaultOpen is false", () => {
    render(
      <CollapsibleSection
        title="Section"
        storageKey="test-key"
        defaultOpen={false}
      >
        <div>Secret content</div>
      </CollapsibleSection>,
    );

    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Section" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("is open by default when defaultOpen is true", () => {
    render(
      <CollapsibleSection
        title="Section"
        storageKey="test-key"
        defaultOpen={true}
      >
        <div>Visible content</div>
      </CollapsibleSection>,
    );

    expect(screen.getByText("Visible content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Section" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("toggles content open and closed", () => {
    const { rerender } = render(
      <CollapsibleSection
        title="Section"
        storageKey="test-key"
        defaultOpen={false}
      >
        <div>Toggle content</div>
      </CollapsibleSection>,
    );

    expect(screen.queryByText("Toggle content")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Section" }));
    expect(screen.getByText("Toggle content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Section" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    rerender(
      <CollapsibleSection
        title="Section"
        storageKey="test-key"
        defaultOpen={false}
      >
        <div>Toggle content</div>
      </CollapsibleSection>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Section" }));
    expect(screen.queryByText("Toggle content")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Section" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("persists the open state across remounts", () => {
    const { unmount } = render(
      <CollapsibleSection
        title="Section"
        storageKey="persisted-key"
        defaultOpen={false}
      >
        <div>Persisted content</div>
      </CollapsibleSection>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Section" }));
    unmount();

    render(
      <CollapsibleSection
        title="Section"
        storageKey="persisted-key"
        defaultOpen={false}
      >
        <div>Persisted content</div>
      </CollapsibleSection>,
    );

    expect(screen.getByText("Persisted content")).toBeInTheDocument();
  });

  it("respects a stored closed state even when defaultOpen is true", () => {
    window.localStorage.setItem("persisted-key", "false");

    render(
      <CollapsibleSection
        title="Section"
        storageKey="persisted-key"
        defaultOpen={true}
      >
        <div>Closed content</div>
      </CollapsibleSection>,
    );

    expect(screen.queryByText("Closed content")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Section" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});