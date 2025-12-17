import type { DomainEvent } from '@serp/core';
import type amqp from 'amqplib';

import { EXCHANGES } from './setup';

export async function publishEvent(channel: amqp.Channel, event: DomainEvent): Promise<void> {
  const routingKey = event.eventType.replace('.', '.');
  
  const message = Buffer.from(JSON.stringify(event));
  
  channel.publish(
    EXCHANGES.DOMAIN_EVENTS,
    routingKey,
    message,
    {
      persistent: true,
      contentType: 'application/json',
      messageId: event.eventId,
      correlationId: event.correlationId || event.eventId,
      timestamp: event.occurredAt.getTime(),
    }
  );
  
  console.log(`Published event ${event.eventType} (${event.eventId})`);
}
