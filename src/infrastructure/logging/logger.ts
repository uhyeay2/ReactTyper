import type { Logger, LogLevel, LogContext, LogEntry } from "./types";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class StructuredLogger implements Logger {
  private readonly defaultContext: LogContext;
  private readonly minLevel: LogLevel;

  constructor(defaultContext: LogContext = {}, minLevel: LogLevel = "debug") {
    this.defaultContext = defaultContext;
    this.minLevel = minLevel;
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log("error", message, context);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): void {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[this.minLevel]) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.defaultContext, ...context },
    };

    console.info(JSON.stringify(entry));
  }
}

export const logger = new StructuredLogger({ service: "reacttyper" });
