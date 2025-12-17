import { pino } from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export type Logger = typeof logger;

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: Record<string, unknown>): Logger {
  return logger.child(context);
}
