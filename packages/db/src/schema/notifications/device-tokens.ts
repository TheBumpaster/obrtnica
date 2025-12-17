import { boolean, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { users } from '../auth/users';
import { orgs } from '../tenant/orgs';

export const deviceTokens = pgTable('device_tokens', {
  id: varchar('id', { length: 26 }).primaryKey(),
  userId: varchar('user_id', { length: 26 })
    .notNull()
    .references(() => users.id),
  orgId: varchar('org_id', { length: 26 })
    .notNull()
    .references(() => orgs.id),
  token: text('token').notNull().unique(),
  platform: text('platform').notNull(),
  isValid: boolean('is_valid').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
