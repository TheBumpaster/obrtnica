/**
 * Permission and security state loader
 * Loads user permissions, MFA status, step-up status, emergency access
 */

import type { PermissionId, UserPermissions, AuthorizationContext } from '@serp/core';
import { eq, and, isNull, gt } from 'drizzle-orm';

import type { Database } from '../db';
import {
  mfaFactors,
  authStepUp,
  emergencyAccessGrants,
  orgSecurityPolicies,
  orgMemberships,
  orgMemberRoles,
  orgRolePermissions,
  serviceAccounts,
  serviceAccountRoles,
  workspaceMemberships,
  workspaceMemberRoles,
  workspaceRolePermissions,
  workspaces,
} from '../db';

export interface LoadedSecurityState {
  hasMfa: boolean;
  hasStepUp: boolean;
  emergencyAccess: boolean;
  requiresMfaByPolicy: boolean;
}

export class PermissionLoader {
  constructor(private db: Database) {}

  /**
   * Load user's org permissions
   */
  async loadUserOrgPermissions(userId: string, orgId: string): Promise<Set<PermissionId>> {
    // Get membership
    const memberships = await this.db
      .select()
      .from(orgMemberships)
      .where(and(eq(orgMemberships.userId, userId), eq(orgMemberships.orgId, orgId), isNull(orgMemberships.deletedAt)))
      .limit(1);

    if (memberships.length === 0) {
      return new Set();
    }

    const membership = memberships[0];

    // Get assigned roles
    const memberRoles = await this.db
      .select()
      .from(orgMemberRoles)
      .where(eq(orgMemberRoles.membershipId, membership.id));

    if (memberRoles.length === 0) {
      return new Set();
    }

    // Get all permissions from all roles
    const permissions = new Set<PermissionId>();
    for (const mr of memberRoles) {
      const rolePerms = await this.db
        .select()
        .from(orgRolePermissions)
        .where(eq(orgRolePermissions.roleId, mr.roleId));

      for (const rp of rolePerms) {
        permissions.add(rp.permission as PermissionId);
      }
    }

    return permissions;
  }

  /**
   * Load security state for user
   */
  async loadSecurityState(userId: string, orgId: string, sessionId?: string): Promise<LoadedSecurityState> {
    // Check MFA enrollment
    const mfaResults = await this.db
      .select()
      .from(mfaFactors)
      .where(and(eq(mfaFactors.userId, userId), isNull(mfaFactors.disabledAt)))
      .limit(1);

    const hasMfa = mfaResults.length > 0 && mfaResults[0].verifiedAt !== null;

    // Check step-up (if session exists)
    let hasStepUp = false;
    if (sessionId) {
      const stepUpResults = await this.db
        .select()
        .from(authStepUp)
        .where(and(eq(authStepUp.sessionId, sessionId), gt(authStepUp.expiresAt, new Date())))
        .limit(1);

      hasStepUp = stepUpResults.length > 0;
    }

    // Check emergency access
    const emergencyResults = await this.db
      .select()
      .from(emergencyAccessGrants)
      .where(
        and(
          eq(emergencyAccessGrants.userId, userId),
          eq(emergencyAccessGrants.orgId, orgId),
          isNull(emergencyAccessGrants.revokedAt),
          gt(emergencyAccessGrants.expiresAt, new Date())
        )
      )
      .limit(1);

    const emergencyAccess = emergencyResults.length > 0;

    // Check org security policy
    const policyResults = await this.db
      .select()
      .from(orgSecurityPolicies)
      .where(eq(orgSecurityPolicies.orgId, orgId))
      .limit(1);

    const requiresMfaByPolicy = policyResults.length > 0 && policyResults[0].requiresMfa;

    return {
      hasMfa,
      hasStepUp,
      emergencyAccess,
      requiresMfaByPolicy,
    };
  }

  /**
   * Build full authorization context
   */
  async buildAuthorizationContext(
    actorType: 'user' | 'service',
    actorId: string,
    orgId: string,
    sessionId?: string,
    workspaceId?: string
  ): Promise<AuthorizationContext> {
    let hasMfa = false;
    let hasStepUp = false;
    let emergencyAccess = false;

    if (actorType === 'user') {
      const securityState = await this.loadSecurityState(actorId, orgId, sessionId);
      hasMfa = securityState.hasMfa;
      hasStepUp = securityState.hasStepUp;
      emergencyAccess = securityState.emergencyAccess;
    }

    return {
      actorType,
      actorId,
      orgId,
      workspaceId,
      hasMfa,
      hasStepUp,
      emergencyAccess,
    };
  }

  /**
   * Load service account's org permissions
   */
  async loadServiceAccountOrgPermissions(serviceAccountId: string, orgId: string): Promise<Set<PermissionId>> {
    // Verify service account belongs to org
    const accounts = await this.db
      .select()
      .from(serviceAccounts)
      .where(and(eq(serviceAccounts.id, serviceAccountId), eq(serviceAccounts.orgId, orgId), isNull(serviceAccounts.deletedAt)))
      .limit(1);

    if (accounts.length === 0) {
      return new Set();
    }

    // Get assigned roles
    const accountRoles = await this.db
      .select()
      .from(serviceAccountRoles)
      .where(eq(serviceAccountRoles.serviceAccountId, serviceAccountId));

    if (accountRoles.length === 0) {
      return new Set();
    }

    // Get all permissions from all roles
    const permissions = new Set<PermissionId>();
    for (const ar of accountRoles) {
      const rolePerms = await this.db
        .select()
        .from(orgRolePermissions)
        .where(eq(orgRolePermissions.roleId, ar.roleId));

      for (const rp of rolePerms) {
        permissions.add(rp.permission as PermissionId);
      }
    }

    return permissions;
  }

  /**
   * Load user's workspace permissions for all workspaces they're a member of
   */
  async loadUserWorkspacePermissions(userId: string, orgId: string): Promise<Map<string, Set<PermissionId>>> {
    // Load all workspace memberships for the user scoped to the org
    const memberships = await this.db
      .select({
        membershipId: workspaceMemberships.id,
        workspaceId: workspaceMemberships.workspaceId,
      })
      .from(workspaceMemberships)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMemberships.workspaceId))
      .where(
        and(
          eq(workspaceMemberships.userId, userId),
          eq(workspaces.orgId, orgId),
          isNull(workspaceMemberships.deletedAt),
          isNull(workspaces.archivedAt)
        )
      );

    const workspacePermissions = new Map<string, Set<PermissionId>>();

    for (const membership of memberships) {
      const roleAssignments = await this.db
        .select()
        .from(workspaceMemberRoles)
        .where(eq(workspaceMemberRoles.membershipId, membership.membershipId));

      if (roleAssignments.length === 0) {
        continue;
      }

      const permissionSet = new Set<PermissionId>();
      for (const assignment of roleAssignments) {
        const rolePerms = await this.db
          .select()
          .from(workspaceRolePermissions)
          .where(eq(workspaceRolePermissions.roleId, assignment.roleId));

        for (const perm of rolePerms) {
          permissionSet.add(perm.permission as PermissionId);
        }
      }

      // Only store non-empty permission sets
      if (permissionSet.size > 0) {
        workspacePermissions.set(membership.workspaceId, permissionSet);
      }
    }

    return workspacePermissions;
  }

  /**
   * Load user's permissions for a specific workspace
   */
  async loadUserWorkspacePermissionsForWorkspace(userId: string, workspaceId: string): Promise<Set<PermissionId>> {
    // Reuse the org-scoped loader when possible for consistency
    // First, resolve the org for the workspace to preserve tenant boundary checks
    const workspace = await this.db
      .select({ orgId: workspaces.orgId })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (workspace.length === 0) {
      return new Set();
    }

    const allWorkspacePerms = await this.loadUserWorkspacePermissions(userId, workspace[0].orgId);
    return allWorkspacePerms.get(workspaceId) ?? new Set<PermissionId>();
  }

  /**
   * Build user permissions object
   */
  async buildUserPermissions(userId: string, orgId: string): Promise<UserPermissions> {
    const orgPermissions = await this.loadUserOrgPermissions(userId, orgId);
    const workspacePermissions = await this.loadUserWorkspacePermissions(userId, orgId);

    return {
      orgPermissions,
      workspacePermissions,
    };
  }

  /**
   * Build service account permissions object
   */
  async buildServiceAccountPermissions(serviceAccountId: string, orgId: string): Promise<UserPermissions> {
    const orgPermissions = await this.loadServiceAccountOrgPermissions(serviceAccountId, orgId);

    // Service accounts don't have workspace-specific permissions for now
    // They inherit org-level permissions only
    const workspacePermissions = new Map<string, Set<PermissionId>>();

    return {
      orgPermissions,
      workspacePermissions,
    };
  }

  /**
   * Build user permissions with specific workspace context
   */
  async buildUserPermissionsWithWorkspace(
    userId: string,
    orgId: string,
    workspaceId: string
  ): Promise<UserPermissions> {
    const orgPermissions = await this.loadUserOrgPermissions(userId, orgId);
    const workspacePermissions = new Map<string, Set<PermissionId>>();
    
    // Load permissions for the specific workspace
    const wsPerms = await this.loadUserWorkspacePermissionsForWorkspace(userId, workspaceId);
    if (wsPerms.size > 0) {
      workspacePermissions.set(workspaceId, wsPerms);
    }

    return {
      orgPermissions,
      workspacePermissions,
    };
  }
}
