import { EventTypes, createChildLogger, metrics } from '@serp/core';
import type amqp from 'amqplib';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';

import { db, processedEvents } from '../db';
import { getMongoClient } from '../mongo';
import { QUEUES } from '../queue/setup';

const logger = createChildLogger({ component: 'sample-event-consumer' });

export async function startSampleEventConsumer(channel: amqp.Channel): Promise<void> {
  logger.info('Starting sample event consumer...');
  
  await channel.consume(QUEUES.SAMPLE_EVENTS, async (msg) => {
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
      
      const startTime = Date.now();

      // Process event
      if (event.eventType === EventTypes.SAMPLE_EVENT_CREATED) {
        await handleSampleEventCreated(event);
      }

      // Mark as processed
      await db.insert(processedEvents).values({
        id: ulid(),
        eventId: event.eventId,
        consumerName: 'sample-event-consumer',
      });

      const duration = Date.now() - startTime;
      metrics.incrementCounter('worker_events_processed_total', { consumer: 'sample-event-consumer', status: 'success' });
      metrics.recordHistogram('worker_event_processing_duration_ms', duration, { consumer: 'sample-event-consumer' });

      channel.ack(msg);
      logger.info({ eventId: event.eventId, eventType: event.eventType }, 'Processed event');
    } catch (err) {
      metrics.incrementCounter('worker_events_processed_total', { consumer: 'sample-event-consumer', status: 'failure' });
      logger.error({ err }, 'Error processing event');
      // Reject and requeue (will go to DLQ after TTL)
      channel.nack(msg, false, false);
    }
  });
}

async function handleSampleEventCreated(event: { eventId: string; payload: { sampleId: string; data: string }; tenantId: string }): Promise<void> {
  // Update MongoDB projection
  const mongoClient = await getMongoClient();
  const db = mongoClient.db();
  const collection = db.collection('sample_projections');
  
  await collection.updateOne(
    { sampleId: event.payload.sampleId },
    {
      $set: {
        sampleId: event.payload.sampleId,
        data: event.payload.data,
        tenantId: event.tenantId,
        eventId: event.eventId,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
  
  logger.debug({ sampleId: event.payload.sampleId }, 'Updated MongoDB projection for sample');
}
