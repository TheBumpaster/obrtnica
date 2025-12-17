import { createChildLogger } from '@serp/core';
import { eq, isNull } from 'drizzle-orm';

import { db, outboxEvents } from '../db';
import { getChannel } from '../queue/connection';
import { publishEvent } from '../queue/publisher';

const logger = createChildLogger({ component: 'outbox-dispatcher' });

export async function runOutboxDispatcher(): Promise<void> {
  logger.info('Starting outbox dispatcher...');
  
  const pollInterval = 5000; // 5 seconds
  
  const dispatch = async () => {
    try {
      const channel = await getChannel();
      
      // Fetch unpublished events
      const events = await db
        .select()
        .from(outboxEvents)
        .where(isNull(outboxEvents.publishedAt))
        .limit(100);
      
      for (const event of events) {
        const domainEvent = {
          eventId: event.eventId,
          eventType: event.eventType,
          eventVersion: event.eventVersion,
          tenantId: event.tenantId,
          correlationId: event.correlationId || undefined,
          occurredAt: event.occurredAt,
          payload: event.payload,
        };
        
        await publishEvent(channel, domainEvent);
        
        // Mark as published
        await db
          .update(outboxEvents)
          .set({ publishedAt: new Date() })
          .where(eq(outboxEvents.id, event.id));
      }
      
      if (events.length > 0) {
        logger.debug({ count: events.length }, 'Dispatched events from outbox');
      }
    } catch (err) {
      logger.error({ err }, 'Outbox dispatcher error');
    }
  };
  
  // Run immediately, then on interval
  await dispatch();
  setInterval(dispatch, pollInterval);
}
