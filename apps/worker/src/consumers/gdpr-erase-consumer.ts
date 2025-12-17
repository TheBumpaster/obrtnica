import {
  AuditEventTypes,
  buildAuditEvent,
  buildSystemActor,
  createAuditEventCreated,
  createChildLogger,
  createGdprService,
  DataCategories,
  DataClassifications,
  EventTypes,
} from '@serp/core';
import type amqp from 'amqplib';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import { z } from 'zod';

import { db, gdprRequests, outboxEvents, processedEvents } from '../db';
import { getMongoClient } from '../mongo';
import { QUEUES } from '../queue/setup';
import { DrizzleGdprRepository } from '../services/gdpr-repository';

const gdprErasePayloadSchema = z.object({
  requestId: z.string(),
  targetUserId: z.string(),
  requesterUserId: z.string(),
  scopeOrgId: z.string().nullable().optional(),
  mode: z.enum(['ANONYMIZE', 'DELETE']),
});

const logger = createChildLogger({ component: 'gdpr-erase-consumer' });

export async function startGdprEraseConsumer(channel: amqp.Channel): Promise<void> {
  logger.info('Starting GDPR erase consumer...');

  await channel.consume(QUEUES.GDPR_ERASE, async (msg) => {
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
        logger.debug({ eventId: event.eventId }, 'Event already processed, skipping');
        channel.ack(msg);
        return;
      }

      // Process erasure
      if (event.eventType === EventTypes.GDPR_ERASE_REQUESTED) {
        await handleGdprEraseRequested(event);
      }

      // Mark as processed
      await db.insert(processedEvents).values({
        id: ulid(),
        eventId: event.eventId,
        consumerName: 'gdpr-erase-consumer',
      });

      channel.ack(msg);
      logger.info({ eventId: event.eventId }, 'Processed GDPR erase event');
    } catch (err) {
      logger.error({ err }, 'Error processing GDPR erase event');
      channel.nack(msg, false, false);
    }
  });
}

async function handleGdprEraseRequested(event: {
  eventId: string;
  payload: unknown;
  tenantId: string;
  correlationId?: string;
}): Promise<void> {
  const validationResult = gdprErasePayloadSchema.safeParse(event.payload);

  if (!validationResult.success) {
    logger.error({ error: validationResult.error }, 'Invalid GDPR erase payload');
    throw new Error('Invalid GDPR erase payload');
  }

  const { requestId, targetUserId, scopeOrgId, mode } = validationResult.data;

  try {
    // Update status to PROCESSING
    await db
      .update(gdprRequests)
      .set({ status: 'PROCESSING' })
      .where(eq(gdprRequests.id, requestId));

    // Perform erasure
    await db.transaction(async (tx) => {
      const transactionalService = createGdprService(new DrizzleGdprRepository(tx));
      await transactionalService.eraseUserData({
        targetUserId,
        scopeOrgId: scopeOrgId || null,
        mode,
      });
    });

    await cleanupMongoProjections(targetUserId, scopeOrgId || null);

    // Update request to COMPLETED
    await db.transaction(async (tx) => {
      await tx
        .update(gdprRequests)
        .set({
          status: 'COMPLETED',
          processedAt: new Date(),
        })
        .where(eq(gdprRequests.id, requestId));

      // Emit audit event for completion
      const auditEvent = buildAuditEvent({
        eventType: AuditEventTypes.DATA_ERASE_COMPLETED,
        tenantId: scopeOrgId || undefined,
        actor: buildSystemActor('gdpr-erase-worker'),
        correlationId: event.correlationId,
        resourceType: 'GdprRequest',
        resourceId: requestId,
        action: 'ERASE',
        status: 'SUCCESS',
        dataTag: {
          classification: DataClassifications.RESTRICTED,
          categories: [DataCategories.IDENTITY, DataCategories.AUDIT],
        },
        metadata: {
          targetUserId,
          mode,
        },
      });

      const domainEvent = createAuditEventCreated(auditEvent, event.correlationId);

      await tx.insert(outboxEvents).values({
        id: ulid(),
        eventId: domainEvent.eventId,
        eventType: domainEvent.eventType,
        eventVersion: domainEvent.eventVersion,
        tenantId: domainEvent.tenantId,
        correlationId: domainEvent.correlationId,
        payload: domainEvent.payload,
        occurredAt: domainEvent.occurredAt,
      });
    });

    logger.info({ requestId }, 'Erasure completed');
  } catch (error) {
    logger.error({ err: error, requestId }, 'Erasure failed');

    // Update to FAILED with reason
    await db.transaction(async (tx) => {
      await tx
        .update(gdprRequests)
        .set({
          status: 'FAILED',
          processedAt: new Date(),
          failureReason: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(gdprRequests.id, requestId));

      // Emit audit event for failure
      const auditEvent = buildAuditEvent({
        eventType: AuditEventTypes.DATA_ERASE_FAILED,
        tenantId: scopeOrgId || undefined,
        actor: buildSystemActor('gdpr-erase-worker'),
        correlationId: event.correlationId,
        resourceType: 'GdprRequest',
        resourceId: requestId,
        action: 'ERASE',
        status: 'FAILURE',
        severity: 'ERROR',
        reason: error instanceof Error ? error.message : 'Unknown error',
        dataTag: {
          classification: DataClassifications.RESTRICTED,
          categories: [DataCategories.IDENTITY, DataCategories.AUDIT],
        },
        metadata: {
          targetUserId,
          mode,
        },
      });

      const domainEvent = createAuditEventCreated(auditEvent, event.correlationId);

      await tx.insert(outboxEvents).values({
        id: ulid(),
        eventId: domainEvent.eventId,
        eventType: domainEvent.eventType,
        eventVersion: domainEvent.eventVersion,
        tenantId: domainEvent.tenantId,
        correlationId: domainEvent.correlationId,
        payload: domainEvent.payload,
        occurredAt: domainEvent.occurredAt,
      });
    });

    throw error;
  }
}

async function cleanupMongoProjections(targetUserId: string, scopeOrgId: string | null): Promise<void> {
  try {
    const mongoClient = await getMongoClient();
    const db = mongoClient.db();

    // Delete sample projections (scoped if needed)
    const sampleCollection = db.collection('sample_projections');
    
    if (scopeOrgId) {
      await sampleCollection.deleteMany({ tenantId: scopeOrgId });
    } else {
      // For global erasure, we could delete all user-related projections
      // Currently sample_projections don't have userId, so we skip
      logger.debug('Global erasure: no user-scoped projections to clean in Mongo');
    }

    logger.debug('Mongo projections cleanup completed (best-effort)');
  } catch (error) {
    logger.error({ err: error }, 'Mongo cleanup failed (non-fatal)');
    // Don't throw - Mongo cleanup is best-effort
  }
}
