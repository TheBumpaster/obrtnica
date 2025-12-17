import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { authSessions } from './sessions';

export const authStepUp = pgTable(
  'auth_step_up',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    sessionId: varchar('session_id', { length: 26 })
      .notNull()
      .references(() => authSessions.id, { onDelete: 'cascade' }),
    verifiedAt: timestamp('verified_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    method: text('method').notNull(), // 'MFA' | 'PASSWORD'
  },
  (table) => ({
    sessionIdIdx: {
      name: 'auth_step_up_session_id_idx',
      columns: [table.sessionId],
    },
  })
);
