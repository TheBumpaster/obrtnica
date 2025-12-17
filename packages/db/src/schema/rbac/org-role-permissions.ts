import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { orgRoles } from './org-roles';

export const orgRolePermissions = pgTable(
  'org_role_permissions',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    roleId: varchar('role_id', { length: 26 })
      .notNull()
      .references(() => orgRoles.id, { onDelete: 'cascade' }),
    permission: text('permission').notNull(), // e.g., 'org.members.invite'
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    roleIdPermissionUnique: {
      name: 'org_role_permissions_role_id_permission_unique',
      columns: [table.roleId, table.permission],
    },
    roleIdIdx: {
      name: 'org_role_permissions_role_id_idx',
      columns: [table.roleId],
    },
  })
);
