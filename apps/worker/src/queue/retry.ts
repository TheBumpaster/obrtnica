import { config } from '../config';

/**
 * Retry policy configuration
 */
export const retryConfig = {
  maxAttempts: parseInt(config.RETRY_MAX_ATTEMPTS, 10),
  initialDelayMs: parseInt(config.RETRY_INITIAL_DELAY_MS, 10),
  backoffMultiplier: parseFloat(config.RETRY_BACKOFF_MULTIPLIER),
  dlqTtlMs: parseInt(config.DLQ_TTL_MS, 10),
} as const;

/**
 * Calculate exponential backoff delay for a given attempt number
 * @param attemptNumber - 1-based attempt number (1 = first retry)
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(attemptNumber: number): number {
  return retryConfig.initialDelayMs * Math.pow(retryConfig.backoffMultiplier, attemptNumber - 1);
}

/**
 * Check if a message should be retried based on attempt count
 * @param attemptCount - Current attempt count (from message headers)
 * @returns true if should retry, false if should go to DLQ
 */
export function shouldRetry(attemptCount: number): boolean {
  return attemptCount < retryConfig.maxAttempts;
}

/**
 * Get retry count from message headers
 * @param headers - RabbitMQ message headers
 * @returns Retry count (0 = first attempt)
 */
export function getRetryCount(headers: Record<string, unknown> | null): number {
  if (!headers || typeof headers['x-retry-count'] !== 'number') {
    return 0;
  }
  return headers['x-retry-count'] as number;
}

/**
 * Increment retry count in message headers
 * @param headers - RabbitMQ message headers (may be null)
 * @returns New headers with incremented retry count
 */
export function incrementRetryCount(headers: Record<string, unknown> | null): Record<string, unknown> {
  const currentCount = getRetryCount(headers);
  return {
    ...(headers || {}),
    'x-retry-count': currentCount + 1,
  };
}
