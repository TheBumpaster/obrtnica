import { and, eq, isNull } from 'drizzle-orm';
import { ulid } from 'ulid';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  authRefreshTokens,
  authSessions,
  orgMemberRoles,
  orgMemberships,
  orgRolePermissions,
  orgRoles,
  orgs,
  outboxEvents,
  users,
  db,
} from '../db';
import { createTestCaller } from '../test-utils/test-setup';

describe('Auth Router Integration Tests', () => {
  const password = 'Str0ngPass!123';

  async function cleanup() {
    await db.delete(authRefreshTokens);
    await db.delete(authSessions);
    await db.delete(orgMemberRoles);
    await db.delete(orgRolePermissions);
    await db.delete(orgRoles);
    await db.delete(orgMemberships);
    await db.delete(outboxEvents);
    await db.delete(users);
    await db.delete(orgs);
  }

  beforeEach(async () => {
    await cleanup();
  });

  describe('Registration and Login Flow', () => {
    it('registers a user, creates org membership, and issues tokens', async () => {
      const caller = createTestCaller();
      const email = `user-${ulid()}@example.com`;

      const result = await caller.auth.register({
        email,
        password,
        firstName: 'Test',
        lastName: 'User',
        phone: '+123456789',
        orgName: 'Test Org',
        orgType: 'd.o.o.',
        address: 'Main St 1',
        city: 'Sarajevo',
        postalCode: '71000',
        registrationNumber: 'REG123',
        idNumber: '1234567890123',
        vatNumber: '123456789012',
        responsibleName: 'Resp',
        responsibleSurname: 'Person',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      const dbUser = await db.select().from(users).where(eq(users.email, email));
      expect(dbUser.length).toBe(1);

      const membership = await db.select().from(orgMemberships).where(eq(orgMemberships.userId, dbUser[0].id));
      expect(membership.length).toBe(1);

      const sessions = await db
        .select()
        .from(authSessions)
        .where(and(eq(authSessions.userId, dbUser[0].id), isNull(authSessions.revokedAt)));
      expect(sessions.length).toBeGreaterThan(0);
    });

    it('logs in an existing user and creates a new session', async () => {
      const caller = createTestCaller();
      const email = `user-${ulid()}@example.com`;
      await caller.auth.register({
        email,
        password,
        firstName: 'User',
        lastName: 'User',
        phone: '+123456789',
        orgName: 'Org',
        orgType: 'd.o.o.',
        address: 'Main St 1',
        city: 'Sarajevo',
        postalCode: '71000',
        registrationNumber: 'REG123',
        idNumber: '1234567890123',
        vatNumber: '123456789012',
        responsibleName: 'Resp',
        responsibleSurname: 'Person',
      });

      const loginResult = await caller.auth.login({ email, password });
      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.refreshToken).toBeDefined();

      const dbUser = await db.select().from(users).where(eq(users.email, email));
      const sessions = await db
        .select()
        .from(authSessions)
        .where(and(eq(authSessions.userId, dbUser[0].id), isNull(authSessions.revokedAt)));
      expect(sessions.length).toBeGreaterThan(0);
    });
  });

  describe('Session Management', () => {
    it('refreshes tokens and rotates refresh token family', async () => {
      const caller = createTestCaller();
      const email = `user-${ulid()}@example.com`;
      const { refreshToken } = await caller.auth.register({
        email,
        password,
        firstName: 'User',
        lastName: 'User',
        phone: '+123456789',
        orgName: 'Org',
        orgType: 'd.o.o.',
        address: 'Main St 1',
        city: 'Sarajevo',
        postalCode: '71000',
        registrationNumber: 'REG123',
        idNumber: '1234567890123',
        vatNumber: '123456789012',
        responsibleName: 'Resp',
        responsibleSurname: 'Person',
      });

      const refreshBefore = await db.select().from(authRefreshTokens);

      const refreshed = await caller.auth.refresh({ refreshToken });
      expect(refreshed.accessToken).toBeDefined();
      expect(refreshed.refreshToken).toBeDefined();

      const refreshAfter = await db.select().from(authRefreshTokens);
      expect(refreshAfter.length).toBeGreaterThan(refreshBefore.length);
      expect(refreshAfter.some((t) => t.revokedAt !== null || t.rotatedAt !== null)).toBe(true);
    });

    it('lists and revokes sessions for the authenticated user', async () => {
      const caller = createTestCaller();
      const email = `user-${ulid()}@example.com`;
      await caller.auth.register({
        email,
        password,
        firstName: 'User',
        lastName: 'User',
        phone: '+123456789',
        orgName: 'Org',
        orgType: 'd.o.o.',
        address: 'Main St 1',
        city: 'Sarajevo',
        postalCode: '71000',
        registrationNumber: 'REG123',
        idNumber: '1234567890123',
        vatNumber: '123456789012',
        responsibleName: 'Resp',
        responsibleSurname: 'Person',
      });

      const dbUser = await db.select().from(users).where(eq(users.email, email));
      const membership = await db.select().from(orgMemberships).where(eq(orgMemberships.userId, dbUser[0].id));
      const sessions = await db
        .select()
        .from(authSessions)
        .where(and(eq(authSessions.userId, dbUser[0].id), isNull(authSessions.revokedAt)));

      const sessionId = sessions[0].id;
      const orgId = membership[0].orgId;

      const authedCaller = createTestCaller({
        principal: { type: 'user', userId: dbUser[0].id, orgId, sessionId },
        requestId: ulid(),
        correlationId: ulid(),
      });

      const listed = await authedCaller.auth.listSessions();
      expect(listed.sessions.length).toBeGreaterThan(0);

      await authedCaller.auth.logout();

      const revoked = await db
        .select()
        .from(authSessions)
        .where(and(eq(authSessions.id, sessionId), isNull(authSessions.revokedAt)));
      expect(revoked.length).toBe(0);
    });
  });
});
