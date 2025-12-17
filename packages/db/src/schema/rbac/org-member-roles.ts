import { pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

import { orgRoles } from './org-roles';
import { orgMemberships } from '../tenant/org-memberships';

export const orgMemberRoles = pgTable(
  'org_member_roles',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    membershipId: varchar('membership_id', { length: 26 })
      .notNull()
      .references(() => orgMemberships.id, { onDelete: 'cascade' }),
    roleId: varchar('role_id', { length: 26 })
      .notNull()
      .references(() => orgRoles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    membershipRoleUnique: {
      name: 'org_member_roles_membership_id_role_id_unique',
      columns: [table.membershipId, table.roleId],
    },
    membershipIdIdx: {
      name: 'org_member_roles_membership_id_idx',
      columns: [table.membershipId],
    },
  })
);
