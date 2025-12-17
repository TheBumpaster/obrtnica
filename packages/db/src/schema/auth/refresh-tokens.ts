import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { authSessions } from './sessions';

export const authRefreshTokens = pgTable(
  'auth_refresh_tokens',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    sessionId: varchar('session_id', { length: 26 })
      .notNull()
      .references(() => authSessions.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    familyId: varchar('family_id', { length: 26 }).notNull(),
    rotatedAt: timestamp('rotated_at'),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    sessionIdIdx: {
      name: 'auth_refresh_tokens_session_id_idx',
      columns: [table.sessionId],
    },
    familyIdIdx: {
      name: 'auth_refresh_tokens_family_id_idx',
      columns: [table.familyId],
    },
    tokenHashIdx: {
      name: 'auth_refresh_tokens_token_hash_idx',
      columns: [table.tokenHash],
    },
  })
);
