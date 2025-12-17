import { EventTypes, createGdprExportRequestedEvent } from '@serp/core';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { db, deviceTokens, gdprRequests, inAppNotifications, notificationPreferences, orgMemberships, orgs, outboxEvents, processedEvents, sampleEntities, users } from '../db';

describe('GDPR export consumer', () => {
  let testUserId: string;
  let testOrgId: string;

  beforeEach(async () => {
    // Clean up before tests
    await db.delete(gdprRequests);
    await db.delete(outboxEvents);
    await db.delete(processedEvents);
    await db.delete(inAppNotifications);
    await db.delete(notificationPreferences);
    await db.delete(deviceTokens);
    await db.delete(sampleEntities);
    await db.delete(orgMemberships);
    await db.delete(users);
    await db.delete(orgs);

    // Create test data
    testUserId = ulid();
    testOrgId = ulid();

    await db.insert(orgs).values({
      id: testOrgId,
      name: 'Test Org',
    });

    await db.insert(users).values({
      id: testUserId,
      email: 'test@example.com',
      passwordHash: 'hash123',
      name: 'Test User',
    });

    await db.insert(orgMemberships).values({
      id: ulid(),
      orgId: testOrgId,
      userId: testUserId,
      roles: ['user'],
    });

    await db.insert(notificationPreferences).values({
      id: ulid(),
      userId: testUserId,
      channel: 'email',
      enabled: true,
    });

    await db.insert(deviceTokens).values({
      id: ulid(),
      userId: testUserId,
      orgId: testOrgId,
      token: 'token123',
      platform: 'android',
    });
  });

  afterEach(async () => {
    // Clean up after tests
    await db.delete(gdprRequests);
    await db.delete(outboxEvents);
    await db.delete(processedEvents);
    await db.delete(inAppNotifications);
    await db.delete(notificationPreferences);
    await db.delete(deviceTokens);
    await db.delete(sampleEntities);
    await db.delete(orgMemberships);
    await db.delete(users);
    await db.delete(orgs);
  });

  it('should create GDPR request and emit domain event', async () => {
    const requestId = ulid();

    // Create GDPR request (simulating API)
    await db.insert(gdprRequests).values({
      id: requestId,
      type: 'EXPORT',
      status: 'PENDING',
      scopeOrgId: null,
      requesterUserId: testUserId,
      targetUserId: testUserId,
      correlationId: 'corr123',
      requestId: 'req123',
    });

    // Create domain event (simulating API)
    const domainEvent = createGdprExportRequestedEvent(
      testOrgId,
      {
        requestId,
        targetUserId: testUserId,
        requesterUserId: testUserId,
        scopeOrgId: null,
      },
      'corr123'
    );

    await db.insert(outboxEvents).values({
      id: ulid(),
      eventId: domainEvent.eventId,
      eventType: domainEvent.eventType,
      eventVersion: domainEvent.eventVersion,
      tenantId: domainEvent.tenantId,
      correlationId: domainEvent.correlationId,
      payload: domainEvent.payload,
      occurredAt: domainEvent.occurredAt,
    });

    // Verify request exists
    const requests = await db
      .select()
      .from(gdprRequests)
      .where(eq(gdprRequests.id, requestId));

    expect(requests.length).toBe(1);
    expect(requests[0].status).toBe('PENDING');
    expect(requests[0].type).toBe('EXPORT');

    // Verify domain event was queued
    const events = await db
      .select()
      .from(outboxEvents)
      .where(eq(outboxEvents.eventType, EventTypes.GDPR_EXPORT_REQUESTED));

    expect(events.length).toBe(1);
    const payload = events[0].payload as Record<string, unknown>;
    expect(payload.requestId).toBe(requestId);
    expect(payload.targetUserId).toBe(testUserId);
  });

  it('should handle org-scoped export request', async () => {
    const requestId = ulid();

    await db.insert(gdprRequests).values({
      id: requestId,
      type: 'EXPORT',
      status: 'PENDING',
      scopeOrgId: testOrgId,
      requesterUserId: testUserId,
      targetUserId: testUserId,
      correlationId: 'corr123',
      requestId: 'req123',
    });

    const requests = await db
      .select()
      .from(gdprRequests)
      .where(eq(gdprRequests.id, requestId));

    expect(requests[0].scopeOrgId).toBe(testOrgId);
  });
});
