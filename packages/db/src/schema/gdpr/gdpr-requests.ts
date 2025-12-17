import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { users } from '../auth/users';
import { orgs } from '../tenant/orgs';

export const gdprRequests = pgTable(
  'gdpr_requests',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    type: text('type').notNull(),
    status: text('status').notNull(),
    scopeOrgId: varchar('scope_org_id', { length: 26 }).references(() => orgs.id),
    requesterUserId: varchar('requester_user_id', { length: 26 })
      .notNull()
      .references(() => users.id),
    targetUserId: varchar('target_user_id', { length: 26 })
      .notNull()
      .references(() => users.id),
    requestedAt: timestamp('requested_at').defaultNow().notNull(),
    processedAt: timestamp('processed_at'),
    resultLocation: text('result_location'),
    checksum: text('checksum'),
    expiresAt: timestamp('expires_at'),
    failureReason: text('failure_reason'),
    correlationId: varchar('correlation_id', { length: 36 }),
    requestId: varchar('request_id', { length: 26 }),
    mode: text('mode'),
  },
  (table) => ({
    requesterUserIdRequestedAtIdx: {
      name: 'gdpr_requests_requester_user_id_requested_at_idx',
      columns: [table.requesterUserId, table.requestedAt],
    },
    targetUserIdRequestedAtIdx: {
      name: 'gdpr_requests_target_user_id_requested_at_idx',
      columns: [table.targetUserId, table.requestedAt],
    },
    scopeOrgIdRequestedAtIdx: {
      name: 'gdpr_requests_scope_org_id_requested_at_idx',
      columns: [table.scopeOrgId, table.requestedAt],
    },
    statusIdx: {
      name: 'gdpr_requests_status_idx',
      columns: [table.status],
    },
  })
);
