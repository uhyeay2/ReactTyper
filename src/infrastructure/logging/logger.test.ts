import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StructuredLogger } from "./logger";

describe("StructuredLogger", () => {
  let logger: StructuredLogger;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new StructuredLogger({ service: "test" });
    consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("logs info messages with context", () => {
    logger.info("test message", { key: "value" });
    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = consoleSpy.mock.calls[0]![0] as string;
    expect(output).toContain("test message");
    expect(output).toContain("test");
  });

  it("logs error messages", () => {
    logger.error("something failed");
    expect(consoleSpy).toHaveBeenCalledOnce();
  });

  it("respects minimum log level", () => {
    const warnLogger = new StructuredLogger({}, "warn");
    warnLogger.debug("should not appear");
    warnLogger.info("should not appear");
    expect(consoleSpy).not.toHaveBeenCalled();

    warnLogger.warn("should appear");
    expect(consoleSpy).toHaveBeenCalledOnce();
  });

  it("includes timestamp in ISO format", () => {
    logger.info("timed");
    const output = consoleSpy.mock.calls[0]![0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    );
  });

  it("merges default and call context", () => {
    logger.info("merged", { extra: true });
    const output = consoleSpy.mock.calls[0]![0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.context.service).toBe("test");
    expect(parsed.context.extra).toBe(true);
  });
});
