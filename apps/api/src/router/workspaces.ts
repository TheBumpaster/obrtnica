import { RbacDomainService, type PermissionId } from '@serp/core';
import { requireUserAuth, requirePermission } from '@serp/trpc';
import { TRPCError } from '@trpc/server';
import { ulid } from 'ulid';
import { z } from 'zod';

import { db } from '../db';
import { RbacRepository } from '../repositories/rbac-repository';

import { protectedProcedure, router } from './index';

const rbacRepo = new RbacRepository(db);
const rbacService = new RbacDomainService(rbacRepo);

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const addWorkspaceMemberSchema = z.object({
  workspaceId: z.string(),
  userId: z.string(),
});

const assignWorkspaceRoleSchema = z.object({
  workspaceId: z.string(),
  userId: z.string(),
  roleId: z.string(),
});

const createWorkspaceRoleSchema = z.object({
  workspaceId: z.string().optional(), // null = org-wide template
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()),
});

export const workspacesRouter = router({
  /**
   * Create a workspace
   */
  createWorkspace: protectedProcedure.input(createWorkspaceSchema).mutation(async ({ input, ctx }) => {
    const auth = requireUserAuth(ctx);

    // Check permission
    await requirePermission(ctx, 'org.workspaces.create');

    try {
      const workspaceId = ulid();
      const result = await rbacService.createWorkspace(
        workspaceId,
        auth.orgId,
        input.name,
        input.description || null
      );

      return result;
    } catch (error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: (error as Error).message,
      });
    }
  }),

  /**
   * List workspaces
   */
  listWorkspaces: protectedProcedure.query(async ({ ctx }) => {
    const auth = requireUserAuth(ctx);

    const workspaces = await rbacService.getWorkspaces(auth.orgId);
    return { workspaces };
  }),

  /**
   * Add member to workspace
   */
  addMember: protectedProcedure.input(addWorkspaceMemberSchema).mutation(async ({ input, ctx }) => {
    const _auth = requireUserAuth(ctx);

    // Check permission - requires workspace.members.assign
    await requirePermission(ctx, 'workspace.members.assign', input.workspaceId);

    const membershipId = ulid();
    const result = await rbacService.addWorkspaceMember(membershipId, input.workspaceId, input.userId);
    return result;
  }),

  /**
   * Create workspace role
   */
  createWorkspaceRole: protectedProcedure.input(createWorkspaceRoleSchema).mutation(async ({ input, ctx }) => {
    const auth = requireUserAuth(ctx);

    // Check permission
    await requirePermission(ctx, 'org.workspaces.create');

    const roleId = ulid();
    const result = await rbacService.createWorkspaceRole(
      roleId,
      auth.orgId,
      input.workspaceId || null,
      input.name,
      input.description || null,
      input.permissions as PermissionId[]
    );

    return result;
  }),

  /**
   * Assign workspace role to member
   */
  assignRole: protectedProcedure.input(assignWorkspaceRoleSchema).mutation(async ({ input, ctx }) => {
    requireUserAuth(ctx);

    // Check permission
    await requirePermission(ctx, 'workspace.members.assign', input.workspaceId);

    // Get workspace membership
    const membership = await rbacRepo.getWorkspaceMembership(input.userId, input.workspaceId);
    if (!membership) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User is not a member of this workspace',
      });
    }

    const assignmentId = ulid();
    const result = await rbacService.assignWorkspaceRoleToMember(assignmentId, membership.id, input.roleId);
    return result;
  }),
});
