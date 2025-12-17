import { jsonb, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

import { orgs } from './orgs';
import { users } from '../auth/users';

export const orgMemberships = pgTable(
  'org_memberships',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    orgId: varchar('org_id', { length: 26 })
      .notNull()
      .references(() => orgs.id),
    userId: varchar('user_id', { length: 26 })
      .notNull()
      .references(() => users.id),
    roles: jsonb('roles').$type<string[]>().default([]).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    orgUserUnique: {
      name: 'org_memberships_org_id_user_id_unique',
      columns: [table.orgId, table.userId],
    },
  })
);
