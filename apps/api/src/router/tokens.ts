import {
  AuditEventTypes,
  buildAuditEvent,
  buildUserActor,
  DataCategories,
  DataClassifications,
  generateSecureToken,
  hashToken,
} from '@serp/core';
import { requireUserAuth, requirePermission } from '@serp/trpc';
import { TRPCError } from '@trpc/server';
import { and, eq, isNull } from 'drizzle-orm';
import { ulid } from 'ulid';
import { z } from 'zod';

import { enqueueAuditEvent } from '../audit/audit.service';
import { apiTokens, db, serviceAccounts } from '../db';

import { protectedProcedure, router } from './index';

const createServiceAccountSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

const createApiTokenSchema = z.object({
  serviceAccountId: z.string().optional(),
  name: z.string().min(1).max(200),
  scopes: z.array(z.string()).default([]),
  workspaceScope: z.string().optional(),
  expiresInDays: z.number().min(1).max(365).optional(),
});

const revokeApiTokenSchema = z.object({
  tokenId: z.string(),
});

export const tokensRouter = router({
  /**
   * Create a service account (non-human identity)
   */
  createServiceAccount: protectedProcedure
    .input(createServiceAccountSchema)
    .mutation(async ({ input, ctx }) => {
      const auth = requireUserAuth(ctx);

      // Check permission
      await requirePermission(ctx, 'org.api_tokens.manage');

      const serviceAccountId = ulid();

      await db.insert(serviceAccounts).values({
        id: serviceAccountId,
        orgId: auth.orgId,
        name: input.name,
        description: input.description || null,
      });

      // Audit
      const auditEvent = buildAuditEvent({
        eventType: 'service_account.created',
        tenantId: auth.orgId,
        actor: buildUserActor(auth.userId),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        requestId: ctx.requestId,
        correlationId: ctx.correlationId,
        resourceType: 'ServiceAccount',
        resourceId: serviceAccountId,
        action: 'CREATE',
        status: 'SUCCESS',
        dataTag: {
          classification: DataClassifications.CONFIDENTIAL,
          categories: [DataCategories.TENANT],
        },
      });

      await enqueueAuditEvent(db, auditEvent);

      return { id: serviceAccountId, name: input.name };
    }),

  /**
   * List service accounts
   */
  listServiceAccounts: protectedProcedure.query(async ({ ctx }) => {
    const auth = requireUserAuth(ctx);

    const accounts = await db
      .select()
      .from(serviceAccounts)
      .where(and(eq(serviceAccounts.orgId, auth.orgId), isNull(serviceAccounts.deletedAt)));

    return {
      serviceAccounts: accounts.map((sa) => ({
        id: sa.id,
        name: sa.name,
        description: sa.description,
        createdAt: sa.createdAt.toISOString(),
      })),
    };
  }),

  /**
   * Create an API token
   * Token secret is shown ONLY ONCE
   */
  createApiToken: protectedProcedure.input(createApiTokenSchema).mutation(async ({ input, ctx }) => {
    const auth = requireUserAuth(ctx);

    // Check permission
    await requirePermission(ctx, 'org.api_tokens.manage');

    // If serviceAccountId provided, verify it belongs to org
    if (input.serviceAccountId) {
      const accounts = await db
        .select()
        .from(serviceAccounts)
        .where(eq(serviceAccounts.id, input.serviceAccountId))
        .limit(1);

      if (accounts.length === 0 || accounts[0].orgId !== auth.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Service account not found' });
      }
    }

    // Generate token
    const token = `api_${generateSecureToken(32)}`;
    const tokenHash = hashToken(token);
    const tokenPrefix = token.substring(0, 12); // Show first 12 chars

    const tokenId = ulid();
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    await db.insert(apiTokens).values({
      id: tokenId,
      orgId: auth.orgId,
      serviceAccountId: input.serviceAccountId || null,
      name: input.name,
      tokenPrefix,
      tokenHash,
      scopes: input.scopes,
      workspaceScope: input.workspaceScope || null,
      expiresAt,
    });

    // Audit
    const auditEvent = buildAuditEvent({
      eventType: AuditEventTypes.API_KEY_CREATED,
      tenantId: auth.orgId,
      actor: buildUserActor(auth.userId),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
      resourceType: 'ApiToken',
      resourceId: tokenId,
      action: 'CREATE',
      status: 'SUCCESS',
      dataTag: {
        classification: DataClassifications.RESTRICTED,
        categories: [DataCategories.AUTH],
      },
      metadata: {
        serviceAccountId: input.serviceAccountId,
        scopes: input.scopes,
        expiresInDays: input.expiresInDays,
      },
    });

    await enqueueAuditEvent(db, auditEvent);

    return {
      id: tokenId,
      token, // SHOW ONLY ONCE
      prefix: tokenPrefix,
      expiresAt: expiresAt?.toISOString() || null,
    };
  }),

  /**
   * List API tokens (without secrets)
   */
  listApiTokens: protectedProcedure.query(async ({ ctx }) => {
    const auth = requireUserAuth(ctx);

    const tokens = await db
      .select()
      .from(apiTokens)
      .where(and(eq(apiTokens.orgId, auth.orgId), isNull(apiTokens.revokedAt)));

    return {
      tokens: tokens.map((t) => ({
        id: t.id,
        name: t.name,
        prefix: t.tokenPrefix,
        serviceAccountId: t.serviceAccountId,
        scopes: t.scopes,
        workspaceScope: t.workspaceScope,
        expiresAt: t.expiresAt?.toISOString() || null,
        lastUsedAt: t.lastUsedAt?.toISOString() || null,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }),

  /**
   * Revoke an API token
   */
  revokeApiToken: protectedProcedure.input(revokeApiTokenSchema).mutation(async ({ input, ctx }) => {
    const auth = requireUserAuth(ctx);

    // Verify token belongs to org
    const tokens = await db
      .select()
      .from(apiTokens)
      .where(and(eq(apiTokens.id, input.tokenId), eq(apiTokens.orgId, auth.orgId)))
      .limit(1);

    if (tokens.length === 0) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'API token not found' });
    }

    // Revoke
    await db.update(apiTokens).set({ revokedAt: new Date() }).where(eq(apiTokens.id, input.tokenId));

    // Audit
    const auditEvent = buildAuditEvent({
      eventType: AuditEventTypes.API_KEY_REVOKED,
      tenantId: auth.orgId,
      actor: buildUserActor(auth.userId),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
      resourceType: 'ApiToken',
      resourceId: input.tokenId,
      action: 'REVOKE',
      status: 'SUCCESS',
      dataTag: {
        classification: DataClassifications.RESTRICTED,
        categories: [DataCategories.AUTH],
      },
    });

    await enqueueAuditEvent(db, auditEvent);

    return { success: true };
  }),
});
