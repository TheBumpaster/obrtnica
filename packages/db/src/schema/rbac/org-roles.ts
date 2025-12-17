import { boolean, integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { orgs } from '../tenant/orgs';

export const orgRoles = pgTable(
  'org_roles',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    orgId: varchar('org_id', { length: 26 })
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    isSystem: boolean('is_system').default(false).notNull(), // Platform-defined bootstrap roles
    version: integer('version').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    orgIdNameUnique: {
      name: 'org_roles_org_id_name_unique',
      columns: [table.orgId, table.name],
    },
  })
);
