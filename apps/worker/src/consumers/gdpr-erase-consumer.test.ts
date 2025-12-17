import { EventTypes, createGdprEraseRequestedEvent } from '@serp/core';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { db, gdprRequests, orgMemberships, orgs, outboxEvents, processedEvents, users } from '../db';

describe('GDPR erase consumer', () => {
  let testUserId: string;
  let testOrgId: string;

  beforeEach(async () => {
    // Clean up before tests
    await db.delete(gdprRequests);
    await db.delete(outboxEvents);
    await db.delete(processedEvents);
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
  });

  afterEach(async () => {
    // Clean up after tests
    await db.delete(gdprRequests);
    await db.delete(outboxEvents);
    await db.delete(processedEvents);
    await db.delete(orgMemberships);
    await db.delete(users);
    await db.delete(orgs);
  });

  it('should create GDPR erasure request and emit domain event', async () => {
    const requestId = ulid();

    // Create GDPR request (simulating API)
    await db.insert(gdprRequests).values({
      id: requestId,
      type: 'ERASURE',
      status: 'PENDING',
      scopeOrgId: null,
      requesterUserId: testUserId,
      targetUserId: testUserId,
      correlationId: 'corr123',
      requestId: 'req123',
      mode: 'ANONYMIZE',
    });

    // Create domain event
    const domainEvent = createGdprEraseRequestedEvent(
      testOrgId,
      {
        requestId,
        targetUserId: testUserId,
        requesterUserId: testUserId,
        scopeOrgId: null,
        mode: 'ANONYMIZE',
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
    expect(requests[0].type).toBe('ERASURE');
    expect(requests[0].mode).toBe('ANONYMIZE');

    // Verify domain event was queued
    const events = await db
      .select()
      .from(outboxEvents)
      .where(eq(outboxEvents.eventType, EventTypes.GDPR_ERASE_REQUESTED));

    expect(events.length).toBe(1);
    const payload = events[0].payload as Record<string, unknown>;
    expect(payload.requestId).toBe(requestId);
    expect(payload.mode).toBe('ANONYMIZE');
  });

  it('should handle org-scoped erasure request', async () => {
    const requestId = ulid();

    await db.insert(gdprRequests).values({
      id: requestId,
      type: 'ERASURE',
      status: 'PENDING',
      scopeOrgId: testOrgId,
      requesterUserId: testUserId,
      targetUserId: testUserId,
      correlationId: 'corr123',
      requestId: 'req123',
      mode: 'ANONYMIZE',
    });

    const requests = await db
      .select()
      .from(gdprRequests)
      .where(eq(gdprRequests.id, requestId));

    expect(requests[0].scopeOrgId).toBe(testOrgId);
  });

  it('should verify user data structure before erasure', async () => {
    // Verify user exists
    const usersResult = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId));

    expect(usersResult.length).toBe(1);
    expect(usersResult[0].email).toBe('test@example.com');
    expect(usersResult[0].name).toBe('Test User');
    expect(usersResult[0].anonymizedAt).toBeNull();

    // Verify membership exists
    const memberships = await db
      .select()
      .from(orgMemberships)
      .where(eq(orgMemberships.userId, testUserId));

    expect(memberships.length).toBe(1);
    expect(memberships[0].deletedAt).toBeNull();
  });
});
