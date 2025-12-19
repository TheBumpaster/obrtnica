import {
  buildAuditEvent,
  buildUserActor,
  DataCategories,
  DataClassifications,
} from '@serp/core';
import { requireUserAuth, requirePermission } from '@serp/trpc';
import { TRPCError } from '@trpc/server';
import { and, eq, isNull, gt } from 'drizzle-orm';
import { ulid } from 'ulid';
import { z } from 'zod';

import { enqueueAuditEvent } from '../audit/audit.service';
import { db, emergencyAccessGrants } from '../db';
import { protectedProcedure, router } from './base';

const activateEmergencyAccessSchema = z.object({
  justification: z.string().min(10).max(1000),
  durationMinutes: z.number().min(15).max(480).default(60), // 15 min to 8 hours
});

const revokeEmergencyAccessSchema = z.object({
  grantId: z.string(),
});

export const emergencyAccessRouter = router({
  /**
   * Activate emergency access (break-glass)
   * Requires step-up authentication
   */
  activateEmergencyAccess: protectedProcedure
    .input(activateEmergencyAccessSchema)
    .mutation(async ({ input, ctx }) => {
      const auth = requireUserAuth(ctx);

      // Check permission (this will enforce step-up + MFA via permission catalog)
      await requirePermission(ctx, 'org.emergency_access.manage');

      // Check if there's already an active grant
      const activeGrants = await db
        .select()
        .from(emergencyAccessGrants)
        .where(
          and(
            eq(emergencyAccessGrants.orgId, auth.orgId),
            eq(emergencyAccessGrants.userId, auth.userId),
            isNull(emergencyAccessGrants.revokedAt),
            gt(emergencyAccessGrants.expiresAt, new Date())
          )
        )
        .limit(1);

      if (activeGrants.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Emergency access already active',
        });
      }

      // Create emergency access grant
      const grantId = ulid();
      const expiresAt = new Date(Date.now() + input.durationMinutes * 60 * 1000);

      await db.insert(emergencyAccessGrants).values({
        id: grantId,
        orgId: auth.orgId,
        userId: auth.userId,
        justification: input.justification,
        expiresAt,
      });

      // Heavy audit logging
      const auditEvent = buildAuditEvent({
        eventType: 'security.emergency_access.activated',
        tenantId: auth.orgId,
        actor: buildUserActor(auth.userId),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        requestId: ctx.requestId,
        correlationId: ctx.correlationId,
        resourceType: 'EmergencyAccessGrant',
        resourceId: grantId,
        action: 'ACTIVATE',
        status: 'SUCCESS',
        severity: 'WARN',
        dataTag: {
          classification: DataClassifications.RESTRICTED,
          categories: [DataCategories.AUDIT],
        },
        metadata: {
          // Do NOT log justification - may contain PHI
          justificationLength: input.justification.length,
          durationMinutes: input.durationMinutes,
          expiresAt: expiresAt.toISOString(),
        },
      });

      await enqueueAuditEvent(db, auditEvent);

      console.warn(
        `[EMERGENCY ACCESS] Activated for user ${auth.userId} in org ${auth.orgId}. Grant ID: ${grantId}, Duration: ${input.durationMinutes}min`
      );

      return {
        grantId,
        expiresAt: expiresAt.toISOString(),
        expiresIn: input.durationMinutes * 60, // seconds
      };
    }),

  /**
   * Revoke emergency access early
   */
  revokeEmergencyAccess: protectedProcedure
    .input(revokeEmergencyAccessSchema)
    .mutation(async ({ input, ctx }) => {
      const auth = requireUserAuth(ctx);

      // Get grant
      const grants = await db
        .select()
        .from(emergencyAccessGrants)
        .where(eq(emergencyAccessGrants.id, input.grantId))
        .limit(1);

      if (grants.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Emergency access grant not found' });
      }

      const grant = grants[0];

      // Check if user has permission to revoke (either the grantee or an admin)
      // For now, only the grantee or same org member can revoke
      if (grant.userId !== auth.userId && grant.orgId !== auth.orgId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot revoke this grant' });
      }

      // Revoke
      await db
        .update(emergencyAccessGrants)
        .set({
          revokedAt: new Date(),
          revokedByUserId: auth.userId,
        })
        .where(eq(emergencyAccessGrants.id, input.grantId));

      // Heavy audit logging
      const auditEvent = buildAuditEvent({
        eventType: 'security.emergency_access.revoked',
        tenantId: grant.orgId,
        actor: buildUserActor(auth.userId),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        requestId: ctx.requestId,
        correlationId: ctx.correlationId,
        resourceType: 'EmergencyAccessGrant',
        resourceId: input.grantId,
        action: 'REVOKE',
        status: 'SUCCESS',
        severity: 'WARN',
        dataTag: {
          classification: DataClassifications.RESTRICTED,
          categories: [DataCategories.AUDIT],
        },
        metadata: {
          granteeUserId: grant.userId,
          // Do NOT log justification - may contain PHI
        },
      });

      await enqueueAuditEvent(db, auditEvent);

      console.warn(
        `[EMERGENCY ACCESS] Revoked grant ${input.grantId} for user ${grant.userId} in org ${grant.orgId}`
      );

      return { success: true };
    }),

  /**
   * List emergency access grants (active and past)
   */
  listEmergencyGrants: protectedProcedure.query(async ({ ctx }) => {
    const auth = requireUserAuth(ctx);

    // Check permission (org.audit.read allows viewing emergency grants)
    await requirePermission(ctx, 'org.audit.read');

    const grants = await db
      .select()
      .from(emergencyAccessGrants)
      .where(eq(emergencyAccessGrants.orgId, auth.orgId));

    return {
      grants: grants.map((g) => ({
        id: g.id,
        userId: g.userId,
        justificationRedacted: true,
        justificationLength: g.justification.length,
        createdAt: g.createdAt.toISOString(),
        expiresAt: g.expiresAt.toISOString(),
        revokedAt: g.revokedAt?.toISOString() || null,
        revokedByUserId: g.revokedByUserId,
        isActive: !g.revokedAt && g.expiresAt > new Date(),
      })),
    };
  }),

  /**
   * Get my active emergency grant (if any)
   */
  getMyEmergencyGrant: protectedProcedure.query(async ({ ctx }) => {
    const auth = requireUserAuth(ctx);

    const grants = await db
      .select()
      .from(emergencyAccessGrants)
      .where(
        and(
          eq(emergencyAccessGrants.userId, auth.userId),
          eq(emergencyAccessGrants.orgId, auth.orgId),
          isNull(emergencyAccessGrants.revokedAt),
          gt(emergencyAccessGrants.expiresAt, new Date())
        )
      )
      .limit(1);

    if (grants.length === 0) {
      return { hasActive: false, grant: null };
    }

    const grant = grants[0];

    return {
      hasActive: true,
      grant: {
        id: grant.id,
        justificationRedacted: true,
        justificationLength: grant.justification.length,
        expiresAt: grant.expiresAt.toISOString(),
        remainingSeconds: Math.max(0, Math.floor((grant.expiresAt.getTime() - Date.now()) / 1000)),
      },
    };
  }),
});
