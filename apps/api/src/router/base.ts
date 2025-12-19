import type { AuditEvent } from '@serp/core';
import { buildPermissionDeniedAuditEvent, buildUserActor, metrics } from '@serp/core';
import type { Context } from '@serp/trpc';
import { requireAuth } from '@serp/trpc';
import { initTRPC, TRPCError } from '@trpc/server';

import { enqueueAuditEvent } from '../audit/audit.service';
import { db } from '../db';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware that adds audit helper to context and records metrics
const auditMiddleware = t.procedure.use(async (opts) => {
  const startTime = Date.now();
  const auditLog = async (auditEvent: AuditEvent) => {
    await enqueueAuditEvent(db, auditEvent);
  };

  try {
    const result = await opts.next({
      ctx: {
        ...opts.ctx,
        audit: {
          log: auditLog,
        },
      },
    });

    // Record successful request metrics
    const duration = Date.now() - startTime;
    metrics.incrementCounter('api_requests_total', { status: 'success' });
    metrics.recordHistogram('api_request_duration_ms', duration);

    return result;
  } catch (error) {
    // Record failed request metrics
    const duration = Date.now() - startTime;
    const status = error instanceof TRPCError ? error.code : 'error';
    metrics.incrementCounter('api_requests_total', { status });
    metrics.recordHistogram('api_request_duration_ms', duration, { status });

    throw error;
  }
});

// Protected procedure with auth + audit + permission denied logging
export const protectedProcedure = auditMiddleware.use(async (opts) => {
  try {
    const auth = requireAuth(opts.ctx);
    return opts.next({
      ctx: {
        ...opts.ctx,
        auth,
      },
    });
  } catch (error) {
    // Log permission denied audit event
    if (error instanceof TRPCError && error.code === 'FORBIDDEN') {
      const auditEvent = buildPermissionDeniedAuditEvent({
        tenantId: opts.ctx.orgId,
        actor: opts.ctx.userId
          ? buildUserActor(opts.ctx.userId)
          : { type: 'SYSTEM', display: 'anonymous' },
        ip: opts.ctx.ip,
        userAgent: opts.ctx.userAgent,
        requestId: opts.ctx.requestId,
        correlationId: opts.ctx.correlationId,
        reason: 'tenant_scope_violation',
      });

      await enqueueAuditEvent(db, auditEvent);
    } else if (error instanceof TRPCError && error.code === 'UNAUTHORIZED') {
      // Log unauthorized access attempt
      const auditEvent = buildPermissionDeniedAuditEvent({
        actor: opts.ctx.userId
          ? buildUserActor(opts.ctx.userId)
          : { type: 'SYSTEM', display: 'anonymous' },
        ip: opts.ctx.ip,
        userAgent: opts.ctx.userAgent,
        requestId: opts.ctx.requestId,
        correlationId: opts.ctx.correlationId,
        reason: 'authentication_required',
      });

      await enqueueAuditEvent(db, auditEvent);
    }

    throw error;
  }
});
