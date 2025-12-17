import { integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { orgs } from '../tenant/orgs';

export const sampleEntities = pgTable('sample_entities', {
  id: varchar('id', { length: 26 }).primaryKey(),
  orgId: varchar('org_id', { length: 26 })
    .notNull()
    .references(() => orgs.id),
  data: text('data').notNull(),
  version: integer('version').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
