import type { AuditEvent } from '@serp/core';
import { createAuditEventCreated } from '@serp/core';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { ulid } from 'ulid';

import type { Database } from '../db';
import { outboxEvents } from '../db';
import type * as dbSchema from '../db/schema';

/**
 * Enqueues an audit event to the outbox for asynchronous processing.
 * Should be called within a database transaction when auditing transactional operations.
 * 
 * @param txOrDb - Database instance or transaction
 * @param auditEvent - The audit event to enqueue
 */
type AnyPgTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof dbSchema,
  ExtractTablesWithRelations<typeof dbSchema>
>;

export async function enqueueAuditEvent(
  txOrDb: Database | AnyPgTransaction,
  auditEvent: AuditEvent
): Promise<void> {
  // Wrap audit event in domain event
  const domainEvent = createAuditEventCreated(auditEvent, auditEvent.correlationId);

  // Write to outbox (will be dispatched by worker)
  await txOrDb.insert(outboxEvents).values({
    id: ulid(),
    eventId: domainEvent.eventId,
    eventType: domainEvent.eventType,
    eventVersion: domainEvent.eventVersion,
    tenantId: domainEvent.tenantId,
    correlationId: domainEvent.correlationId,
    payload: domainEvent.payload,
    occurredAt: domainEvent.occurredAt,
  });
}
