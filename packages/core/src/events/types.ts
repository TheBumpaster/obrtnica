/**
 * Core domain event types
 */

export interface DomainEvent<TPayload = unknown> {
  eventId: string;
  eventType: string;
  eventVersion: string;
  tenantId?: string;
  occurredAt: Date;
  correlationId?: string;
  payload: TPayload;
}
