import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { users } from './users';
import { orgs } from '../tenant/orgs';

export const emergencyAccessGrants = pgTable(
  'emergency_access_grants',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    orgId: varchar('org_id', { length: 26 })
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 26 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    justification: text('justification').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    revokedByUserId: varchar('revoked_by_user_id', { length: 26 }).references(() => users.id),
  },
  (table) => ({
    orgIdIdx: {
      name: 'emergency_access_grants_org_id_idx',
      columns: [table.orgId],
    },
    userIdIdx: {
      name: 'emergency_access_grants_user_id_idx',
      columns: [table.userId],
    },
  })
);
