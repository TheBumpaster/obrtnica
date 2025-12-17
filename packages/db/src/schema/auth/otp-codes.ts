import { integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { users } from './users';

export const authOtpCodes = pgTable(
  'auth_otp_codes',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    userId: varchar('user_id', { length: 26 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    codeHash: text('code_hash').notNull(),
    purpose: text('purpose').notNull(), // 'LOGIN' | 'VERIFICATION' | 'MFA'
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    attemptCount: integer('attempt_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: {
      name: 'auth_otp_codes_user_id_idx',
      columns: [table.userId],
    },
    codeHashIdx: {
      name: 'auth_otp_codes_code_hash_idx',
      columns: [table.codeHash],
    },
  })
);
