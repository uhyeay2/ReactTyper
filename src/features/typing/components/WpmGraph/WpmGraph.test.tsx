import { render, screen, fireEvent, act } from "@testing-library/react";
import { WpmGraph } from "./WpmGraph";
import type { WpmTimelinePoint } from "../../metrics/wpm";

const sampleTimeline: WpmTimelinePoint[] = Array.from(
  { length: 14 },
  (_, i) => ({
    second: i + 1,
    wpm: 60,
  }),
);

describe("WpmGraph", () => {
  it("renders an svg element with the graph", () => {
    render(<WpmGraph wpmTimeline={sampleTimeline} />);
    expect(screen.getByLabelText("WPM over time graph")).toBeInTheDocument();
    const svg = document.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.querySelector("polyline")).not.toBeNull();
  });

  it("renders axis labels for time and wpm", () => {
    render(<WpmGraph wpmTimeline={sampleTimeline} />);
    const svg = document.querySelector("svg");
    expect(svg).not.toBeNull();
    const texts = Array.from(svg?.querySelectorAll("text") ?? []);
    const fullText = texts.map((t) => t.textContent ?? "").join(" ");
    expect(fullText).toContain("s");
  });

  it("uses a 20 WPM step for the y-axis gridlines", () => {
    render(<WpmGraph wpmTimeline={sampleTimeline} />);
    const texts = Array.from(document.querySelectorAll("text") ?? []);
    const values = texts
      .map((t) => t.textContent ?? "")
      .filter((t) => /^\d+$/.test(t))
      .map(Number);
    [20, 40, 60, 80].forEach((v) => {
      expect(values).toContain(v);
    });
  });

  it("renders a cap line above the maximum WPM", () => {
    render(<WpmGraph wpmTimeline={sampleTimeline} />);
    const maxWpm = Math.max(...sampleTimeline.map((p) => p.wpm)); // 60
    const capWpm = 80;

    expect(screen.getByTestId("wpm-cap-line")).toBeInTheDocument();
    expect(
      Array.from(document.querySelectorAll("text") ?? []).some(
        (t) => t.textContent === String(capWpm),
      ),
    ).toBe(true);
    expect(capWpm).toBeGreaterThan(maxWpm);
  });

  it("shows empty state when no data", () => {
    render(<WpmGraph wpmTimeline={[]} />);
    expect(screen.getByText("No WPM data available")).toBeInTheDocument();
  });

  it("provides zoom controls", () => {
    render(<WpmGraph wpmTimeline={sampleTimeline} />);
    expect(screen.getByLabelText("Zoom in")).toBeInTheDocument();
    expect(screen.getByLabelText("Zoom out")).toBeInTheDocument();
    expect(screen.getByLabelText("Reset zoom")).toBeInTheDocument();
  });

  it("zooms in on zoom-in button click", () => {
    render(<WpmGraph wpmTimeline={sampleTimeline} />);
    expect(screen.getByText("1x")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Zoom in"));

    expect(screen.getByText("2x")).toBeInTheDocument();
    expect(screen.getByText("drag to pan")).toBeInTheDocument();
  });

  it("resets zoom via reset button", () => {
    render(<WpmGraph wpmTimeline={sampleTimeline} />);

    fireEvent.click(screen.getByLabelText("Zoom in"));
    fireEvent.click(screen.getByLabelText("Zoom in"));

    expect(screen.getByText("3x")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Reset zoom"));

    expect(screen.getByText("1x")).toBeInTheDocument();
  });

  it("zooms out down to minimum", () => {
    render(<WpmGraph wpmTimeline={sampleTimeline} />);

    fireEvent.click(screen.getByLabelText("Zoom out"));

    expect(screen.getByText("1x")).toBeInTheDocument();
  });

  it("keeps time labels as whole numbers when zoomed to a fractional window", () => {
    const timeline = Array.from({ length: 12 }, (_, i) => ({
      second: i + 1,
      wpm: 60,
    }));
    render(<WpmGraph wpmTimeline={timeline} />);

    fireEvent.click(screen.getByLabelText("Zoom in"));
    fireEvent.click(screen.getByLabelText("Zoom in"));

    const svg = document.querySelector("svg");
    const texts = Array.from(svg?.querySelectorAll("text") ?? []).map(
      (t) => t.textContent ?? "",
    );
    const timeLabels = texts.filter((t) => t.endsWith("s"));
    expect(timeLabels.length).toBeGreaterThan(0);
    for (const label of timeLabels) {
      expect(label.slice(0, -1)).toMatch(/^\d+$/);
    }
  });

  it("prevents page scroll when the wheel is used over the graph", () => {
    const { container } = render(<WpmGraph wpmTimeline={sampleTimeline} />);
    const graph = container.querySelector('[aria-label="WPM over time graph"]');
    expect(graph).not.toBeNull();

    const event = new WheelEvent("wheel", {
      deltaY: 10,
      bubbles: true,
      cancelable: true,
    });
    graph?.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("zooms in when scrolling up over the graph", () => {
    render(<WpmGraph wpmTimeline={sampleTimeline} />);
    const graph = document.querySelector('[aria-label="WPM over time graph"]');
    expect(graph).not.toBeNull();

    act(() => {
      graph?.dispatchEvent(
        new WheelEvent("wheel", {
          deltaY: -100,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    act(() => {
      graph?.dispatchEvent(
        new WheelEvent("wheel", {
          deltaY: -100,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    act(() => {
      graph?.dispatchEvent(
        new WheelEvent("wheel", {
          deltaY: -100,
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    expect(screen.getByText("2x")).toBeInTheDocument();
    expect(screen.getByText("drag to pan")).toBeInTheDocument();
  });

  it("shows a tooltip when hovering a data point", () => {
    render(<WpmGraph wpmTimeline={sampleTimeline} />);
    const circles = Array.from(document.querySelectorAll("circle"));
    expect(circles.length).toBeGreaterThan(0);

    fireEvent.pointerEnter(circles[0]!);

    expect(
      screen.getByText(`${sampleTimeline[0]!.wpm} WPM`),
    ).toBeInTheDocument();
  });

  it("snaps the tooltip to the nearest vertical line on pointer move", () => {
    render(<WpmGraph wpmTimeline={sampleTimeline} />);
    const graph = document.querySelector('[aria-label="WPM over time graph"]');
    expect(graph).not.toBeNull();

    fireEvent.pointerMove(graph!, {
      clientX: 45,
      clientY: 10,
    });

    expect(
      screen.getByText(`${sampleTimeline[0]!.wpm} WPM`),
    ).toBeInTheDocument();
  });

  it("resets pan and hover when the data window changes", () => {
    const { rerender } = render(<WpmGraph wpmTimeline={sampleTimeline} />);
    fireEvent.pointerEnter(Array.from(document.querySelectorAll("circle"))[0]!);
    expect(
      screen.getByText(`${sampleTimeline[0]!.wpm} WPM`),
    ).toBeInTheDocument();

    const longerTimeline: WpmTimelinePoint[] = Array.from(
      { length: 12 },
      (_, i) => ({ second: i + 1, wpm: 144 }),
    );
    rerender(<WpmGraph wpmTimeline={longerTimeline} />);

    expect(screen.queryByText(`${sampleTimeline[0]!.wpm} WPM`)).toBeNull();
  });

  it("ignores a pointer down at minimum zoom", () => {
    render(<WpmGraph wpmTimeline={sampleTimeline} />);
    const graph = screen.getByLabelText("WPM over time graph");

    expect(() => {
      fireEvent.pointerDown(graph, { clientX: 100 });
    }).not.toThrow();
  });

  it("ignores pointer move without an active drag", () => {
    render(<WpmGraph wpmTimeline={sampleTimeline} />);
    const graph = screen.getByLabelText("WPM over time graph");

    expect(() => {
      fireEvent.pointerMove(graph, { clientX: 120 });
    }).not.toThrow();
  });
});
