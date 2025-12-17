import { jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { users } from '../auth/users';
import { orgs } from '../tenant/orgs';

export const inAppNotifications = pgTable('in_app_notifications', {
  id: varchar('id', { length: 26 }).primaryKey(),
  orgId: varchar('org_id', { length: 26 })
    .notNull()
    .references(() => orgs.id),
  recipientId: varchar('recipient_id', { length: 26 })
    .notNull()
    .references(() => users.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  readAt: timestamp('read_at'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
