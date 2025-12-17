import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { orgs } from '../tenant/orgs';

export const serviceAccounts = pgTable(
  'service_accounts',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    orgId: varchar('org_id', { length: 26 })
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    orgIdIdx: {
      name: 'service_accounts_org_id_idx',
      columns: [table.orgId],
    },
  })
);
