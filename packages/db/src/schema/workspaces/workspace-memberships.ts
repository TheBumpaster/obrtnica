import { pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

import { workspaces } from './workspaces';
import { users } from '../auth/users';

export const workspaceMemberships = pgTable(
  'workspace_memberships',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 26 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    workspaceUserUnique: {
      name: 'workspace_memberships_workspace_id_user_id_unique',
      columns: [table.workspaceId, table.userId],
    },
    workspaceIdIdx: {
      name: 'workspace_memberships_workspace_id_idx',
      columns: [table.workspaceId],
    },
    userIdIdx: {
      name: 'workspace_memberships_user_id_idx',
      columns: [table.userId],
    },
  })
);
