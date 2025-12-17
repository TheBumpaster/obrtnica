import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { users } from './users';

export const mfaFactors = pgTable(
  'mfa_factors',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    userId: varchar('user_id', { length: 26 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'TOTP'
    secretEncrypted: text('secret_encrypted').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    verifiedAt: timestamp('verified_at'),
    disabledAt: timestamp('disabled_at'),
  },
  (table) => ({
    userIdIdx: {
      name: 'mfa_factors_user_id_idx',
      columns: [table.userId],
    },
  })
);
