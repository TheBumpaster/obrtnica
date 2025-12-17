import { describe, it, expect } from 'vitest';

import { DataCategories, DataClassifications } from '../types';
import { sanitizeAuditMetadata, sanitizeAuditEvent } from './sanitize';
import { ActorType, AuditEventTypes, AuditSeverity, AuditStatus } from './types';
import type { AuditEvent } from './types';

describe('sanitizeAuditMetadata', () => {
  it('should preserve safe metadata keys', () => {
    const metadata = {
      userId: '123',
      resourceId: 'abc',
      count: 5,
      permission: 'billing:write',
    };

    const result = sanitizeAuditMetadata(metadata);

    expect(result).toEqual(metadata);
  });

  it('should remove forbidden keys (case-insensitive)', () => {
    const metadata = {
      userId: '123',
      password: 'secret123',
      token: 'abc123',
      apiKey: 'key123',
      refreshToken: 'refresh123',
    };

    const result = sanitizeAuditMetadata(metadata);

    expect(result).toEqual({ userId: '123' });
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('token');
    expect(result).not.toHaveProperty('apiKey');
    expect(result).not.toHaveProperty('refreshToken');
  });

  it('should remove forbidden keys from nested objects', () => {
    const metadata = {
      user: {
        id: '123',
        email: 'test@example.com',
        passwordHash: 'hashed',
      },
      settings: {
        apiKey: 'key123',
        webhook: 'https://example.com',
      },
    };

    const result = sanitizeAuditMetadata(metadata);

    expect(result).toEqual({
      user: {
        id: '123',
        email: 'test@example.com',
      },
      settings: {
        webhook: 'https://example.com',
      },
    });
  });

  it('should sanitize arrays of objects', () => {
    const metadata = {
      items: [
        { id: '1', token: 'secret1' },
        { id: '2', token: 'secret2' },
      ],
    };

    const result = sanitizeAuditMetadata(metadata);

    expect(result).toEqual({
      items: [{ id: '1' }, { id: '2' }],
    });
  });

  it('should handle undefined metadata', () => {
    const result = sanitizeAuditMetadata(undefined);
    expect(result).toBeUndefined();
  });

  it('should handle empty metadata', () => {
    const result = sanitizeAuditMetadata({});
    expect(result).toEqual({});
  });

  it('should remove keys containing forbidden substrings', () => {
    const metadata = {
      userId: '123',
      user_password: 'secret',
      access_token: 'token123',
      api_key_value: 'key123',
    };

    const result = sanitizeAuditMetadata(metadata);

    expect(result).toEqual({ userId: '123' });
  });
});

describe('sanitizeAuditEvent', () => {
  it('should sanitize metadata in audit event', () => {
    const event: AuditEvent = {
      id: '123',
      occurredAt: new Date(),
      eventType: AuditEventTypes.AUTH_LOGIN_SUCCESS,
      eventVersion: 1,
      severity: AuditSeverity.INFO,
      tenantId: 'tenant1',
      actor: {
        type: ActorType.USER,
        id: 'user1',
        display: 'test@example.com',
      },
      status: AuditStatus.SUCCESS,
      dataTag: {
        classification: DataClassifications.RESTRICTED,
        categories: [DataCategories.AUTH],
      },
      metadata: {
        userId: 'user1',
        password: 'secret123',
      },
    };

    const result = sanitizeAuditEvent(event);

    expect(result.metadata).toEqual({ userId: 'user1' });
    expect(result.metadata).not.toHaveProperty('password');
  });

  it('should truncate oversized metadata', () => {
    const largeMetadata: Record<string, unknown> = {};
    // Create metadata that exceeds 100KB
    for (let i = 0; i < 10000; i++) {
      largeMetadata[`key${i}`] = 'a'.repeat(100);
    }

    const event: AuditEvent = {
      id: '123',
      occurredAt: new Date(),
      eventType: AuditEventTypes.DATA_WRITE_CREATED,
      eventVersion: 1,
      severity: AuditSeverity.INFO,
      tenantId: 'tenant1',
      actor: {
        type: ActorType.USER,
        id: 'user1',
      },
      status: AuditStatus.SUCCESS,
      dataTag: {
        classification: DataClassifications.CONFIDENTIAL,
        categories: [DataCategories.CONTENT],
      },
      metadata: largeMetadata,
    };

    const result = sanitizeAuditEvent(event);

    expect(result.metadata).toHaveProperty('_truncated', true);
    expect(result.metadata).toHaveProperty('_originalSize');
    expect(result.metadata).toHaveProperty('_reason');
  });

  it('should truncate very long actor display strings', () => {
    const event: AuditEvent = {
      id: '123',
      occurredAt: new Date(),
      eventType: AuditEventTypes.SECURITY_PERMISSION_DENIED,
      eventVersion: 1,
      severity: AuditSeverity.WARN,
      tenantId: 'tenant1',
      actor: {
        type: ActorType.USER,
        id: 'user1',
        display: 'a'.repeat(300),
      },
      status: AuditStatus.FAILURE,
      dataTag: {
        classification: DataClassifications.RESTRICTED,
        categories: [DataCategories.AUDIT],
      },
    };

    const result = sanitizeAuditEvent(event);

    expect(result.actor.display?.length).toBeLessThanOrEqual(255);
    expect(result.actor.display).toMatch(/\.\.\.$/);
  });

  it('should preserve event without metadata', () => {
    const event: AuditEvent = {
      id: '123',
      occurredAt: new Date(),
      eventType: AuditEventTypes.SECURITY_PERMISSION_DENIED,
      eventVersion: 1,
      severity: AuditSeverity.WARN,
      tenantId: 'tenant1',
      actor: {
        type: ActorType.USER,
        id: 'user1',
      },
      status: AuditStatus.FAILURE,
      dataTag: {
        classification: DataClassifications.RESTRICTED,
        categories: [DataCategories.AUDIT],
      },
    };

    const result = sanitizeAuditEvent(event);

    expect(result).toEqual(event);
  });
});
