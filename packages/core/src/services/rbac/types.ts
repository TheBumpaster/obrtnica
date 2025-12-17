/**
 * RBAC repository interfaces
 */

import type { PermissionId } from '../../auth/permissions';

export interface OrgRole {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  deletedAt: Date | null;
  createdAt: Date;
}

export interface OrgRolePermission {
  id: string;
  roleId: string;
  permission: PermissionId;
  createdAt: Date;
}

export interface OrgMemberRole {
  id: string;
  membershipId: string;
  roleId: string;
  createdAt: Date;
}

export interface IRbacRepository {
  // Org role operations
  createOrgRole(data: {
    id: string;
    orgId: string;
    name: string;
    description: string | null;
    isSystem: boolean;
  }): Promise<void>;

  getOrgRoles(orgId: string): Promise<OrgRole[]>;
  getOrgRoleById(roleId: string): Promise<OrgRole | null>;

  // Role permission operations
  createOrgRolePermissions(data: { id: string; roleId: string; permission: PermissionId }[]): Promise<void>;
  getOrgRolePermissions(roleId: string): Promise<OrgRolePermission[]>;

  // Member role operations
  createOrgMemberRole(data: { id: string; membershipId: string; roleId: string }): Promise<void>;
  deleteOrgMemberRole(membershipId: string, roleId: string): Promise<void>;
  getOrgMemberRoles(membershipId: string): Promise<OrgMemberRole[]>;
  getMembershipByUserAndOrg(userId: string, orgId: string): Promise<{ id: string } | null>;

  // Permission queries
  getUserOrgPermissions(userId: string, orgId: string): Promise<PermissionId[]>;

  // Workspace operations
  createWorkspace(data: { id: string; orgId: string; name: string; description: string | null }): Promise<void>;
  getWorkspaces(orgId: string): Promise<Array<{ id: string; orgId: string; name: string; description: string | null; createdAt: Date; archivedAt: Date | null }>>;

  // Workspace role operations
  createWorkspaceRole(data: {
    id: string;
    orgId: string;
    workspaceId: string | null;
    name: string;
    description: string | null;
    isSystem: boolean;
  }): Promise<void>;

  createWorkspaceRolePermissions(data: { id: string; roleId: string; permission: PermissionId }[]): Promise<void>;
  getWorkspaceRolePermissions(roleId: string): Promise<Array<{ id: string; roleId: string; permission: PermissionId; createdAt: Date }>>;

  // Workspace membership operations
  createWorkspaceMembership(data: { id: string; workspaceId: string; userId: string }): Promise<void>;
  getWorkspaceMembership(userId: string, workspaceId: string): Promise<{ id: string } | null>;

  // Workspace member role operations
  createWorkspaceMemberRole(data: { id: string; membershipId: string; roleId: string }): Promise<void>;
  getWorkspaceMemberRoles(membershipId: string): Promise<Array<{ id: string; membershipId: string; roleId: string; createdAt: Date }>>;

  // Workspace permission queries
  getUserWorkspacePermissions(userId: string, workspaceId: string): Promise<PermissionId[]>;
}
