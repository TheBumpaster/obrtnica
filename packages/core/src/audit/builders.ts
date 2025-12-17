import { ulid } from 'ulid';

import { DataCategories, DataClassifications } from '../types';
import type { DataTag } from '../types';
import { sanitizeAuditEvent } from './sanitize';
import { ActorType, AuditEventTypes, AuditSeverity, AuditStatus } from './types';
import type { AuditActor, AuditEvent, AuditEventType } from './types';

export interface BuildAuditEventParams {
  eventType: string;
  tenantId?: string;
  actor: AuditActor;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  correlationId?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  status: 'SUCCESS' | 'FAILURE';
  severity?: 'INFO' | 'WARN' | 'ERROR';
  reason?: string;
  dataTag: DataTag;
  metadata?: Record<string, unknown>;
}

/**
 * Generic audit event builder.
 * Always sanitizes metadata before returning.
 */
export function buildAuditEvent(params: BuildAuditEventParams): AuditEvent {
  const event: AuditEvent = {
    id: ulid(),
    occurredAt: new Date(),
    eventType: params.eventType as AuditEventType,
    eventVersion: 1,
    severity: params.severity || AuditSeverity.INFO,
    tenantId: params.tenantId,
    actor: params.actor,
    ip: params.ip,
    userAgent: params.userAgent,
    requestId: params.requestId,
    correlationId: params.correlationId,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    action: params.action,
    status: params.status === 'SUCCESS' ? AuditStatus.SUCCESS : AuditStatus.FAILURE,
    reason: params.reason,
    dataTag: params.dataTag,
    metadata: params.metadata,
  };

  return sanitizeAuditEvent(event);
}

/**
 * Builder for permission denied audit events.
 */
export function buildPermissionDeniedAuditEvent(params: {
  tenantId?: string;
  actor: AuditActor;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  correlationId?: string;
  resourceType?: string;
  resourceId?: string;
  permission?: string;
  reason?: string;
}): AuditEvent {
  return buildAuditEvent({
    eventType: AuditEventTypes.SECURITY_PERMISSION_DENIED,
    tenantId: params.tenantId,
    actor: params.actor,
    ip: params.ip,
    userAgent: params.userAgent,
    requestId: params.requestId,
    correlationId: params.correlationId,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    action: 'ACCESS_DENIED',
    status: 'FAILURE',
    severity: AuditSeverity.WARN,
    reason: params.reason || 'permission_denied',
    dataTag: {
      classification: DataClassifications.RESTRICTED,
      categories: [DataCategories.AUDIT],
    },
    metadata: params.permission ? { permission: params.permission } : undefined,
  });
}

/**
 * Builder for data write audit events (create/update/delete).
 */
export function buildDomainWriteAuditEvent(params: {
  tenantId: string;
  actor: AuditActor;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  correlationId?: string;
  resourceType: string;
  resourceId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  dataTag?: DataTag;
  metadata?: Record<string, unknown>;
}): AuditEvent {
  const eventTypeMap = {
    CREATE: AuditEventTypes.DATA_WRITE_CREATED,
    UPDATE: AuditEventTypes.DATA_WRITE_UPDATED,
    DELETE: AuditEventTypes.DATA_WRITE_DELETED,
  };

  return buildAuditEvent({
    eventType: eventTypeMap[params.action],
    tenantId: params.tenantId,
    actor: params.actor,
    ip: params.ip,
    userAgent: params.userAgent,
    requestId: params.requestId,
    correlationId: params.correlationId,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    action: params.action,
    status: 'SUCCESS',
    severity: AuditSeverity.INFO,
    dataTag: params.dataTag || {
      classification: DataClassifications.CONFIDENTIAL,
      categories: [DataCategories.TENANT, DataCategories.CONTENT],
    },
    metadata: params.metadata,
  });
}

/**
 * Builder for system/service actor.
 */
export function buildSystemActor(serviceName?: string): AuditActor {
  return {
    type: ActorType.SYSTEM,
    display: serviceName || 'system',
  };
}

/**
 * Builder for user actor.
 */
export function buildUserActor(userId: string, userDisplay?: string): AuditActor {
  return {
    type: ActorType.USER,
    id: userId,
    display: userDisplay,
  };
}
