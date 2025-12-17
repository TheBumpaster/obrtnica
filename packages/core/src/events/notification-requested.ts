import { EventTypes } from './event-types';
import type { DomainEvent } from './types';

export interface NotificationRequestedPayload {
  notificationId: string;
  recipientId: string;
  orgId: string;
  channels: Array<'email' | 'sms' | 'push' | 'in_app'>;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export function createNotificationRequested(
  eventId: string,
  tenantId: string,
  payload: NotificationRequestedPayload,
  correlationId?: string
): DomainEvent {
  return {
    eventId,
    eventType: EventTypes.NOTIFICATION_REQUESTED,
    eventVersion: '1.0.0',
    tenantId,
    correlationId,
    occurredAt: new Date(),
    payload,
  };
}
