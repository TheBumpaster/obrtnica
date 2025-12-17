import { integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const orgs = pgTable('orgs', {
  id: varchar('id', { length: 26 }).primaryKey(),
  name: text('name').notNull(),
  version: integer('version').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
