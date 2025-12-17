import { v4 as uuidv4 } from 'uuid';

import type { DomainEvent } from '../types';
import { EventTypes } from './event-types';

export interface GdprEraseRequestedPayload {
  requestId: string;
  targetUserId: string;
  requesterUserId: string;
  scopeOrgId?: string | null;
  mode: 'ANONYMIZE' | 'DELETE';
}

export function createGdprEraseRequestedEvent(
  tenantId: string,
  payload: GdprEraseRequestedPayload,
  correlationId?: string
): DomainEvent {
  return {
    eventId: uuidv4(),
    eventType: EventTypes.GDPR_ERASE_REQUESTED,
    eventVersion: '1',
    tenantId,
    correlationId,
    occurredAt: new Date(),
    payload: payload as unknown as Record<string, unknown>,
  };
}
