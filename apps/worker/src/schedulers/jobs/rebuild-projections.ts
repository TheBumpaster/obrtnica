import { createChildLogger } from '@serp/core';
import { desc, eq } from 'drizzle-orm';

import { db, outboxEvents } from '../../db';
import { getMongoClient } from '../../mongo';

const logger = createChildLogger({ component: 'rebuild-projections' });

/**
 * Rebuild MongoDB projections from outbox events
 * This is an on-demand job that can be triggered manually
 * Runs on-demand (not scheduled by default)
 */
export async function rebuildProjections(): Promise<void> {
  logger.info('Starting projection rebuild');

  const mongoClient = await getMongoClient();
  const mongoDb = mongoClient.db();
  const collection = mongoDb.collection('sample_projections');

  // Drop existing projections
  await collection.deleteMany({});
  logger.info('Dropped existing sample_projections');

  // Fetch all sample events from outbox (ordered by occurred_at)
  const events = await db
    .select()
    .from(outboxEvents)
    .where(eq(outboxEvents.eventType, 'sample.event.created'))
    .orderBy(desc(outboxEvents.occurredAt));

  logger.info({ eventCount: events.length }, 'Processing events for projection rebuild');

  // Rebuild projections
  for (const event of events) {
    try {
      const payload = event.payload as { sampleId: string; data: string };
      
      await collection.updateOne(
        { sampleId: payload.sampleId },
        {
          $set: {
            sampleId: payload.sampleId,
            data: payload.data,
            tenantId: event.tenantId,
            eventId: event.eventId,
            updatedAt: event.occurredAt,
          },
          $setOnInsert: {
            createdAt: event.occurredAt,
          },
        },
        { upsert: true }
      );
    } catch (err) {
      logger.error({ err, eventId: event.eventId }, 'Failed to rebuild projection for event');
    }
  }

  logger.info({ rebuiltCount: events.length }, 'Projection rebuild completed');
}
