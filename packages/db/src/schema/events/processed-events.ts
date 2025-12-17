import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const processedEvents = pgTable('processed_events', {
  id: varchar('id', { length: 26 }).primaryKey(),
  eventId: varchar('event_id', { length: 36 }).notNull().unique(),
  processedAt: timestamp('processed_at').defaultNow().notNull(),
  consumerName: text('consumer_name').notNull(),
});
