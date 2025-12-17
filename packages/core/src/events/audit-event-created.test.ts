import { describe, it, expect } from 'vitest';

import { buildPermissionDeniedAuditEvent, buildUserActor } from '../audit/builders';
import type { AuditEvent } from '../audit/types';
import { DataCategories, DataClassifications } from '../types';
import { createAuditEventCreated } from './audit-event-created';
import { EventTypes } from './event-types';

describe('createAuditEventCreated', () => {
  it('should create a domain event wrapper for an audit event', () => {
    const auditEvent = buildPermissionDeniedAuditEvent({
      tenantId: 'tenant1',
      actor: buildUserActor('user1', 'test@example.com'),
      requestId: 'req123',
      correlationId: 'corr123',
      resourceType: 'Invoice',
      resourceId: 'inv123',
      permission: 'billing:write',
    });

    const domainEvent = createAuditEventCreated(auditEvent, 'corr123');

    expect(domainEvent.eventType).toBe(EventTypes.AUDIT_EVENT_CREATED);
    expect(domainEvent.eventVersion).toBe('1');
    expect(domainEvent.tenantId).toBe('tenant1');
    expect(domainEvent.correlationId).toBe('corr123');
    const payload = domainEvent.payload as { auditEvent: Record<string, unknown> };
    expect(payload.auditEvent).toBeDefined();
    expect(payload.auditEvent.id).toBe(auditEvent.id);
    expect(payload.auditEvent.eventType).toBe(auditEvent.eventType);
  });

  it('should sanitize audit event metadata', () => {
    const auditEvent = buildPermissionDeniedAuditEvent({
      tenantId: 'tenant1',
      actor: buildUserActor('user1'),
    });

    // Manually add a forbidden key (this would normally be sanitized by builders)
    (auditEvent as AuditEvent & { metadata: Record<string, unknown> }).metadata = { userId: 'user1', password: 'secret' };

    const domainEvent = createAuditEventCreated(auditEvent);

    const payload = domainEvent.payload as { auditEvent: Record<string, unknown> };
    expect(payload.auditEvent.metadata).toEqual({ userId: 'user1' });
    expect(payload.auditEvent.metadata).not.toHaveProperty('password');
  });

  it('should use audit event correlation ID if not provided', () => {
    const auditEvent = buildPermissionDeniedAuditEvent({
      tenantId: 'tenant1',
      actor: buildUserActor('user1'),
      correlationId: 'audit-corr-123',
    });

    const domainEvent = createAuditEventCreated(auditEvent);

    expect(domainEvent.correlationId).toBe('audit-corr-123');
  });

  it('should use system as tenantId if audit event has no tenantId', () => {
    const auditEvent = buildPermissionDeniedAuditEvent({
      actor: buildUserActor('user1'),
    });

    const domainEvent = createAuditEventCreated(auditEvent);

    expect(domainEvent.tenantId).toBe('system');
  });

  it('should serialize audit event fields correctly', () => {
    const auditEvent = buildPermissionDeniedAuditEvent({
      tenantId: 'tenant1',
      actor: buildUserActor('user1', 'test@example.com'),
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      requestId: 'req123',
      correlationId: 'corr123',
      resourceType: 'Invoice',
      resourceId: 'inv123',
      permission: 'billing:write',
    });

    const domainEvent = createAuditEventCreated(auditEvent);
    const payload = domainEvent.payload.auditEvent as Record<string, unknown>;

    expect(payload.id).toBe(auditEvent.id);
    expect(payload.occurredAt).toBe(auditEvent.occurredAt.toISOString());
    expect(payload.eventType).toBe(auditEvent.eventType);
    expect(payload.actorType).toBe('USER');
    expect(payload.actorId).toBe('user1');
    expect(payload.actorDisplay).toBe('test@example.com');
    expect(payload.ip).toBe('192.168.1.1');
    expect(payload.userAgent).toBe('Mozilla/5.0');
    expect(payload.dataClassification).toBe(DataClassifications.RESTRICTED);
    expect(payload.dataCategories).toContain(DataCategories.AUDIT);
  });
});
