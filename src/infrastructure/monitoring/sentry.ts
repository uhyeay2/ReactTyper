import * as Sentry from "@sentry/react";

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  Sentry.init({
    dsn: dsn || "",
    environment: import.meta.env.MODE,
    enabled: Boolean(dsn),
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.2 : 1.0,
  });
}
