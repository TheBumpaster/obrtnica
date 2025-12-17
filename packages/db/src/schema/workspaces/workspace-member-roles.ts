import { pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

import { workspaceMemberships } from './workspace-memberships';
import { workspaceRoles } from './workspace-roles';

export const workspaceMemberRoles = pgTable(
  'workspace_member_roles',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    membershipId: varchar('membership_id', { length: 26 })
      .notNull()
      .references(() => workspaceMemberships.id, { onDelete: 'cascade' }),
    roleId: varchar('role_id', { length: 26 })
      .notNull()
      .references(() => workspaceRoles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    membershipRoleUnique: {
      name: 'workspace_member_roles_membership_id_role_id_unique',
      columns: [table.membershipId, table.roleId],
    },
    membershipIdIdx: {
      name: 'workspace_member_roles_membership_id_idx',
      columns: [table.membershipId],
    },
  })
);
