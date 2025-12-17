/**
 * RBAC repository implementation using Drizzle
 */

import type { IRbacRepository, OrgRole, OrgRolePermission, OrgMemberRole , PermissionId } from '@serp/core';
import { eq, and, isNull } from 'drizzle-orm';

import type { Database } from '../db';
import {
  orgRoles,
  orgRolePermissions,
  orgMemberRoles,
  orgMemberships,
  serviceAccountRoles,
  workspaces,
  workspaceRoles,
  workspaceRolePermissions,
  workspaceMemberships,
  workspaceMemberRoles,
} from '../db';

export class RbacRepository implements IRbacRepository {
  constructor(private db: Database) {}

  // Org role operations
  async createOrgRole(data: {
    id: string;
    orgId: string;
    name: string;
    description: string | null;
    isSystem: boolean;
  }): Promise<void> {
    await this.db.insert(orgRoles).values(data);
  }

  async getOrgRoles(orgId: string): Promise<OrgRole[]> {
    return await this.db
      .select()
      .from(orgRoles)
      .where(and(eq(orgRoles.orgId, orgId), isNull(orgRoles.deletedAt)));
  }

  async getOrgRoleById(roleId: string): Promise<OrgRole | null> {
    const results = await this.db.select().from(orgRoles).where(eq(orgRoles.id, roleId)).limit(1);
    return results.length > 0 ? results[0] : null;
  }

  // Role permission operations
  async createOrgRolePermissions(
    data: { id: string; roleId: string; permission: PermissionId }[]
  ): Promise<void> {
    if (data.length > 0) {
      await this.db.insert(orgRolePermissions).values(data);
    }
  }

  async getOrgRolePermissions(roleId: string): Promise<OrgRolePermission[]> {
    return await this.db.select().from(orgRolePermissions).where(eq(orgRolePermissions.roleId, roleId));
  }

  // Member role operations
  async createOrgMemberRole(data: { id: string; membershipId: string; roleId: string }): Promise<void> {
    await this.db.insert(orgMemberRoles).values(data);
  }

  async deleteOrgMemberRole(membershipId: string, roleId: string): Promise<void> {
    await this.db
      .delete(orgMemberRoles)
      .where(and(eq(orgMemberRoles.membershipId, membershipId), eq(orgMemberRoles.roleId, roleId)));
  }

  async getOrgMemberRoles(membershipId: string): Promise<OrgMemberRole[]> {
    return await this.db.select().from(orgMemberRoles).where(eq(orgMemberRoles.membershipId, membershipId));
  }

  async getMembershipByUserAndOrg(userId: string, orgId: string): Promise<{ id: string } | null> {
    const results = await this.db
      .select({ id: orgMemberships.id })
      .from(orgMemberships)
      .where(and(eq(orgMemberships.userId, userId), eq(orgMemberships.orgId, orgId), isNull(orgMemberships.deletedAt)))
      .limit(1);
    return results.length > 0 ? results[0] : null;
  }

  // Service account role operations
  async createServiceAccountRole(data: { id: string; serviceAccountId: string; roleId: string }): Promise<void> {
    await this.db.insert(serviceAccountRoles).values(data);
  }

  async deleteServiceAccountRole(serviceAccountId: string, roleId: string): Promise<void> {
    await this.db
      .delete(serviceAccountRoles)
      .where(
        and(
          eq(serviceAccountRoles.serviceAccountId, serviceAccountId),
          eq(serviceAccountRoles.roleId, roleId)
        )
      );
  }

  async getServiceAccountRoles(serviceAccountId: string): Promise<{ id: string; serviceAccountId: string; roleId: string; createdAt: Date }[]> {
    return await this.db
      .select()
      .from(serviceAccountRoles)
      .where(eq(serviceAccountRoles.serviceAccountId, serviceAccountId));
  }

  // Permission queries
  async getUserOrgPermissions(userId: string, orgId: string): Promise<PermissionId[]> {
    // Get membership
    const memberships = await this.db
      .select()
      .from(orgMemberships)
      .where(and(eq(orgMemberships.userId, userId), eq(orgMemberships.orgId, orgId), isNull(orgMemberships.deletedAt)))
      .limit(1);

    if (memberships.length === 0) {
      return [];
    }

    const membership = memberships[0];

    // Get assigned roles
    const memberRoles = await this.db
      .select()
      .from(orgMemberRoles)
      .where(eq(orgMemberRoles.membershipId, membership.id));

    if (memberRoles.length === 0) {
      return [];
    }

    // Get all permissions from all roles
    const permissions: PermissionId[] = [];
    for (const mr of memberRoles) {
      const rolePerms = await this.db
        .select()
        .from(orgRolePermissions)
        .where(eq(orgRolePermissions.roleId, mr.roleId));

      for (const rp of rolePerms) {
        if (!permissions.includes(rp.permission as PermissionId)) {
          permissions.push(rp.permission as PermissionId);
        }
      }
    }

    return permissions;
  }

  // Workspace operations
  async createWorkspace(data: { id: string; orgId: string; name: string; description: string | null }): Promise<void> {
    await this.db.insert(workspaces).values(data);
  }

  async getWorkspaces(orgId: string) {
    return await this.db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.orgId, orgId), isNull(workspaces.archivedAt)));
  }

  // Workspace role operations
  async createWorkspaceRole(data: {
    id: string;
    orgId: string;
    workspaceId: string | null;
    name: string;
    description: string | null;
    isSystem: boolean;
  }): Promise<void> {
    await this.db.insert(workspaceRoles).values(data);
  }

  async createWorkspaceRolePermissions(data: { id: string; roleId: string; permission: PermissionId }[]): Promise<void> {
    if (data.length > 0) {
      await this.db.insert(workspaceRolePermissions).values(data);
    }
  }

  async getWorkspaceRolePermissions(roleId: string) {
    return await this.db
      .select()
      .from(workspaceRolePermissions)
      .where(eq(workspaceRolePermissions.roleId, roleId));
  }

  // Workspace membership operations
  async createWorkspaceMembership(data: { id: string; workspaceId: string; userId: string }): Promise<void> {
    await this.db.insert(workspaceMemberships).values(data);
  }

  async getWorkspaceMembership(userId: string, workspaceId: string): Promise<{ id: string } | null> {
    const results = await this.db
      .select({ id: workspaceMemberships.id })
      .from(workspaceMemberships)
      .where(
        and(
          eq(workspaceMemberships.userId, userId),
          eq(workspaceMemberships.workspaceId, workspaceId),
          isNull(workspaceMemberships.deletedAt)
        )
      )
      .limit(1);
    return results.length > 0 ? results[0] : null;
  }

  // Workspace member role operations
  async createWorkspaceMemberRole(data: { id: string; membershipId: string; roleId: string }): Promise<void> {
    await this.db.insert(workspaceMemberRoles).values(data);
  }

  async getWorkspaceMemberRoles(membershipId: string) {
    return await this.db
      .select()
      .from(workspaceMemberRoles)
      .where(eq(workspaceMemberRoles.membershipId, membershipId));
  }

  // Workspace permission queries
  async getUserWorkspacePermissions(userId: string, workspaceId: string): Promise<PermissionId[]> {
    // Get workspace membership
    const memberships = await this.db
      .select()
      .from(workspaceMemberships)
      .where(
        and(
          eq(workspaceMemberships.userId, userId),
          eq(workspaceMemberships.workspaceId, workspaceId),
          isNull(workspaceMemberships.deletedAt)
        )
      )
      .limit(1);

    if (memberships.length === 0) {
      return [];
    }

    const membership = memberships[0];

    // Get assigned roles
    const memberRoles = await this.db
      .select()
      .from(workspaceMemberRoles)
      .where(eq(workspaceMemberRoles.membershipId, membership.id));

    if (memberRoles.length === 0) {
      return [];
    }

    // Get all permissions from all roles
    const permissions: PermissionId[] = [];
    for (const mr of memberRoles) {
      const rolePerms = await this.db
        .select()
        .from(workspaceRolePermissions)
        .where(eq(workspaceRolePermissions.roleId, mr.roleId));

      for (const rp of rolePerms) {
        if (!permissions.includes(rp.permission as PermissionId)) {
          permissions.push(rp.permission as PermissionId);
        }
      }
    }

    return permissions;
  }
}
