import { integer, jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const auditEvents = pgTable(
  'audit_events',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    occurredAt: timestamp('occurred_at').notNull(),
    eventType: text('event_type').notNull(),
    eventVersion: integer('event_version').notNull(),
    severity: text('severity').notNull(),
    tenantId: varchar('tenant_id', { length: 26 }),
    actorType: text('actor_type').notNull(),
    actorId: varchar('actor_id', { length: 26 }),
    actorDisplay: text('actor_display'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    requestId: varchar('request_id', { length: 26 }),
    correlationId: varchar('correlation_id', { length: 36 }),
    resourceType: text('resource_type'),
    resourceId: varchar('resource_id', { length: 26 }),
    action: text('action'),
    status: text('status').notNull(),
    reason: text('reason'),
    dataClassification: text('data_classification').notNull(),
    dataCategories: jsonb('data_categories').$type<string[]>().notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  },
  (table) => ({
    tenantIdOccurredAtIdx: {
      name: 'audit_events_tenant_id_occurred_at_idx',
      columns: [table.tenantId, table.occurredAt],
    },
    actorIdOccurredAtIdx: {
      name: 'audit_events_actor_id_occurred_at_idx',
      columns: [table.actorId, table.occurredAt],
    },
    eventTypeOccurredAtIdx: {
      name: 'audit_events_event_type_occurred_at_idx',
      columns: [table.eventType, table.occurredAt],
    },
    requestIdIdx: {
      name: 'audit_events_request_id_idx',
      columns: [table.requestId],
    },
    correlationIdIdx: {
      name: 'audit_events_correlation_id_idx',
      columns: [table.correlationId],
    },
  })
);
