import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { workspaceRoles } from './workspace-roles';

export const workspaceRolePermissions = pgTable(
  'workspace_role_permissions',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    roleId: varchar('role_id', { length: 26 })
      .notNull()
      .references(() => workspaceRoles.id, { onDelete: 'cascade' }),
    permission: text('permission').notNull(), // e.g., 'workspace.data.read'
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    roleIdPermissionUnique: {
      name: 'workspace_role_permissions_role_id_permission_unique',
      columns: [table.roleId, table.permission],
    },
    roleIdIdx: {
      name: 'workspace_role_permissions_role_id_idx',
      columns: [table.roleId],
    },
  })
);
