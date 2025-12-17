import { eq, isNull } from 'drizzle-orm';

import { db, outboxEvents } from '../db';
import { getChannel } from '../queue/connection';
import { publishEvent } from '../queue/publisher';

export async function runOutboxDispatcher(): Promise<void> {
  console.log('Starting outbox dispatcher...');
  
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
        console.log(`Dispatched ${events.length} events from outbox`);
      }
    } catch (err) {
      console.error('Outbox dispatcher error:', err);
    }
  };
  
  // Run immediately, then on interval
  await dispatch();
  setInterval(dispatch, pollInterval);
}
