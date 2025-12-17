import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

/**
 * Rate limiting table (Postgres-backed, no Redis dependency)
 */
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(), // e.g., "login:user@example.com", "magic_link:user@example.com"
  count: integer('count').notNull().default(0),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
