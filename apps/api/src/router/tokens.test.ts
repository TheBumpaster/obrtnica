import { setAuthContextBuilder, setPermissionLoader } from '@serp/trpc';
import { and, eq, isNull } from 'drizzle-orm';
import { ulid } from 'ulid';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  apiTokens,
  db,
  orgMemberRoles,
  orgMemberships,
  orgRolePermissions,
  orgRoles,
  orgs,
  serviceAccountRoles,
  serviceAccounts,
  users,
} from '../db';
import { PermissionLoader } from '../services/permission-loader';
import { createTestCaller } from '../test-utils/test-setup';

// Initialize permission system for tests (mirrors API bootstrap)
beforeAll(() => {
  const loader = new PermissionLoader(db);
  setPermissionLoader(async (actorType, actorId, orgId) => {
    if (actorType === 'user') {
      return loader.buildUserPermissions(actorId, orgId);
    }
    return loader.buildServiceAccountPermissions(actorId, orgId);
  });
  setAuthContextBuilder((actorType, actorId, orgId, sessionId, workspaceId) =>
    loader.buildAuthorizationContext(actorType, actorId, orgId, sessionId, workspaceId)
  );
});

describe('Tokens Router Integration Tests', () => {
  async function cleanup() {
    await db.delete(apiTokens);
    await db.delete(serviceAccountRoles);
    await db.delete(serviceAccounts);
    await db.delete(orgMemberRoles);
    await db.delete(orgRolePermissions);
    await db.delete(orgRoles);
    await db.delete(orgMemberships);
    await db.delete(users);
    await db.delete(orgs);
  }

  beforeEach(async () => {
    await cleanup();
  });

  it('creates a service account and API token when user has manage permission', async () => {
    const orgId = ulid();
    const userId = ulid();
    const membershipId = ulid();
    const manageRoleId = ulid();

    await db.insert(orgs).values({ id: orgId, name: 'Token Org' });
    await db.insert(users).values({ id: userId, email: `user-${ulid()}@example.com`, passwordHash: 'hash', name: 'User' });
    await db.insert(orgMemberships).values({ id: membershipId, orgId, userId, roles: [] });

    // Role with org.api_tokens.manage
    await db.insert(orgRoles).values({ id: manageRoleId, orgId, name: 'TokenAdmin', description: null, isSystem: true });
    await db
      .insert(orgRolePermissions)
      .values({ id: ulid(), roleId: manageRoleId, permission: 'org.api_tokens.manage' });
    await db.insert(orgMemberRoles).values({ id: ulid(), membershipId, roleId: manageRoleId });

    const caller = createTestCaller({
      principal: { type: 'user', userId, orgId, sessionId: 'test-session' },
      requestId: ulid(),
      correlationId: ulid(),
    });

    const saResult = await caller.tokens.createServiceAccount({ name: 'svc' });
    expect(saResult.id).toBeDefined();

    const serviceAccountRows = await db.select().from(serviceAccounts).where(eq(serviceAccounts.id, saResult.id));
    expect(serviceAccountRows.length).toBe(1);
    expect(serviceAccountRows[0].orgId).toBe(orgId);

    const tokenResult = await caller.tokens.createApiToken({
      name: 'test-token',
      serviceAccountId: saResult.id,
      scopes: [],
      expiresInDays: 30,
    });

    expect(tokenResult.token).toMatch(/^api_/);
    const storedTokens = await db
      .select()
      .from(apiTokens)
      .where(and(eq(apiTokens.id, tokenResult.id), isNull(apiTokens.revokedAt)));
    expect(storedTokens.length).toBe(1);
    expect(storedTokens[0].serviceAccountId).toBe(saResult.id);
  });

  it('lists and revokes API tokens', async () => {
    const orgId = ulid();
    const userId = ulid();
    const membershipId = ulid();
    const roleId = ulid();

    await db.insert(orgs).values({ id: orgId, name: 'Token Org' });
    await db.insert(users).values({ id: userId, email: `user-${ulid()}@example.com`, passwordHash: 'hash', name: 'User' });
    await db.insert(orgMemberships).values({ id: membershipId, orgId, userId, roles: [] });
    await db.insert(orgRoles).values({ id: roleId, orgId, name: 'TokenAdmin', description: null, isSystem: true });
    await db
      .insert(orgRolePermissions)
      .values({ id: ulid(), roleId, permission: 'org.api_tokens.manage' });
    await db.insert(orgMemberRoles).values({ id: ulid(), membershipId, roleId });

    const caller = createTestCaller({
      principal: { type: 'user', userId, orgId, sessionId: 'test-session' },
      requestId: ulid(),
      correlationId: ulid(),
    });

    const tokenResult = await caller.tokens.createApiToken({
      name: 'test-token',
      scopes: [],
      expiresInDays: 7,
    });

    const list = await caller.tokens.listApiTokens();
    expect(list.tokens.some((t) => t.id === tokenResult.id)).toBe(true);

    await caller.tokens.revokeApiToken({ tokenId: tokenResult.id });

    const revoked = await db
      .select()
      .from(apiTokens)
      .where(and(eq(apiTokens.id, tokenResult.id), isNull(apiTokens.revokedAt)));
    expect(revoked.length).toBe(0);
  });
});
