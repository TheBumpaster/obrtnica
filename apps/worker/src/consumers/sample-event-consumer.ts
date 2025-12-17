import { EventTypes } from '@serp/core';
import type amqp from 'amqplib';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';

import { db, processedEvents } from '../db';
import { getMongoClient } from '../mongo';
import { QUEUES } from '../queue/setup';

export async function startSampleEventConsumer(channel: amqp.Channel): Promise<void> {
  console.log('Starting sample event consumer...');
  
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
        console.log(`Event ${event.eventId} already processed, skipping`);
        channel.ack(msg);
        return;
      }
      
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
      
      channel.ack(msg);
      console.log(`Processed event ${event.eventId}`);
    } catch (err) {
      console.error('Error processing event:', err);
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
  
  console.log(`Updated MongoDB projection for sample ${event.payload.sampleId}`);
}
