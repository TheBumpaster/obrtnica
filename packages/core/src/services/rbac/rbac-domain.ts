/**
 * RBAC domain service (business logic)
 */

import type { IRbacRepository } from './types';
import { isValidPermission, type PermissionId } from '../../auth/permissions';

export class RbacDomainService {
  constructor(private rbacRepo: IRbacRepository) {}

  /**
   * Create an org role
   */
  async createOrgRole(
    roleId: string,
    orgId: string,
    name: string,
    description: string | null,
    permissions: PermissionId[]
  ): Promise<{ roleId: string }> {
    // Validate permissions
    for (const perm of permissions) {
      if (!isValidPermission(perm)) {
        throw new Error(`Invalid permission: ${perm}`);
      }
    }

    // Create role
    await this.rbacRepo.createOrgRole({
      id: roleId,
      orgId,
      name,
      description,
      isSystem: false,
    });

    // Add permissions
    if (permissions.length > 0) {
      const permissionData = permissions.map((perm, index) => ({
        id: `${roleId}_perm_${index}`, // Will be replaced with proper ID generation
        roleId,
        permission: perm,
      }));
      await this.rbacRepo.createOrgRolePermissions(permissionData);
    }

    return { roleId };
  }

  /**
   * Get org roles with permissions
   */
  async getOrgRoles(orgId: string) {
    const roles = await this.rbacRepo.getOrgRoles(orgId);

    const result = [];
    for (const role of roles) {
      const perms = await this.rbacRepo.getOrgRolePermissions(role.id);
      result.push({
        ...role,
        permissions: perms.map((p) => p.permission),
      });
    }

    return result;
  }

  /**
   * Assign org role to a member
   */
  async assignOrgRoleToMember(
    assignmentId: string,
    membershipId: string,
    roleId: string
  ): Promise<{ success: boolean; alreadyAssigned: boolean }> {
    // Check if assignment already exists
    const existingRoles = await this.rbacRepo.getOrgMemberRoles(membershipId);
    const alreadyAssigned = existingRoles.some((r) => r.roleId === roleId);

    if (alreadyAssigned) {
      return { success: true, alreadyAssigned: true };
    }

    await this.rbacRepo.createOrgMemberRole({
      id: assignmentId,
      membershipId,
      roleId,
    });

    return { success: true, alreadyAssigned: false };
  }

  /**
   * Remove org role from a member
   */
  async removeOrgRoleFromMember(membershipId: string, roleId: string): Promise<{ success: boolean }> {
    await this.rbacRepo.deleteOrgMemberRole(membershipId, roleId);
    return { success: true };
  }

  /**
   * Get user's org permissions
   */
  async getUserOrgPermissions(userId: string, orgId: string): Promise<Set<PermissionId>> {
    const permissions = await this.rbacRepo.getUserOrgPermissions(userId, orgId);
    return new Set(permissions);
  }

  /**
   * Create a workspace
   */
  async createWorkspace(
    workspaceId: string,
    orgId: string,
    name: string,
    description: string | null
  ): Promise<{ workspaceId: string }> {
    await this.rbacRepo.createWorkspace({
      id: workspaceId,
      orgId,
      name,
      description,
    });
    return { workspaceId };
  }

  /**
   * Get workspaces for an org
   */
  async getWorkspaces(orgId: string) {
    return await this.rbacRepo.getWorkspaces(orgId);
  }

  /**
   * Create workspace role
   */
  async createWorkspaceRole(
    roleId: string,
    orgId: string,
    workspaceId: string | null,
    name: string,
    description: string | null,
    permissions: PermissionId[]
  ): Promise<{ roleId: string }> {
    // Validate permissions
    for (const perm of permissions) {
      if (!isValidPermission(perm)) {
        throw new Error(`Invalid permission: ${perm}`);
      }
    }

    await this.rbacRepo.createWorkspaceRole({
      id: roleId,
      orgId,
      workspaceId,
      name,
      description,
      isSystem: false,
    });

    // Add permissions
    if (permissions.length > 0) {
      const permissionData = permissions.map((perm, index) => ({
        id: `${roleId}_perm_${index}`,
        roleId,
        permission: perm,
      }));
      await this.rbacRepo.createWorkspaceRolePermissions(permissionData);
    }

    return { roleId };
  }

  /**
   * Add user to workspace
   */
  async addWorkspaceMember(
    membershipId: string,
    workspaceId: string,
    userId: string
  ): Promise<{ success: boolean }> {
    await this.rbacRepo.createWorkspaceMembership({
      id: membershipId,
      workspaceId,
      userId,
    });
    return { success: true };
  }

  /**
   * Assign workspace role to member
   */
  async assignWorkspaceRoleToMember(
    assignmentId: string,
    workspaceMembershipId: string,
    roleId: string
  ): Promise<{ success: boolean }> {
    await this.rbacRepo.createWorkspaceMemberRole({
      id: assignmentId,
      membershipId: workspaceMembershipId,
      roleId,
    });
    return { success: true };
  }

  /**
   * Get user's workspace permissions
   */
  async getUserWorkspacePermissions(userId: string, workspaceId: string): Promise<Set<PermissionId>> {
    const permissions = await this.rbacRepo.getUserWorkspacePermissions(userId, workspaceId);
    return new Set(permissions);
  }

  /**
   * Bootstrap default roles for a new organization
   */
  async bootstrapDefaultOrgRoles(
    ownerRoleId: string,
    assignmentId: string,
    orgId: string,
    ownerId: string
  ): Promise<{ ownerRoleId: string }> {
    // Create Owner role with all org permissions
    await this.rbacRepo.createOrgRole({
      id: ownerRoleId,
      orgId,
      name: 'Owner',
      description: 'Full organization access',
      isSystem: true,
    });

    // Grant all org permissions (simplified for now)
    const ownerPermissions: PermissionId[] = [
      'org.view',
      'org.update',
      'org.security.manage',
      'org.audit.read',
      'org.members.invite',
      'org.members.remove',
      'org.members.permissions.assign',
      'org.workspaces.create',
      'org.workspaces.archive',
      'org.billing.read',
      'org.billing.update',
      'org.api_tokens.manage',
      'org.emergency_access.manage',
    ];

    const permissionData = ownerPermissions.map((perm, index) => ({
      id: `${ownerRoleId}_perm_${index}`,
      roleId: ownerRoleId,
      permission: perm,
    }));

    await this.rbacRepo.createOrgRolePermissions(permissionData);

    // Assign owner role to the creator
    const membership = await this.rbacRepo.getMembershipByUserAndOrg(ownerId, orgId);
    if (membership) {
      await this.rbacRepo.createOrgMemberRole({
        id: assignmentId,
        membershipId: membership.id,
        roleId: ownerRoleId,
      });
    }

    return { ownerRoleId };
  }
}
