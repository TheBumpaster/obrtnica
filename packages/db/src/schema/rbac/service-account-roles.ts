import { pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

import { orgRoles } from './org-roles';
import { serviceAccounts } from '../auth/service-accounts';

export const serviceAccountRoles = pgTable(
  'service_account_roles',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    serviceAccountId: varchar('service_account_id', { length: 26 })
      .notNull()
      .references(() => serviceAccounts.id, { onDelete: 'cascade' }),
    roleId: varchar('role_id', { length: 26 })
      .notNull()
      .references(() => orgRoles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    serviceAccountRoleUnique: {
      name: 'service_account_roles_service_account_id_role_id_unique',
      columns: [table.serviceAccountId, table.roleId],
    },
    serviceAccountIdIdx: {
      name: 'service_account_roles_service_account_id_idx',
      columns: [table.serviceAccountId],
    },
  })
);
