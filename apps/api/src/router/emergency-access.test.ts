import { setAuthContextBuilder, setPermissionLoader } from '@serp/trpc';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { ulid } from 'ulid';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  authStepUp,
  db,
  emergencyAccessGrants,
  mfaFactors,
  orgMemberRoles,
  orgMemberships,
  orgRolePermissions,
  orgRoles,
  orgSecurityPolicies,
  orgs,
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

describe('Emergency Access Router Integration Tests', () => {
  async function cleanup() {
    await db.delete(emergencyAccessGrants);
    await db.delete(authStepUp);
    await db.delete(mfaFactors);
    await db.delete(orgMemberRoles);
    await db.delete(orgRolePermissions);
    await db.delete(orgRoles);
    await db.delete(orgMemberships);
    await db.delete(orgSecurityPolicies);
    await db.delete(users);
    await db.delete(orgs);
  }

  beforeEach(async () => {
    await cleanup();
  });

  it('activates emergency access when user has permission and step-up/MFA', async () => {
    const orgId = ulid();
    const userId = ulid();
    const membershipId = ulid();
    const roleId = ulid();
    const sessionId = ulid();

    await db.insert(orgs).values({ id: orgId, name: 'EA Org' });
    await db.insert(users).values({ id: userId, email: `user-${ulid()}@example.com`, passwordHash: 'hash', name: 'User' });
    await db.insert(orgMemberships).values({ id: membershipId, orgId, userId, roles: [] });

    await db.insert(orgRoles).values({ id: roleId, orgId, name: 'EA Admin', description: null, isSystem: true });
    await db
      .insert(orgRolePermissions)
      .values({ id: ulid(), roleId, permission: 'org.emergency_access.manage' });
    await db
      .insert(orgRolePermissions)
      .values({ id: ulid(), roleId, permission: 'org.audit.read' });
    await db.insert(orgMemberRoles).values({ id: ulid(), membershipId, roleId });

    // MFA enrolled and verified
    await db.insert(mfaFactors).values({
      id: ulid(),
      userId,
      type: 'TOTP',
      secretEncrypted: 'secret',
      verifiedAt: new Date(),
    });

    // Step-up record for session
    await db.insert(authStepUp).values({
      id: ulid(),
      sessionId,
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      method: 'PASSWORD',
    });

    const caller = createTestCaller({
      principal: { type: 'user', userId, orgId, sessionId },
      requestId: ulid(),
      correlationId: ulid(),
    });

    const result = await caller.emergencyAccess.activateEmergencyAccess({
      justification: 'Incident response',
      durationMinutes: 30,
    });

    expect(result.grantId).toBeDefined();
    const grants = await db
      .select()
      .from(emergencyAccessGrants)
      .where(
        and(
          eq(emergencyAccessGrants.id, result.grantId),
          eq(emergencyAccessGrants.orgId, orgId),
          eq(emergencyAccessGrants.userId, userId),
          isNull(emergencyAccessGrants.revokedAt),
          gt(emergencyAccessGrants.expiresAt, new Date())
        )
      );
    expect(grants.length).toBe(1);
    expect(grants[0].justification).toBe('Incident response');

    // Verify API responses redact justification but include metadata
    const list = await caller.emergencyAccess.listEmergencyGrants();
    expect(list.grants[0].justificationRedacted).toBe(true);
    expect('justification' in list.grants[0]).toBe(false);
    expect(list.grants[0].justificationLength).toBe('Incident response'.length);

    const myGrant = await caller.emergencyAccess.getMyEmergencyGrant();
    expect(myGrant.hasActive).toBe(true);
    expect(myGrant.grant?.justificationRedacted).toBe(true);
    expect('justification' in (myGrant.grant ?? {})).toBe(false);
    expect(myGrant.grant?.justificationLength).toBe('Incident response'.length);
  });
});
