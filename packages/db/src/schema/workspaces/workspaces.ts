import { integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { orgs } from '../tenant/orgs';

export const workspaces = pgTable(
  'workspaces',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    orgId: varchar('org_id', { length: 26 })
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    version: integer('version').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    archivedAt: timestamp('archived_at'),
  },
  (table) => ({
    orgIdIdx: {
      name: 'workspaces_org_id_idx',
      columns: [table.orgId],
    },
  })
);
