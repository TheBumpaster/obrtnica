import { v4 as uuidv4 } from 'uuid';

import type { DomainEvent } from '../types';
import { EventTypes } from './event-types';

export interface GdprExportRequestedPayload {
  requestId: string;
  targetUserId: string;
  requesterUserId: string;
  scopeOrgId?: string | null;
}

export function createGdprExportRequestedEvent(
  tenantId: string,
  payload: GdprExportRequestedPayload,
  correlationId?: string
): DomainEvent {
  return {
    eventId: uuidv4(),
    eventType: EventTypes.GDPR_EXPORT_REQUESTED,
    eventVersion: '1',
    tenantId,
    correlationId,
    occurredAt: new Date(),
    payload: payload as unknown as Record<string, unknown>,
  };
}
