import { RbacDomainService, type PermissionId } from '@serp/core';
import { requireUserAuth, requirePermission } from '@serp/trpc';
import { TRPCError } from '@trpc/server';
import { ulid } from 'ulid';
import { z } from 'zod';

import { db } from '../db';
import { protectedProcedure, router } from './base';
import { RbacRepository } from '../repositories/rbac-repository';


const rbacRepo = new RbacRepository(db);
const rbacService = new RbacDomainService(rbacRepo);

const createOrgRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()),
});

const assignRoleSchema = z.object({
  membershipId: z.string(),
  roleId: z.string(),
});

export const rbacRouter = router({
  /**
   * Create an org role
   */
  createOrgRole: protectedProcedure.input(createOrgRoleSchema).mutation(async ({ input, ctx }) => {
    const auth = requireUserAuth(ctx);

    // Check permission
    await requirePermission(ctx, 'org.members.permissions.assign');

    try {
      const roleId = ulid();
      const result = await rbacService.createOrgRole(
        roleId,
        auth.orgId,
        input.name,
        input.description || null,
        input.permissions as PermissionId[]
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
   * List org roles
   */
  listOrgRoles: protectedProcedure.query(async ({ ctx }) => {
    const auth = requireUserAuth(ctx);

    const roles = await rbacService.getOrgRoles(auth.orgId);
    return { roles };
  }),

  /**
   * Assign role to member
   */
  assignRole: protectedProcedure.input(assignRoleSchema).mutation(async ({ input, ctx }) => {
    requireUserAuth(ctx);

    // Check permission
    await requirePermission(ctx, 'org.members.permissions.assign');

    const assignmentId = ulid();
    const result = await rbacService.assignOrgRoleToMember(assignmentId, input.membershipId, input.roleId);
    return result;
  }),

  /**
   * Remove role from member
   */
  removeRole: protectedProcedure.input(assignRoleSchema).mutation(async ({ input, ctx }) => {
    requireUserAuth(ctx);

    // Check permission
    await requirePermission(ctx, 'org.members.permissions.assign');

    const result = await rbacService.removeOrgRoleFromMember(input.membershipId, input.roleId);
    return result;
  }),

  /**
   * Get my permissions
   */
  getMyPermissions: protectedProcedure.query(async ({ ctx }) => {
    const auth = requireUserAuth(ctx);

    const permissions = await rbacService.getUserOrgPermissions(auth.userId, auth.orgId);
    return { permissions: Array.from(permissions) };
  }),
});
