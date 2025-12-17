import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { users } from './users';

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    userId: varchar('user_id', { length: 26 })
      .notNull()
      .references(() => users.id),
    activeOrgId: varchar('active_org_id', { length: 26 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    deviceLabel: text('device_label'),
  },
  (table) => ({
    userIdIdx: {
      name: 'auth_sessions_user_id_idx',
      columns: [table.userId],
    },
    expiresAtIdx: {
      name: 'auth_sessions_expires_at_idx',
      columns: [table.expiresAt],
    },
  })
);
