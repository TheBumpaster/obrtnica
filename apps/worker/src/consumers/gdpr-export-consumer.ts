import {
  AuditEventTypes,
  buildAuditEvent,
  buildSystemActor,
  createAuditEventCreated,
  createGdprService,
  DataCategories,
  DataClassifications,
  EventTypes,
} from '@serp/core';
import type amqp from 'amqplib';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import { z } from 'zod';

import { LocalFsStorageAdapter } from '../adapters/storage/local-fs';
import { db, gdprRequests, outboxEvents, processedEvents } from '../db';
import { QUEUES } from '../queue/setup';
import { DrizzleGdprRepository } from '../services/gdpr-repository';

const gdprExportPayloadSchema = z.object({
  requestId: z.string(),
  targetUserId: z.string(),
  requesterUserId: z.string(),
  scopeOrgId: z.string().nullable().optional(),
});

const storageAdapter = new LocalFsStorageAdapter({
  basePath: process.env.STORAGE_BASE_PATH || './.local-storage',
});

const gdprService = createGdprService(new DrizzleGdprRepository(db));

export async function startGdprExportConsumer(channel: amqp.Channel): Promise<void> {
  console.log('Starting GDPR export consumer...');

  await channel.consume(QUEUES.GDPR_EXPORT, async (msg) => {
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

      // Process export
      if (event.eventType === EventTypes.GDPR_EXPORT_REQUESTED) {
        await handleGdprExportRequested(event);
      }

      // Mark as processed
      await db.insert(processedEvents).values({
        id: ulid(),
        eventId: event.eventId,
        consumerName: 'gdpr-export-consumer',
      });

      channel.ack(msg);
      console.log(`Processed GDPR export event ${event.eventId}`);
    } catch (err) {
      console.error('Error processing GDPR export event:', err);
      channel.nack(msg, false, false);
    }
  });
}

async function handleGdprExportRequested(event: {
  eventId: string;
  payload: unknown;
  tenantId: string;
  correlationId?: string;
}): Promise<void> {
  const validationResult = gdprExportPayloadSchema.safeParse(event.payload);

  if (!validationResult.success) {
    console.error('Invalid GDPR export payload:', validationResult.error);
    throw new Error('Invalid GDPR export payload');
  }

  const { requestId, targetUserId, scopeOrgId } = validationResult.data;

  try {
    // Update status to PROCESSING
    await db
      .update(gdprRequests)
      .set({ status: 'PROCESSING' })
      .where(eq(gdprRequests.id, requestId));

    // Build export bundle
    const exportData = await gdprService.buildExportBundle({
      targetUserId,
      scopeOrgId: scopeOrgId || null,
    });

    // Convert to JSON and store
    const exportJson = JSON.stringify(exportData, null, 2);
    const exportBuffer = Buffer.from(exportJson, 'utf-8');

    const storageKey = `exports/gdpr/${requestId}.json`;
    const { location, checksum } = await storageAdapter.putObject(
      storageKey,
      exportBuffer,
      'application/json'
    );

    // Calculate expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Update request to COMPLETED
    await db.transaction(async (tx) => {
      await tx
        .update(gdprRequests)
        .set({
          status: 'COMPLETED',
          processedAt: new Date(),
          resultLocation: location,
          checksum,
          expiresAt,
        })
        .where(eq(gdprRequests.id, requestId));

      // Emit audit event for completion
      const auditEvent = buildAuditEvent({
        eventType: AuditEventTypes.DATA_EXPORT_COMPLETED,
        tenantId: scopeOrgId || undefined,
        actor: buildSystemActor('gdpr-export-worker'),
        correlationId: event.correlationId,
        resourceType: 'GdprRequest',
        resourceId: requestId,
        action: 'EXPORT',
        status: 'SUCCESS',
        dataTag: {
          classification: DataClassifications.RESTRICTED,
          categories: [DataCategories.IDENTITY, DataCategories.AUDIT],
        },
        metadata: {
          targetUserId,
          exportSize: exportBuffer.length,
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

    console.log(`Export completed for request ${requestId}`);
  } catch (error) {
    console.error(`Export failed for request ${requestId}:`, error);

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
        eventType: AuditEventTypes.DATA_EXPORT_FAILED,
        tenantId: scopeOrgId || undefined,
        actor: buildSystemActor('gdpr-export-worker'),
        correlationId: event.correlationId,
        resourceType: 'GdprRequest',
        resourceId: requestId,
        action: 'EXPORT',
        status: 'FAILURE',
        severity: 'ERROR',
        reason: error instanceof Error ? error.message : 'Unknown error',
        dataTag: {
          classification: DataClassifications.RESTRICTED,
          categories: [DataCategories.IDENTITY, DataCategories.AUDIT],
        },
        metadata: {
          targetUserId,
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
