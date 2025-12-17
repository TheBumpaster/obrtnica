import { integer, jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { serviceAccounts } from './service-accounts';
import { orgs } from '../tenant/orgs';

export const apiTokens = pgTable(
  'api_tokens',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    orgId: varchar('org_id', { length: 26 })
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    serviceAccountId: varchar('service_account_id', { length: 26 }).references(
      () => serviceAccounts.id,
      { onDelete: 'cascade' }
    ),
    name: text('name').notNull(),
    tokenPrefix: text('token_prefix').notNull(), // First 8 chars for display
    tokenHash: text('token_hash').notNull().unique(),
    scopes: jsonb('scopes').$type<string[]>().default([]).notNull(),
    workspaceScope: varchar('workspace_scope', { length: 26 }), // Optional workspace restriction
    expiresAt: timestamp('expires_at'),
    revokedAt: timestamp('revoked_at'),
    lastUsedAt: timestamp('last_used_at'),
    version: integer('version').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: {
      name: 'api_tokens_org_id_idx',
      columns: [table.orgId],
    },
    serviceAccountIdIdx: {
      name: 'api_tokens_service_account_id_idx',
      columns: [table.serviceAccountId],
    },
    tokenHashIdx: {
      name: 'api_tokens_token_hash_idx',
      columns: [table.tokenHash],
    },
  })
);
