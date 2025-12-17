import { describe, it, expect } from 'vitest';

import { DataCategories, DataClassifications } from '../types';
import {
  buildAuditEvent,
  buildPermissionDeniedAuditEvent,
  buildDomainWriteAuditEvent,
  buildSystemActor,
  buildUserActor,
} from './builders';
import { ActorType, AuditEventTypes, AuditSeverity, AuditStatus } from './types';

describe('buildAuditEvent', () => {
  it('should build a basic audit event', () => {
    const event = buildAuditEvent({
      eventType: AuditEventTypes.AUTH_LOGIN_SUCCESS,
      tenantId: 'tenant1',
      actor: buildUserActor('user1', 'test@example.com'),
      status: 'SUCCESS',
      dataTag: {
        classification: DataClassifications.RESTRICTED,
        categories: [DataCategories.AUTH],
      },
    });

    expect(event.id).toBeTruthy();
    expect(event.eventType).toBe(AuditEventTypes.AUTH_LOGIN_SUCCESS);
    expect(event.tenantId).toBe('tenant1');
    expect(event.actor.type).toBe(ActorType.USER);
    expect(event.actor.id).toBe('user1');
    expect(event.status).toBe(AuditStatus.SUCCESS);
    expect(event.severity).toBe(AuditSeverity.INFO);
    expect(event.eventVersion).toBe(1);
  });

  it('should sanitize metadata in built event', () => {
    const event = buildAuditEvent({
      eventType: AuditEventTypes.DATA_WRITE_CREATED,
      tenantId: 'tenant1',
      actor: buildUserActor('user1'),
      status: 'SUCCESS',
      dataTag: {
        classification: DataClassifications.CONFIDENTIAL,
        categories: [DataCategories.CONTENT],
      },
      metadata: {
        resourceId: 'res1',
        password: 'secret123',
      },
    });

    expect(event.metadata).toEqual({ resourceId: 'res1' });
    expect(event.metadata).not.toHaveProperty('password');
  });
});

describe('buildPermissionDeniedAuditEvent', () => {
  it('should build permission denied event with correct defaults', () => {
    const event = buildPermissionDeniedAuditEvent({
      tenantId: 'tenant1',
      actor: buildUserActor('user1', 'test@example.com'),
      requestId: 'req123',
      correlationId: 'corr123',
      resourceType: 'Invoice',
      resourceId: 'inv123',
      permission: 'billing:write',
    });

    expect(event.eventType).toBe(AuditEventTypes.SECURITY_PERMISSION_DENIED);
    expect(event.status).toBe(AuditStatus.FAILURE);
    expect(event.severity).toBe(AuditSeverity.WARN);
    expect(event.action).toBe('ACCESS_DENIED');
    expect(event.reason).toBe('permission_denied');
    expect(event.dataTag.classification).toBe(DataClassifications.RESTRICTED);
    expect(event.dataTag.categories).toContain(DataCategories.AUDIT);
    expect(event.metadata).toEqual({ permission: 'billing:write' });
  });

  it('should handle custom reason', () => {
    const event = buildPermissionDeniedAuditEvent({
      actor: buildUserActor('user1'),
      reason: 'tenant_scope_violation',
    });

    expect(event.reason).toBe('tenant_scope_violation');
  });
});

describe('buildDomainWriteAuditEvent', () => {
  it('should build CREATE audit event', () => {
    const event = buildDomainWriteAuditEvent({
      tenantId: 'tenant1',
      actor: buildUserActor('user1'),
      resourceType: 'SampleEntity',
      resourceId: 'sample123',
      action: 'CREATE',
      metadata: { count: 1 },
    });

    expect(event.eventType).toBe(AuditEventTypes.DATA_WRITE_CREATED);
    expect(event.action).toBe('CREATE');
    expect(event.status).toBe(AuditStatus.SUCCESS);
    expect(event.resourceType).toBe('SampleEntity');
    expect(event.resourceId).toBe('sample123');
    expect(event.metadata).toEqual({ count: 1 });
  });

  it('should build UPDATE audit event', () => {
    const event = buildDomainWriteAuditEvent({
      tenantId: 'tenant1',
      actor: buildUserActor('user1'),
      resourceType: 'SampleEntity',
      resourceId: 'sample123',
      action: 'UPDATE',
    });

    expect(event.eventType).toBe(AuditEventTypes.DATA_WRITE_UPDATED);
    expect(event.action).toBe('UPDATE');
  });

  it('should build DELETE audit event', () => {
    const event = buildDomainWriteAuditEvent({
      tenantId: 'tenant1',
      actor: buildUserActor('user1'),
      resourceType: 'SampleEntity',
      resourceId: 'sample123',
      action: 'DELETE',
    });

    expect(event.eventType).toBe(AuditEventTypes.DATA_WRITE_DELETED);
    expect(event.action).toBe('DELETE');
  });

  it('should use default data tag if not provided', () => {
    const event = buildDomainWriteAuditEvent({
      tenantId: 'tenant1',
      actor: buildUserActor('user1'),
      resourceType: 'SampleEntity',
      resourceId: 'sample123',
      action: 'CREATE',
    });

    expect(event.dataTag.classification).toBe(DataClassifications.CONFIDENTIAL);
    expect(event.dataTag.categories).toContain(DataCategories.TENANT);
    expect(event.dataTag.categories).toContain(DataCategories.CONTENT);
  });
});

describe('actor builders', () => {
  it('should build system actor', () => {
    const actor = buildSystemActor('outbox-dispatcher');

    expect(actor.type).toBe(ActorType.SYSTEM);
    expect(actor.display).toBe('outbox-dispatcher');
  });

  it('should build system actor with default name', () => {
    const actor = buildSystemActor();

    expect(actor.type).toBe(ActorType.SYSTEM);
    expect(actor.display).toBe('system');
  });

  it('should build user actor', () => {
    const actor = buildUserActor('user123', 'test@example.com');

    expect(actor.type).toBe(ActorType.USER);
    expect(actor.id).toBe('user123');
    expect(actor.display).toBe('test@example.com');
  });

  it('should build user actor without display', () => {
    const actor = buildUserActor('user123');

    expect(actor.type).toBe(ActorType.USER);
    expect(actor.id).toBe('user123');
    expect(actor.display).toBeUndefined();
  });
});
