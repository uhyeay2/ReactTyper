import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WpmSnapshot } from "../../state/typingTypes";
import { computeCumulativeWpm } from "../../utils/cumulativeWpm";
import type { WpmPoint } from "../../utils/cumulativeWpm";
import styles from "./WpmGraph.module.css";

const MIN_ZOOM = 1;
const MAX_ZOOM = 10;
const WHEEL_ZOOM_STEP = 0.25;
const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 220;
const PADDING_LEFT = 44;
const PADDING_RIGHT = 16;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;
const WPM_TICK_STEP = 20;

interface WheelLike {
  preventDefault: () => void;
  deltaY: number;
  clientX: number;
}

interface WpmGraphProps {
  wpmHistory: WpmSnapshot[];
}

function getMaxWpm(points: WpmPoint[]): number {
  if (points.length === 0) return 0;
  return Math.max(...points.map((p) => p.wpm), 0);
}

function getAxisMax(maxWpm: number): number {
  return Math.max(WPM_TICK_STEP, Math.ceil((maxWpm + 1) / WPM_TICK_STEP) * WPM_TICK_STEP);
}

export function WpmGraph({ wpmHistory }: WpmGraphProps) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState(0);
  const [hovered, setHovered] = useState<WpmPoint | null>(null);
  const dragRef = useRef<{ startX: number; startPan: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  const wpmPoints = useMemo(() => {
    return computeCumulativeWpm(wpmHistory);
  }, [wpmHistory]);

  const totalSeconds = useMemo(() => {
    if (wpmPoints.length === 0) return 0;
    return wpmPoints[wpmPoints.length - 1].second;
  }, [wpmPoints]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(Math.max(200, entry.contentRect.width));
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const [prevTotalSeconds, setPrevTotalSeconds] = useState(totalSeconds);
  if (prevTotalSeconds !== totalSeconds) {
    setPrevTotalSeconds(totalSeconds);
    setPan(0);
    setHovered(null);
  }

  const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

  const visibleWindow = Math.max(1, totalSeconds / clampedZoom);
  const maxPan = Math.max(0, totalSeconds - visibleWindow);
  const clampedPan = Math.min(maxPan, Math.max(0, pan));

  const chartInnerWidth = width - PADDING_LEFT - PADDING_RIGHT;
  const chartInnerHeight = DEFAULT_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const axisMax = getAxisMax(getMaxWpm(wpmPoints));
  const capWpm = axisMax;

  const xPosition = useCallback(
    (second: number) => {
      const t = (second - clampedPan) / visibleWindow;
      return PADDING_LEFT + t * chartInnerWidth;
    },
    [chartInnerWidth, clampedPan, visibleWindow],
  );

  const yPosition = useCallback(
    (wpm: number) => {
      const t = axisMax > 0 ? wpm / axisMax : 0;
      return PADDING_TOP + (1 - t) * chartInnerHeight;
    },
    [chartInnerHeight, axisMax],
  );

  const linePoints = useMemo(() => {
    const visible = wpmPoints.filter(
      (p) => p.second >= clampedPan && p.second <= clampedPan + visibleWindow,
    );
    return visible.map((p) => `${xPosition(p.second)},${yPosition(p.wpm)}`);
  }, [wpmPoints, clampedPan, visibleWindow, xPosition, yPosition]);

  const visibleData = useMemo(
    () =>
      wpmPoints.filter(
        (p) => p.second >= clampedPan && p.second <= clampedPan + visibleWindow,
      ),
    [wpmPoints, clampedPan, visibleWindow],
  );

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let v = 0; v <= axisMax; v += WPM_TICK_STEP) {
      ticks.push(v);
    }
    return ticks;
  }, [axisMax]);

  const xTicks = useMemo(() => {
    const count = Math.min(6, Math.max(1, visibleWindow));
    const step = Math.max(1, Math.round(visibleWindow / count));
    const ticks: number[] = [];
    const start = Math.max(1, Math.floor(clampedPan));
    const end = Math.ceil(clampedPan + visibleWindow);
    for (let v = start; v <= end; v += step) {
      ticks.push(v);
    }
    return ticks;
  }, [clampedPan, visibleWindow]);

  const handleWheel = useCallback(
    (e: WheelLike) => {
      e.preventDefault();
      const newZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, zoom + (e.deltaY > 0 ? -WHEEL_ZOOM_STEP : WHEEL_ZOOM_STEP)),
      );
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        setZoom(newZoom);
        return;
      }
      const cursorX = e.clientX - rect.left - PADDING_LEFT;
      const fraction = cursorX / chartInnerWidth;
      const currentVisible = totalSeconds / newZoom;
      const newMaxPan = Math.max(0, totalSeconds - currentVisible);
      const cursorSecond = clampedPan + fraction * visibleWindow;
      let newPan = cursorSecond - fraction * currentVisible;
      newPan = Math.min(newMaxPan, Math.max(0, newPan));
      setZoom(newZoom);
      setPan(newPan);
    },
    [zoom, chartInnerWidth, visibleWindow, clampedPan, totalSeconds],
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;
    const listener = (event: WheelEvent) => handleWheel(event);
    element.addEventListener("wheel", listener, { passive: false });
    return () => element.removeEventListener("wheel", listener);
  }, [handleWheel]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (clampedZoom <= MIN_ZOOM) return;
      dragRef.current = { startX: e.clientX, startPan: clampedPan };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [clampedZoom, clampedPan],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (drag) {
        const dx = drag.startX - e.clientX;
        const secondsPerPixel = visibleWindow / chartInnerWidth;
        setPan(drag.startPan + dx * secondsPerPixel);
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const mouseSecond =
        clampedPan +
        ((cursorX - PADDING_LEFT) / chartInnerWidth) * visibleWindow;

      let nearest: WpmPoint | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const point of visibleData) {
        const distance = Math.abs(point.second - mouseSecond);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = point;
        }
      }
      setHovered(nearest);
    },
    [visibleWindow, chartInnerWidth, clampedPan, visibleData],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      dragRef.current = null;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerLeave = useCallback(() => {
    dragRef.current = null;
    setHovered(null);
  }, []);

  const handleDataPointHover = useCallback(
    (point: WpmPoint) => {
      if (!dragRef.current) setHovered(point);
    },
    [],
  );

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, z + 1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, z - 1));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(MIN_ZOOM);
    setPan(0);
  }, []);

  if (wpmHistory.length === 0) {
    return <div className={styles.empty}>No WPM data available</div>;
  }

  const linePath = linePoints.join(" ");

  return (
    <div
      ref={containerRef}
      className={styles.container}
      role="img"
      aria-label="WPM over time graph"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      <div className={styles.toolbar}>
        <span className={styles.zoomLabel}>
          {Math.round(clampedZoom)}x
        </span>
        <button
          type="button"
          className={styles.controlBtn}
          onClick={handleZoomIn}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className={styles.controlBtn}
          onClick={handleZoomOut}
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          type="button"
          className={styles.controlBtn}
          onClick={handleReset}
          aria-label="Reset zoom"
        >
          Reset
        </button>
        {clampedZoom > MIN_ZOOM && (
          <span className={styles.hint}>drag to pan</span>
        )}
      </div>

      <svg
        className={styles.svg}
        viewBox={`0 0 ${width} ${DEFAULT_HEIGHT}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
      >
        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={PADDING_LEFT}
              x2={width - PADDING_RIGHT}
              y1={yPosition(tick)}
              y2={yPosition(tick)}
              className={styles.gridLine}
            />
            <text
              x={PADDING_LEFT - 8}
              y={yPosition(tick) + 4}
              className={styles.axisLabel}
              textAnchor="end"
            >
              {tick}
            </text>
          </g>
        ))}

        {capWpm > 0 && (
          <g>
            <line
              data-testid="wpm-cap-line"
              x1={PADDING_LEFT}
              x2={width - PADDING_RIGHT}
              y1={yPosition(capWpm)}
              y2={yPosition(capWpm)}
              className={styles.capLine}
            />
            <text
              x={PADDING_LEFT - 8}
              y={yPosition(capWpm) + 4}
              className={styles.capLabel}
              textAnchor="end"
            >
              {capWpm}
            </text>
          </g>
        )}

        {xTicks.map((tick) => (
          <g key={`x-${tick}`}>
            <line
              x1={xPosition(tick)}
              x2={xPosition(tick)}
              y1={PADDING_TOP}
              y2={DEFAULT_HEIGHT - PADDING_BOTTOM}
              className={styles.gridLine}
            />
            <text
              x={xPosition(tick)}
              y={DEFAULT_HEIGHT - PADDING_BOTTOM + 16}
              className={styles.axisLabel}
              textAnchor="middle"
            >
              {tick}s
            </text>
          </g>
        ))}

        {linePath.length > 0 && (
          <polyline
            points={linePath}
            className={styles.linePath}
            fill="none"
          />
        )}

        {visibleData.map((point) => (
          <circle
            key={point.second}
            cx={xPosition(point.second)}
            cy={yPosition(point.wpm)}
            r={hovered?.second === point.second ? 5 : 2.5}
            className={
              hovered?.second === point.second
                ? styles.hoverPoint
                : styles.dataPoint
            }
            onPointerEnter={() => handleDataPointHover(point)}
          />
        ))}
      </svg>

      {hovered && (
        <div
          className={styles.tooltip}
          style={{
            left: Math.min(
              Math.max(xPosition(hovered.second) - 40, 0),
              width - 100,
            ),
            top: Math.max(yPosition(hovered.wpm) - 44, 0),
          }}
        >
          <span className={styles.tooltipSecond}>{hovered.second}s</span>
          <span className={styles.tooltipWpm}>{hovered.wpm} WPM</span>
        </div>
      )}
    </div>
  );
}
