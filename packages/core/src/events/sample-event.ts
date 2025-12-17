import type { DomainEvent } from '../types';
import { EventTypes } from './event-types';

export interface SampleEventPayload extends Record<string, unknown> {
  sampleId: string;
  data: string;
}

export function createSampleEvent(
  tenantId: string,
  payload: SampleEventPayload,
  correlationId?: string
): DomainEvent {
  return {
    eventId: crypto.randomUUID(),
    eventType: EventTypes.SAMPLE_EVENT_CREATED,
    eventVersion: '1.0.0',
    occurredAt: new Date(),
    tenantId,
    correlationId,
    payload,
  };
}
