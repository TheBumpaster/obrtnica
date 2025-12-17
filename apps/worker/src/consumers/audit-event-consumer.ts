import { EventTypes } from '@serp/core';
import type amqp from 'amqplib';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import { z } from 'zod';

import { auditEvents, db, processedEvents } from '../db';
import { QUEUES } from '../queue/setup';

// Zod schema for validating audit event payload from queue
const auditEventPayloadSchema = z.object({
  auditEvent: z.object({
    id: z.string(),
    occurredAt: z.string(),
    eventType: z.string(),
    eventVersion: z.number(),
    severity: z.enum(['INFO', 'WARN', 'ERROR']),
    tenantId: z.string().optional(),
    actorType: z.enum(['USER', 'SERVICE', 'SYSTEM']),
    actorId: z.string().optional(),
    actorDisplay: z.string().optional(),
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    requestId: z.string().optional(),
    correlationId: z.string().optional(),
    resourceType: z.string().optional(),
    resourceId: z.string().optional(),
    action: z.string().optional(),
    status: z.enum(['SUCCESS', 'FAILURE']),
    reason: z.string().optional(),
    dataClassification: z.string(),
    dataCategories: z.array(z.string()),
    metadata: z.record(z.unknown()).optional(),
  }),
});

export async function startAuditEventConsumer(channel: amqp.Channel): Promise<void> {
  console.log('Starting audit event consumer...');

  await channel.consume(QUEUES.AUDIT_EVENTS, async (msg) => {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString());

      // Idempotency check
      const existing = await db
        .select()
        .from(processedEvents)
        .where(eq(processedEvents.eventId, event.eventId))
        .limit(1);

      if (existing.length > 0) {
        console.log(`Event ${event.eventId} already processed, skipping`);
        channel.ack(msg);
        return;
      }

      // Process audit event
      if (event.eventType === EventTypes.AUDIT_EVENT_CREATED) {
        await handleAuditEventCreated(event);
      }

      // Mark as processed
      await db.insert(processedEvents).values({
        id: ulid(),
        eventId: event.eventId,
        consumerName: 'audit-event-consumer',
      });

      channel.ack(msg);
      console.log(`Processed audit event ${event.eventId}`);
    } catch (err) {
      console.error('Error processing audit event:', err);
      // Reject and requeue (will go to DLQ after TTL)
      channel.nack(msg, false, false);
    }
  });
}

async function handleAuditEventCreated(event: {
  eventId: string;
  payload: unknown;
  tenantId: string;
  correlationId?: string;
}): Promise<void> {
  // Validate payload
  const validationResult = auditEventPayloadSchema.safeParse(event.payload);

  if (!validationResult.success) {
    console.error('Invalid audit event payload:', validationResult.error);
    throw new Error('Invalid audit event payload');
  }

  const { auditEvent } = validationResult.data;

  // Insert into audit_events table (append-only)
  await db.insert(auditEvents).values({
    id: auditEvent.id,
    occurredAt: new Date(auditEvent.occurredAt),
    eventType: auditEvent.eventType,
    eventVersion: auditEvent.eventVersion,
    severity: auditEvent.severity,
    tenantId: auditEvent.tenantId || null,
    actorType: auditEvent.actorType,
    actorId: auditEvent.actorId || null,
    actorDisplay: auditEvent.actorDisplay || null,
    ip: auditEvent.ip || null,
    userAgent: auditEvent.userAgent || null,
    requestId: auditEvent.requestId || null,
    correlationId: auditEvent.correlationId || null,
    resourceType: auditEvent.resourceType || null,
    resourceId: auditEvent.resourceId || null,
    action: auditEvent.action || null,
    status: auditEvent.status,
    reason: auditEvent.reason || null,
    dataClassification: auditEvent.dataClassification,
    dataCategories: auditEvent.dataCategories,
    metadata: auditEvent.metadata || null,
  });

  console.log(
    `Wrote audit event ${auditEvent.id} (${auditEvent.eventType}) to audit_events table`
  );
}
