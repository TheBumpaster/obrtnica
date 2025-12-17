import { createChildLogger } from '@serp/core';
import type amqp from 'amqplib';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';

import { consumeAuthEmailEvent } from './auth-email-consumer';
import { consumeAuthOtpEvent } from './auth-otp-consumer';
import { db, processedEvents } from '../db';
import { QUEUES } from '../queue/setup';

const logger = createChildLogger({ component: 'auth-events-consumer' });

/**
 * Start auth events consumer
 * Handles email verification, password reset, magic links, and OTP codes
 */
export async function startAuthEventsConsumer(channel: amqp.Channel): Promise<void> {
  logger.info('Starting auth events consumer...');

  // Single queue handles all auth events (they're filtered by binding in setup)
  await channel.consume(QUEUES.AUTH_EVENTS, async (msg) => {
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

      // Route to appropriate handler based on event type
      if (event.eventType === 'auth.otp.requested') {
        await consumeAuthOtpEvent(event);
      } else {
        // Email-based events (verification, password reset, magic link)
        await consumeAuthEmailEvent(event);
      }

      // Mark as processed
      await db.insert(processedEvents).values({
        id: ulid(),
        eventId: event.eventId,
        consumerName: 'auth-events-consumer',
      });

      channel.ack(msg);
      logger.info({ eventType: event.eventType, eventId: event.eventId }, 'Processed auth event');
    } catch (error) {
      logger.error({ err: error }, 'Error processing auth event');
      // Negative acknowledgment - message will be requeued
      channel.nack(msg, false, true);
    }
  });

  logger.info({ queue: QUEUES.AUTH_EVENTS }, 'Auth events consumer started');
}
