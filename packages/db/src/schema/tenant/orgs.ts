import { integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const orgs = pgTable('orgs', {
  id: varchar('id', { length: 26 }).primaryKey(),
  name: text('name').notNull(),
  type: text('type'),
  address: text('address'),
  city: text('city'),
  postalCode: text('postal_code'),
  registrationNumber: text('registration_number'),
  idNumber: text('id_number'),
  vatNumber: text('vat_number'),
  responsibleName: text('responsible_name'),
  responsibleSurname: text('responsible_surname'),
  version: integer('version').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
