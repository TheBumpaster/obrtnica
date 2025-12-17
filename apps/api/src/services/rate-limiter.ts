/**
 * Postgres-backed rate limiter (no Redis dependency)
 */

import { and, eq, gt, lt } from 'drizzle-orm';

import type { Database } from '../db';
import { rateLimits } from '../db';

export class RateLimiter {
  constructor(private db: Database) {}

  /**
   * Check and increment rate limit
   * Throws if rate limit exceeded
   */
  async checkRateLimit(key: string, maxAttempts: number, windowSeconds: number): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowSeconds * 1000);

    // Try to find existing rate limit entry
    const existing = await this.db
      .select()
      .from(rateLimits)
      .where(and(eq(rateLimits.key, key), gt(rateLimits.expiresAt, now)))
      .limit(1);

    if (existing.length > 0) {
      const entry = existing[0];

      // Check if we're still in the same window
      if (entry.windowStart >= windowStart) {
        // Same window - check count
        if (entry.count >= maxAttempts) {
          const remainingSeconds = Math.ceil((entry.expiresAt.getTime() - now.getTime()) / 1000);
          throw new Error(`Rate limit exceeded. Try again in ${remainingSeconds} seconds.`);
        }

        // Increment count
        await this.db
          .update(rateLimits)
          .set({
            count: entry.count + 1,
          })
          .where(eq(rateLimits.key, key));
      } else {
        // New window - reset
        await this.db
          .update(rateLimits)
          .set({
            count: 1,
            windowStart: now,
            expiresAt: new Date(now.getTime() + windowSeconds * 1000),
          })
          .where(eq(rateLimits.key, key));
      }
    } else {
      // No existing entry - create new
      await this.db
        .insert(rateLimits)
        .values({
          key,
          count: 1,
          windowStart: now,
          expiresAt: new Date(now.getTime() + windowSeconds * 1000),
        })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: {
            count: 1,
            windowStart: now,
            expiresAt: new Date(now.getTime() + windowSeconds * 1000),
          },
        });
    }
  }

  /**
   * Clear rate limit for a key (e.g., after successful login)
   */
  async clearRateLimit(key: string): Promise<void> {
    await this.db.delete(rateLimits).where(eq(rateLimits.key, key));
  }

  /**
   * Clean up expired rate limit entries (maintenance task)
   */
  async cleanupExpired(): Promise<void> {
    const now = new Date();
    await this.db.delete(rateLimits).where(lt(rateLimits.expiresAt, now));
  }
}
