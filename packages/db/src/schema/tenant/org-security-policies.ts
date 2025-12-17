import { boolean, integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

import { orgs } from './orgs';

export const orgSecurityPolicies = pgTable('org_security_policies', {
  id: varchar('id', { length: 26 }).primaryKey(),
  orgId: varchar('org_id', { length: 26 })
    .notNull()
    .unique()
    .references(() => orgs.id, { onDelete: 'cascade' }),
  requiresMfa: boolean('requires_mfa').default(false).notNull(),
  hipaaMode: boolean('hipaa_mode').default(false).notNull(),
  sessionLifetimeMinutes: integer('session_lifetime_minutes').default(480).notNull(), // 8 hours
  sessionIdleTimeoutMinutes: integer('session_idle_timeout_minutes').default(60).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
