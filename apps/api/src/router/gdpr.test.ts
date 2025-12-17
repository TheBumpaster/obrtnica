import { AuditEventTypes, EventTypes } from '@serp/core';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { db, gdprRequests, orgMemberships, orgs, outboxEvents, users } from '../db';

import { appRouter } from './index';

type AuditPayload = {
  auditEvent: {
    eventType: string;
  };
};

describe('GDPR procedures', () => {
  let testUserId: string;
  let testOrgId: string;
  let adminUserId: string;

  beforeEach(async () => {
    // Clean up before tests
    await db.delete(gdprRequests);
    await db.delete(outboxEvents);
    await db.delete(orgMemberships);
    await db.delete(users);
    await db.delete(orgs);

    // Create test data
    testUserId = ulid();
    testOrgId = ulid();
    adminUserId = ulid();

    await db.insert(orgs).values({
      id: testOrgId,
      name: 'Test Org',
    });

    await db.insert(users).values([
      {
        id: testUserId,
        email: 'test@example.com',
        passwordHash: 'hash123',
        name: 'Test User',
      },
      {
        id: adminUserId,
        email: 'admin@example.com',
        passwordHash: 'hash456',
        name: 'Admin User',
      },
    ]);

    await db.insert(orgMemberships).values([
      {
        id: ulid(),
        orgId: testOrgId,
        userId: testUserId,
        roles: ['user'],
      },
      {
        id: ulid(),
        orgId: testOrgId,
        userId: adminUserId,
        roles: ['admin'],
      },
    ]);
  });

  afterEach(async () => {
    // Clean up after tests
    await db.delete(gdprRequests);
    await db.delete(outboxEvents);
    await db.delete(orgMemberships);
    await db.delete(users);
    await db.delete(orgs);
  });

  describe('requestExport', () => {
    it('should allow self-service export request', async () => {
      const caller = appRouter.createCaller({
        userId: testUserId,
        orgId: testOrgId,
        roles: ['user'],
        requestId: 'req123',
        correlationId: 'corr123',
        ip: '192.168.1.1',
        userAgent: 'test-agent',
      });

      const result = await caller.gdpr.requestExport({});

      expect(result.requestId).toBeDefined();

      // Verify GDPR request was created
      const requests = await db
        .select()
        .from(gdprRequests)
        .where(eq(gdprRequests.id, result.requestId));

      expect(requests.length).toBe(1);
      expect(requests[0].type).toBe('EXPORT');
      expect(requests[0].status).toBe('PENDING');
      expect(requests[0].targetUserId).toBe(testUserId);
      expect(requests[0].requesterUserId).toBe(testUserId);
      expect(requests[0].scopeOrgId).toBeNull();

      // Verify audit event was emitted
      const auditEvents = await db
        .select()
        .from(outboxEvents)
        .where(eq(outboxEvents.eventType, EventTypes.AUDIT_EVENT_CREATED));

      expect(auditEvents.length).toBeGreaterThan(0);
      const auditPayload = auditEvents[0].payload as AuditPayload;
      expect(auditPayload.auditEvent.eventType).toBe(AuditEventTypes.DATA_EXPORT_REQUESTED);

      // Verify domain event was emitted
      const domainEvents = await db
        .select()
        .from(outboxEvents)
        .where(eq(outboxEvents.eventType, EventTypes.GDPR_EXPORT_REQUESTED));

      expect(domainEvents.length).toBe(1);
      const payload = domainEvents[0].payload as Record<string, unknown>;
      expect(payload.requestId).toBe(result.requestId);
      expect(payload.targetUserId).toBe(testUserId);
    });

    it('should allow admin-on-behalf export with admin role', async () => {
      const caller = appRouter.createCaller({
        userId: adminUserId,
        orgId: testOrgId,
        roles: ['admin'],
        requestId: 'req123',
        correlationId: 'corr123',
        ip: '192.168.1.1',
        userAgent: 'test-agent',
      });

      const result = await caller.gdpr.requestExport({
        targetUserId: testUserId,
        scopeOrgId: testOrgId,
      });

      expect(result.requestId).toBeDefined();

      const requests = await db
        .select()
        .from(gdprRequests)
        .where(eq(gdprRequests.id, result.requestId));

      expect(requests[0].targetUserId).toBe(testUserId);
      expect(requests[0].requesterUserId).toBe(adminUserId);
      expect(requests[0].scopeOrgId).toBe(testOrgId);
    });

    it('should reject admin-on-behalf without admin role', async () => {
      const caller = appRouter.createCaller({
        userId: testUserId, // regular user
        orgId: testOrgId,
        roles: ['user'],
        requestId: 'req123',
        correlationId: 'corr123',
        ip: '192.168.1.1',
        userAgent: 'test-agent',
      });

      await expect(
        caller.gdpr.requestExport({
          targetUserId: adminUserId,
          scopeOrgId: testOrgId,
        })
      ).rejects.toThrow('Admin role required');
    });

    it('should reject admin-on-behalf without scopeOrgId', async () => {
      const caller = appRouter.createCaller({
        userId: adminUserId,
        orgId: testOrgId,
        roles: ['admin'],
        requestId: 'req123',
        correlationId: 'corr123',
        ip: '192.168.1.1',
        userAgent: 'test-agent',
      });

      await expect(
        caller.gdpr.requestExport({
          targetUserId: testUserId,
          // missing scopeOrgId
        })
      ).rejects.toThrow('must specify scopeOrgId');
    });
  });

  describe('requestErasure', () => {
    it('should allow self-service erasure request', async () => {
      const caller = appRouter.createCaller({
        userId: testUserId,
        orgId: testOrgId,
        roles: ['user'],
        requestId: 'req123',
        correlationId: 'corr123',
        ip: '192.168.1.1',
        userAgent: 'test-agent',
      });

      const result = await caller.gdpr.requestErasure({});

      expect(result.requestId).toBeDefined();

      const requests = await db
        .select()
        .from(gdprRequests)
        .where(eq(gdprRequests.id, result.requestId));

      expect(requests.length).toBe(1);
      expect(requests[0].type).toBe('ERASURE');
      expect(requests[0].status).toBe('PENDING');
      expect(requests[0].mode).toBe('ANONYMIZE');

      // Verify audit event
      const auditEvents = await db
        .select()
        .from(outboxEvents)
        .where(eq(outboxEvents.eventType, EventTypes.AUDIT_EVENT_CREATED));

      expect(auditEvents.length).toBeGreaterThan(0);
      const auditPayload = auditEvents[0].payload as AuditPayload;
      expect(auditPayload.auditEvent.eventType).toBe(AuditEventTypes.DATA_ERASE_REQUESTED);

      // Verify domain event
      const domainEvents = await db
        .select()
        .from(outboxEvents)
        .where(eq(outboxEvents.eventType, EventTypes.GDPR_ERASE_REQUESTED));

      expect(domainEvents.length).toBe(1);
    });

    it('should allow admin-on-behalf erasure with admin role', async () => {
      const caller = appRouter.createCaller({
        userId: adminUserId,
        orgId: testOrgId,
        roles: ['admin'],
        requestId: 'req123',
        correlationId: 'corr123',
        ip: '192.168.1.1',
        userAgent: 'test-agent',
      });

      const result = await caller.gdpr.requestErasure({
        targetUserId: testUserId,
        scopeOrgId: testOrgId,
      });

      expect(result.requestId).toBeDefined();

      const requests = await db
        .select()
        .from(gdprRequests)
        .where(eq(gdprRequests.id, result.requestId));

      expect(requests[0].scopeOrgId).toBe(testOrgId);
    });
  });

  describe('getRequestStatus', () => {
    it('should allow requester to view request status', async () => {
      const caller = appRouter.createCaller({
        userId: testUserId,
        orgId: testOrgId,
        roles: ['user'],
        requestId: 'req123',
        correlationId: 'corr123',
        ip: '192.168.1.1',
        userAgent: 'test-agent',
      });

      const createResult = await caller.gdpr.requestExport({});
      const status = await caller.gdpr.getRequestStatus({ requestId: createResult.requestId });

      expect(status.id).toBe(createResult.requestId);
      expect(status.type).toBe('EXPORT');
      expect(status.status).toBe('PENDING');
      expect(status.hasResult).toBe(false);
    });

    it('should reject unauthorized users from viewing request', async () => {
      // Create request as testUser
      const caller1 = appRouter.createCaller({
        userId: testUserId,
        orgId: testOrgId,
        roles: ['user'],
        requestId: 'req123',
        correlationId: 'corr123',
        ip: '192.168.1.1',
        userAgent: 'test-agent',
      });

      const createResult = await caller1.gdpr.requestExport({});

      // Try to view as different user
      const caller2 = appRouter.createCaller({
        userId: adminUserId,
        orgId: testOrgId,
        roles: ['user'],
        requestId: 'req456',
        correlationId: 'corr456',
        ip: '192.168.1.1',
        userAgent: 'test-agent',
      });

      await expect(
        caller2.gdpr.getRequestStatus({ requestId: createResult.requestId })
      ).rejects.toThrow('Not authorized');
    });
  });
});
