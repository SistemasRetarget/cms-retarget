import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;

// Child logger factory with request ID
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}
