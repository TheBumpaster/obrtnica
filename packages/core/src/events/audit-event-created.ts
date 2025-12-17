import { v4 as uuidv4 } from 'uuid';

import { sanitizeAuditEvent } from '../audit/sanitize';
import type { AuditEvent } from '../audit/types';
import type { DomainEvent } from '../types';
import { EventTypes } from './event-types';

/**
 * Creates a domain event wrapper for an audit event.
 * The audit event is sanitized before being placed in the payload.
 * 
 * @param auditEvent - The audit event to wrap
 * @param correlationId - Optional correlation ID (will use audit event's correlation ID if not provided)
 */
export function createAuditEventCreated(
  auditEvent: AuditEvent,
  correlationId?: string
): DomainEvent {
  // Sanitize the audit event before wrapping
  const sanitizedAuditEvent = sanitizeAuditEvent(auditEvent);

  return {
    eventId: uuidv4(),
    eventType: EventTypes.AUDIT_EVENT_CREATED,
    eventVersion: '1',
    tenantId: sanitizedAuditEvent.tenantId || 'system',
    correlationId: correlationId || sanitizedAuditEvent.correlationId,
    occurredAt: sanitizedAuditEvent.occurredAt,
    payload: {
      auditEvent: {
        id: sanitizedAuditEvent.id,
        occurredAt: sanitizedAuditEvent.occurredAt.toISOString(),
        eventType: sanitizedAuditEvent.eventType,
        eventVersion: sanitizedAuditEvent.eventVersion,
        severity: sanitizedAuditEvent.severity,
        tenantId: sanitizedAuditEvent.tenantId,
        actorType: sanitizedAuditEvent.actor.type,
        actorId: sanitizedAuditEvent.actor.id,
        actorDisplay: sanitizedAuditEvent.actor.display,
        ip: sanitizedAuditEvent.ip,
        userAgent: sanitizedAuditEvent.userAgent,
        requestId: sanitizedAuditEvent.requestId,
        correlationId: sanitizedAuditEvent.correlationId,
        resourceType: sanitizedAuditEvent.resourceType,
        resourceId: sanitizedAuditEvent.resourceId,
        action: sanitizedAuditEvent.action,
        status: sanitizedAuditEvent.status,
        reason: sanitizedAuditEvent.reason,
        dataClassification: sanitizedAuditEvent.dataTag.classification,
        dataCategories: sanitizedAuditEvent.dataTag.categories,
        metadata: sanitizedAuditEvent.metadata,
      },
    },
  };
}
