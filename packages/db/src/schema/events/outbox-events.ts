import { jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const outboxEvents = pgTable('outbox_events', {
  id: varchar('id', { length: 26 }).primaryKey(),
  eventId: varchar('event_id', { length: 36 }).notNull().unique(),
  eventType: text('event_type').notNull(),
  eventVersion: text('event_version').notNull(),
  tenantId: varchar('tenant_id', { length: 26 }).notNull(),
  correlationId: varchar('correlation_id', { length: 36 }),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  occurredAt: timestamp('occurred_at').notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
