import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Sentry from "@sentry/react";

vi.mock("@sentry/react", () => ({
  init: vi.fn(),
}));

import { initSentry } from "./sentry";

describe("initSentry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes Sentry with the configured DSN when present", () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://example.dsn");
    vi.stubEnv("MODE", "production");

    initSentry();

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://example.dsn",
        enabled: true,
        tracesSampleRate: 0.2,
      }),
    );

    vi.unstubAllEnvs();
  });

  it("initializes Sentry disabled when no DSN is configured", () => {
    vi.stubEnv("VITE_SENTRY_DSN", "");
    vi.stubEnv("MODE", "development");

    initSentry();

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "",
        enabled: false,
        tracesSampleRate: 1.0,
      }),
    );

    vi.unstubAllEnvs();
  });
});
