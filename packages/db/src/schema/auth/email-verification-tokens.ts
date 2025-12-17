import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { users } from './users';

export const authEmailVerificationTokens = pgTable(
  'auth_email_verification_tokens',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    userId: varchar('user_id', { length: 26 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: {
      name: 'auth_email_verification_tokens_user_id_idx',
      columns: [table.userId],
    },
    tokenHashIdx: {
      name: 'auth_email_verification_tokens_token_hash_idx',
      columns: [table.tokenHash],
    },
  })
);
