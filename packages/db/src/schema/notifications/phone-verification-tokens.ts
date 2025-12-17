import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { users } from '../auth/users';

export const phoneVerificationTokens = pgTable('phone_verification_tokens', {
  id: varchar('id', { length: 26 }).primaryKey(),
  userId: varchar('user_id', { length: 26 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  phoneNumber: text('phone_number').notNull(),
  code: text('code').notNull(), // 6-digit code
  expiresAt: timestamp('expires_at').notNull(),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
