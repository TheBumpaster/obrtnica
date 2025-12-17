import type { AuditEvent } from '@serp/core';
import { AuditEventTypes, buildDomainWriteAuditEvent, buildUserActor, createAuditEventCreated } from '@serp/core';
import { eq } from 'drizzle-orm';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { auditEvents, db, processedEvents } from '../db';

type SerializedAuditPayload = {
  auditEvent: {
    id: string;
    occurredAt: string;
    eventType: string;
    eventVersion: number;
    severity: string;
    tenantId?: string | null;
    actorType: string;
    actorId?: string | null;
    actorDisplay?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
    correlationId?: string | null;
    resourceType?: string | null;
    resourceId?: string | null;
    action?: string | null;
    status: string;
    reason?: string | null;
    dataClassification: string;
    dataCategories: string[];
    metadata?: Record<string, unknown> | null;
  };
};

describe('audit event consumer', () => {
  beforeEach(async () => {
    // Clean up before each test
    await db.delete(auditEvents);
    await db.delete(processedEvents);
  });

  afterEach(async () => {
    // Clean up after tests
    await db.delete(auditEvents);
    await db.delete(processedEvents);
  });

  describe('audit event persistence', () => {
    it('should write audit event to audit_events table', async () => {
      // Create audit event
      const auditEvent = buildDomainWriteAuditEvent({
        tenantId: 'tenant123',
        actor: buildUserActor('user123', 'test@example.com'),
        ip: '192.168.1.1',
        userAgent: 'test-agent',
        requestId: 'req123',
        correlationId: 'corr123',
        resourceType: 'TestEntity',
        resourceId: 'entity123',
        action: 'CREATE',
        metadata: { test: 'data' },
      });

      // Wrap in domain event
      const domainEvent = createAuditEventCreated(auditEvent);

      // Simulate consumer processing (direct call instead of RabbitMQ)
      const payload = domainEvent.payload as SerializedAuditPayload;

      // Insert directly into audit_events (simulating what consumer does)
      await db.insert(auditEvents).values({
        id: payload.auditEvent.id,
        occurredAt: new Date(payload.auditEvent.occurredAt),
        eventType: payload.auditEvent.eventType,
        eventVersion: payload.auditEvent.eventVersion,
        severity: payload.auditEvent.severity,
        tenantId: payload.auditEvent.tenantId,
        actorType: payload.auditEvent.actorType,
        actorId: payload.auditEvent.actorId,
        actorDisplay: payload.auditEvent.actorDisplay,
        ip: payload.auditEvent.ip,
        userAgent: payload.auditEvent.userAgent,
        requestId: payload.auditEvent.requestId,
        correlationId: payload.auditEvent.correlationId,
        resourceType: payload.auditEvent.resourceType,
        resourceId: payload.auditEvent.resourceId,
        action: payload.auditEvent.action,
        status: payload.auditEvent.status,
        reason: payload.auditEvent.reason || null,
        dataClassification: payload.auditEvent.dataClassification,
        dataCategories: payload.auditEvent.dataCategories,
        metadata: payload.auditEvent.metadata || null,
      });

      // Verify it was written
      const records = await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.id, payload.auditEvent.id));

      expect(records.length).toBe(1);
      const record = records[0];

      expect(record.eventType).toBe(AuditEventTypes.DATA_WRITE_CREATED);
      expect(record.tenantId).toBe('tenant123');
      expect(record.actorId).toBe('user123');
      expect(record.actorDisplay).toBe('test@example.com');
      expect(record.resourceType).toBe('TestEntity');
      expect(record.resourceId).toBe('entity123');
      expect(record.action).toBe('CREATE');
      expect(record.status).toBe('SUCCESS');
    });

    it('should preserve request metadata in audit record', async () => {
      const auditEvent = buildDomainWriteAuditEvent({
        tenantId: 'tenant456',
        actor: buildUserActor('user456'),
        ip: '10.0.0.1',
        userAgent: 'Mozilla/5.0',
        requestId: 'req456',
        correlationId: 'corr456',
        resourceType: 'TestEntity',
        resourceId: 'entity456',
        action: 'UPDATE',
      });

      const domainEvent = createAuditEventCreated(auditEvent);
      const payload = domainEvent.payload as SerializedAuditPayload;

      await db.insert(auditEvents).values({
        id: payload.auditEvent.id,
        occurredAt: new Date(payload.auditEvent.occurredAt),
        eventType: payload.auditEvent.eventType,
        eventVersion: payload.auditEvent.eventVersion,
        severity: payload.auditEvent.severity,
        tenantId: payload.auditEvent.tenantId,
        actorType: payload.auditEvent.actorType,
        actorId: payload.auditEvent.actorId,
        actorDisplay: payload.auditEvent.actorDisplay || null,
        ip: payload.auditEvent.ip,
        userAgent: payload.auditEvent.userAgent,
        requestId: payload.auditEvent.requestId,
        correlationId: payload.auditEvent.correlationId,
        resourceType: payload.auditEvent.resourceType,
        resourceId: payload.auditEvent.resourceId,
        action: payload.auditEvent.action,
        status: payload.auditEvent.status,
        reason: payload.auditEvent.reason || null,
        dataClassification: payload.auditEvent.dataClassification,
        dataCategories: payload.auditEvent.dataCategories,
        metadata: payload.auditEvent.metadata || null,
      });

      const records = await db.select().from(auditEvents).where(eq(auditEvents.id, payload.auditEvent.id));
      const record = records[0];

      expect(record.ip).toBe('10.0.0.1');
      expect(record.userAgent).toBe('Mozilla/5.0');
      expect(record.requestId).toBe('req456');
      expect(record.correlationId).toBe('corr456');
    });
  });

  describe('tenant boundary', () => {
    it('should correctly isolate audit events by tenant', async () => {
      // Create audit events for two different tenants
      const auditEvent1 = buildDomainWriteAuditEvent({
        tenantId: 'tenant-alpha',
        actor: buildUserActor('user1'),
        resourceType: 'Entity',
        resourceId: 'ent1',
        action: 'CREATE',
      });

      const auditEvent2 = buildDomainWriteAuditEvent({
        tenantId: 'tenant-beta',
        actor: buildUserActor('user2'),
        resourceType: 'Entity',
        resourceId: 'ent2',
        action: 'CREATE',
      });

      const domainEvent1 = createAuditEventCreated(auditEvent1);
      const domainEvent2 = createAuditEventCreated(auditEvent2);

      const payload1 = domainEvent1.payload as SerializedAuditPayload;
      const payload2 = domainEvent2.payload as SerializedAuditPayload;

      // Insert both
      await db.insert(auditEvents).values([
        {
          id: payload1.auditEvent.id,
          occurredAt: new Date(payload1.auditEvent.occurredAt),
          eventType: payload1.auditEvent.eventType,
          eventVersion: payload1.auditEvent.eventVersion,
          severity: payload1.auditEvent.severity,
          tenantId: payload1.auditEvent.tenantId,
          actorType: payload1.auditEvent.actorType,
          actorId: payload1.auditEvent.actorId,
          actorDisplay: payload1.auditEvent.actorDisplay || null,
          ip: payload1.auditEvent.ip || null,
          userAgent: payload1.auditEvent.userAgent || null,
          requestId: payload1.auditEvent.requestId || null,
          correlationId: payload1.auditEvent.correlationId || null,
          resourceType: payload1.auditEvent.resourceType,
          resourceId: payload1.auditEvent.resourceId,
          action: payload1.auditEvent.action,
          status: payload1.auditEvent.status,
          reason: payload1.auditEvent.reason || null,
          dataClassification: payload1.auditEvent.dataClassification,
          dataCategories: payload1.auditEvent.dataCategories,
          metadata: payload1.auditEvent.metadata || null,
        },
        {
          id: payload2.auditEvent.id,
          occurredAt: new Date(payload2.auditEvent.occurredAt),
          eventType: payload2.auditEvent.eventType,
          eventVersion: payload2.auditEvent.eventVersion,
          severity: payload2.auditEvent.severity,
          tenantId: payload2.auditEvent.tenantId,
          actorType: payload2.auditEvent.actorType,
          actorId: payload2.auditEvent.actorId,
          actorDisplay: payload2.auditEvent.actorDisplay || null,
          ip: payload2.auditEvent.ip || null,
          userAgent: payload2.auditEvent.userAgent || null,
          requestId: payload2.auditEvent.requestId || null,
          correlationId: payload2.auditEvent.correlationId || null,
          resourceType: payload2.auditEvent.resourceType,
          resourceId: payload2.auditEvent.resourceId,
          action: payload2.auditEvent.action,
          status: payload2.auditEvent.status,
          reason: payload2.auditEvent.reason || null,
          dataClassification: payload2.auditEvent.dataClassification,
          dataCategories: payload2.auditEvent.dataCategories,
          metadata: payload2.auditEvent.metadata || null,
        },
      ]);

      // Query by tenant
      const alphaRecords = await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.tenantId, 'tenant-alpha'));

      const betaRecords = await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.tenantId, 'tenant-beta'));

      expect(alphaRecords.length).toBe(1);
      expect(betaRecords.length).toBe(1);
      expect(alphaRecords[0].tenantId).toBe('tenant-alpha');
      expect(betaRecords[0].tenantId).toBe('tenant-beta');
    });
  });

  describe('data sanitization', () => {
    it('should not contain forbidden keys in metadata', async () => {
      const auditEvent = buildDomainWriteAuditEvent({
        tenantId: 'tenant789',
        actor: buildUserActor('user789'),
        resourceType: 'Entity',
        resourceId: 'ent789',
        action: 'CREATE',
        metadata: {
          userId: 'user789',
          count: 5,
          // These should be sanitized out by the builder/sanitizer
        },
      });

      // Manually add forbidden key to test sanitization
      (auditEvent as AuditEvent & { metadata: Record<string, unknown> }).metadata = {
        ...auditEvent.metadata,
        password: 'should-be-removed',
        token: 'should-also-be-removed',
      };

      const domainEvent = createAuditEventCreated(auditEvent);
      const payload = domainEvent.payload as Record<string, unknown> & { auditEvent: Record<string, unknown> };

      // Verify sanitization happened
      expect(payload.auditEvent.metadata).not.toHaveProperty('password');
      expect(payload.auditEvent.metadata).not.toHaveProperty('token');
      expect(payload.auditEvent.metadata).toHaveProperty('userId');
      expect(payload.auditEvent.metadata).toHaveProperty('count');
    });
  });
});
