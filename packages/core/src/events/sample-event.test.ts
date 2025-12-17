import { describe, it, expect } from 'vitest';

import { EventTypes } from './event-types';
import { createSampleEvent } from './sample-event';

describe('createSampleEvent', () => {
  it('should create a valid sample event', () => {
    const event = createSampleEvent(
      'org123',
      { sampleId: 'sample123', data: 'test data' },
      'corr123'
    );

    expect(event.eventType).toBe(EventTypes.SAMPLE_EVENT_CREATED);
    expect(event.eventVersion).toBe('1.0.0');
    expect(event.tenantId).toBe('org123');
    expect(event.correlationId).toBe('corr123');
    expect(event.payload.sampleId).toBe('sample123');
    expect(event.payload.data).toBe('test data');
    expect(event.eventId).toBeTruthy();
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it('should work without correlation ID', () => {
    const event = createSampleEvent(
      'org123',
      { sampleId: 'sample123', data: 'test' }
    );

    expect(event.correlationId).toBeUndefined();
  });
});
