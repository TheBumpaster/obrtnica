import { setAuthContextBuilder, setPermissionLoader } from '@serp/trpc';
import { and, eq, isNull } from 'drizzle-orm';
import { ulid } from 'ulid';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  db,
  orgMemberRoles,
  orgMemberships,
  orgRolePermissions,
  orgRoles,
  orgs,
  users,
  workspaceMemberRoles,
  workspaceMemberships,
  workspaceRolePermissions,
  workspaceRoles,
  workspaces,
} from '../db';
import { PermissionLoader } from '../services/permission-loader';
import { createTestCaller } from '../test-utils/test-setup';

// Initialize permission system for tests (mirrors API bootstrap)
beforeAll(() => {
  const loader = new PermissionLoader(db);
  setPermissionLoader(async (actorType, actorId, orgId, workspaceId) => {
    if (actorType === 'user') {
      if (workspaceId) {
        return loader.buildUserPermissionsWithWorkspace(actorId, orgId, workspaceId);
      }
      return loader.buildUserPermissions(actorId, orgId);
    }
    return loader.buildServiceAccountPermissions(actorId, orgId);
  });
  setAuthContextBuilder((actorType, actorId, orgId, sessionId, workspaceId) =>
    loader.buildAuthorizationContext(actorType, actorId, orgId, sessionId, workspaceId)
  );
});

describe('RBAC Router Integration Tests', () => {
  async function cleanup() {
    await db.delete(workspaceMemberRoles);
    await db.delete(workspaceRolePermissions);
    await db.delete(workspaceRoles);
    await db.delete(workspaceMemberships);
    await db.delete(workspaces);
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

  it('creates an org role when caller has assignment permission', async () => {
    const orgId = ulid();
    const userId = ulid();
    const membershipId = ulid();
    const existingRoleId = ulid();

    await db.insert(orgs).values({ id: orgId, name: 'Test Org' });
    await db.insert(users).values({ id: userId, email: `user-${ulid()}@example.com`, passwordHash: 'hash', name: 'User' });
    await db.insert(orgMemberships).values({ id: membershipId, orgId, userId, roles: [] });

    // Seed an admin-like role with org.members.permissions.assign
    await db.insert(orgRoles).values({ id: existingRoleId, orgId, name: 'Admin', description: null, isSystem: true });
    await db
      .insert(orgRolePermissions)
      .values({ id: ulid(), roleId: existingRoleId, permission: 'org.members.permissions.assign' });
    await db.insert(orgMemberRoles).values({ id: ulid(), membershipId, roleId: existingRoleId });

    const caller = createTestCaller({
      principal: { type: 'user', userId, orgId, sessionId: 'test-session' },
      requestId: ulid(),
      correlationId: ulid(),
    });

    const createResult = await caller.rbac.createOrgRole({
      name: 'Support',
      description: 'Support staff',
      permissions: ['org.view'],
    });

    const stored = await db.select().from(orgRoles).where(eq(orgRoles.id, createResult.roleId));
    expect(stored.length).toBe(1);
    expect(stored[0].name).toBe('Support');

    const storedPerms = await db.select().from(orgRolePermissions).where(eq(orgRolePermissions.roleId, createResult.roleId));
    expect(storedPerms.some((p) => p.permission === 'org.view')).toBe(true);
  });

  it('assigns a workspace role and allows workspace-scoped action', async () => {
    const orgId = ulid();
    const actorId = ulid();
    const targetUserId = ulid();
    const actorMembershipId = ulid();
    const targetMembershipId = ulid();
    const workspaceId = ulid();
    const workspaceRoleId = ulid();
    const orgRoleId = ulid();

    await db.insert(orgs).values({ id: orgId, name: 'Workspace Org' });
    await db
      .insert(users)
      .values([
        { id: actorId, email: `actor-${ulid()}@example.com`, passwordHash: 'hash', name: 'Actor' },
        { id: targetUserId, email: `target-${ulid()}@example.com`, passwordHash: 'hash', name: 'Target' },
      ]);

    await db.insert(orgMemberships).values([
      { id: actorMembershipId, orgId, userId: actorId, roles: [] },
      { id: targetMembershipId, orgId, userId: targetUserId, roles: [] },
    ]);

    await db.insert(workspaces).values({ id: workspaceId, orgId, name: 'WS', description: null });

    // Org role to allow creating workspace roles
    await db.insert(orgRoles).values({ id: orgRoleId, orgId, name: 'OrgAdmin', description: null, isSystem: true });
    await db
      .insert(orgRolePermissions)
      .values({ id: ulid(), roleId: orgRoleId, permission: 'org.workspaces.create' });
    await db.insert(orgMemberRoles).values({ id: ulid(), membershipId: actorMembershipId, roleId: orgRoleId });

    // Workspace role with workspace.members.assign
    await db.insert(workspaceRoles).values({
      id: workspaceRoleId,
      orgId,
      name: 'WorkspaceAdmin',
      description: null,
      isSystem: false,
    });
    await db
      .insert(workspaceRolePermissions)
      .values({ id: ulid(), roleId: workspaceRoleId, permission: 'workspace.members.assign' });

    // Actor is a member of the workspace with that role
    await db.insert(workspaceMemberships).values({ id: ulid(), workspaceId, userId: actorId });
    const actorWorkspaceMembership = await db
      .select()
      .from(workspaceMemberships)
      .where(and(eq(workspaceMemberships.userId, actorId), isNull(workspaceMemberships.deletedAt)));
    await db.insert(workspaceMemberRoles).values({
      id: ulid(),
      membershipId: actorWorkspaceMembership[0].id,
      roleId: workspaceRoleId,
    });

    const caller = createTestCaller({
      principal: { type: 'user', userId: actorId, orgId, sessionId: ulid() },
      requestId: ulid(),
      correlationId: ulid(),
    });

    const addResult = await caller.workspaces.addMember({ workspaceId, userId: targetUserId });
    expect(addResult.success).toBe(true);

    const membership = await db
      .select()
      .from(workspaceMemberships)
      .where(
        and(
          eq(workspaceMemberships.workspaceId, workspaceId),
          eq(workspaceMemberships.userId, targetUserId),
          isNull(workspaceMemberships.deletedAt)
        )
      );
    expect(membership.length).toBe(1);
  });
});
