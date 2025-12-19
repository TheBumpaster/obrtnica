import { AuditEventTypes, buildAuditEvent, buildUserActor, createGdprEraseRequestedEvent, createGdprExportRequestedEvent, DataCategories, DataClassifications } from '@serp/core';
import { requireUserAuth } from '@serp/trpc';
import { gdprDownloadExportInputSchema, gdprGetRequestStatusInputSchema, gdprRequestErasureInputSchema, gdprRequestExportInputSchema } from '@serp/validations';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { ulid } from 'ulid';

import { enqueueAuditEvent } from '../audit/audit.service';
import { db, gdprRequests, orgMemberships, outboxEvents } from '../db';
import { protectedProcedure, router } from './base';

export const gdprRouter = router({
  requestExport: protectedProcedure
    .input(gdprRequestExportInputSchema)
    .mutation(async ({ input, ctx }) => {
      const auth = requireUserAuth(ctx);
      const targetUserId = input.targetUserId || auth.userId;
      const scopeOrgId = input.scopeOrgId || null;

      // Authorization check
      if (targetUserId !== auth.userId) {
        // Admin-on-behalf case: require admin role in scopeOrgId
        if (!scopeOrgId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin requests must specify scopeOrgId',
          });
        }

        // Check membership and admin role
        const membership = await db
          .select()
          .from(orgMemberships)
          .where(
            and(eq(orgMemberships.userId, auth.userId), eq(orgMemberships.orgId, scopeOrgId))
          )
          .limit(1);

        if (membership.length === 0 || !membership[0].roles.includes('admin')) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin role required for on-behalf requests',
          });
        }
      }

      const requestId = ulid();
      const correlationId = ctx.correlationId || ulid();

      // Create request, audit, and outbox event in transaction
      await db.transaction(async (tx) => {
        // Insert GDPR request
        await tx.insert(gdprRequests).values({
          id: requestId,
          type: 'EXPORT',
          status: 'PENDING',
          scopeOrgId,
          requesterUserId: auth.userId,
          targetUserId,
          correlationId,
          requestId: ctx.requestId,
        });

        // Emit audit event
        const auditEvent = buildAuditEvent({
          eventType: AuditEventTypes.DATA_EXPORT_REQUESTED,
          tenantId: scopeOrgId || undefined,
          actor: buildUserActor(auth.userId),
          ip: ctx.ip,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
          correlationId,
          resourceType: 'GdprRequest',
          resourceId: requestId,
          action: 'EXPORT',
          status: 'SUCCESS',
          dataTag: {
            classification: DataClassifications.RESTRICTED,
            categories: [DataCategories.IDENTITY, DataCategories.AUDIT],
          },
          metadata: {
            targetUserId,
            scopeOrgId: scopeOrgId || undefined,
          },
        });

        await enqueueAuditEvent(tx, auditEvent);

        // Emit domain event to trigger worker
        const domainEvent = createGdprExportRequestedEvent(
          scopeOrgId || auth.orgId || 'system',
          {
            requestId,
            targetUserId,
            requesterUserId: auth.userId,
            scopeOrgId,
          },
          correlationId
        );

        await tx.insert(outboxEvents).values({
          id: ulid(),
          eventId: domainEvent.eventId,
          eventType: domainEvent.eventType,
          eventVersion: domainEvent.eventVersion,
          tenantId: domainEvent.tenantId,
          correlationId: domainEvent.correlationId,
          payload: domainEvent.payload as Record<string, unknown>,
          occurredAt: domainEvent.occurredAt,
        });
      });

      return { requestId };
    }),

  requestErasure: protectedProcedure
    .input(gdprRequestErasureInputSchema)
    .mutation(async ({ input, ctx }) => {
      const auth = requireUserAuth(ctx);
      const targetUserId = input.targetUserId || auth.userId;
      const scopeOrgId = input.scopeOrgId || null;
      const mode = input.mode;

      // Authorization check (same as export)
      if (targetUserId !== auth.userId) {
        if (!scopeOrgId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin requests must specify scopeOrgId',
          });
        }

        const membership = await db
          .select()
          .from(orgMemberships)
          .where(
            and(eq(orgMemberships.userId, auth.userId), eq(orgMemberships.orgId, scopeOrgId))
          )
          .limit(1);

        if (membership.length === 0 || !membership[0].roles.includes('admin')) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin role required for on-behalf requests',
          });
        }
      }

      const requestId = ulid();
      const correlationId = ctx.correlationId || ulid();

      await db.transaction(async (tx) => {
        // Insert GDPR request
        await tx.insert(gdprRequests).values({
          id: requestId,
          type: 'ERASURE',
          status: 'PENDING',
          scopeOrgId,
          requesterUserId: auth.userId,
          targetUserId,
          correlationId,
          requestId: ctx.requestId,
          mode,
        });

        // Emit audit event
        const auditEvent = buildAuditEvent({
          eventType: AuditEventTypes.DATA_ERASE_REQUESTED,
          tenantId: scopeOrgId || undefined,
          actor: buildUserActor(auth.userId),
          ip: ctx.ip,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
          correlationId,
          resourceType: 'GdprRequest',
          resourceId: requestId,
          action: 'ERASE',
          status: 'SUCCESS',
          dataTag: {
            classification: DataClassifications.RESTRICTED,
            categories: [DataCategories.IDENTITY, DataCategories.AUDIT],
          },
          metadata: {
            targetUserId,
            scopeOrgId: scopeOrgId || undefined,
            mode,
          },
        });

        await enqueueAuditEvent(tx, auditEvent);

        // Emit domain event
        const domainEvent = createGdprEraseRequestedEvent(
          scopeOrgId || auth.orgId || 'system',
          {
            requestId,
            targetUserId,
            requesterUserId: auth.userId,
            scopeOrgId,
            mode,
          },
          correlationId
        );

        await tx.insert(outboxEvents).values({
          id: ulid(),
          eventId: domainEvent.eventId,
          eventType: domainEvent.eventType,
          eventVersion: domainEvent.eventVersion,
          tenantId: domainEvent.tenantId,
          correlationId: domainEvent.correlationId,
          payload: domainEvent.payload as Record<string, unknown>,
          occurredAt: domainEvent.occurredAt,
        });
      });

      return { requestId };
    }),

  getRequestStatus: protectedProcedure
    .input(gdprGetRequestStatusInputSchema)
    .query(async ({ input, ctx }) => {
      const auth = requireUserAuth(ctx);
      const request = await db
        .select()
        .from(gdprRequests)
        .where(eq(gdprRequests.id, input.requestId))
        .limit(1);

      if (request.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        });
      }

      const req = request[0];

      // Authorization: can view if requester or target
      if (req.requesterUserId !== auth.userId && req.targetUserId !== auth.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to view this request',
        });
      }

      return {
        id: req.id,
        type: req.type,
        status: req.status,
        requestedAt: req.requestedAt.toISOString(),
        processedAt: req.processedAt?.toISOString() || null,
        expiresAt: req.expiresAt?.toISOString() || null,
        failureReason: req.failureReason,
        hasResult: !!req.resultLocation,
      };
    }),

  downloadExport: protectedProcedure
    .input(gdprDownloadExportInputSchema)
    .query(async ({ input, ctx }) => {
      const auth = requireUserAuth(ctx);
      const request = await db
        .select()
        .from(gdprRequests)
        .where(eq(gdprRequests.id, input.requestId))
        .limit(1);

      if (request.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        });
      }

      const req = request[0];

      // Authorization: can download if requester or target
      if (req.requesterUserId !== auth.userId && req.targetUserId !== auth.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to download this export',
        });
      }

      if (req.type !== 'EXPORT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Request is not an export',
        });
      }

      if (req.status !== 'COMPLETED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Export is not ready',
        });
      }

      if (!req.resultLocation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Export file not found',
        });
      }

      // For now, return the location (worker will implement actual file reading)
      // In a real implementation with proper auth, this would use StorageAdapter.getSignedUrl
      // or stream the file directly
      return {
        location: req.resultLocation,
        checksum: req.checksum,
        expiresAt: req.expiresAt?.toISOString() || null,
      };
    }),
});
