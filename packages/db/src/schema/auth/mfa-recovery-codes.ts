import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { users } from './users';

export const mfaRecoveryCodes = pgTable(
  'mfa_recovery_codes',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    userId: varchar('user_id', { length: 26 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    codeHash: text('code_hash').notNull().unique(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: {
      name: 'mfa_recovery_codes_user_id_idx',
      columns: [table.userId],
    },
    codeHashIdx: {
      name: 'mfa_recovery_codes_code_hash_idx',
      columns: [table.codeHash],
    },
  })
);
