import type { AuditEvent } from '@serp/core';
import { buildPermissionDeniedAuditEvent, buildUserActor } from '@serp/core';
import type { Context } from '@serp/trpc';
import { requireAuth } from '@serp/trpc';
import { initTRPC, TRPCError } from '@trpc/server';

import { enqueueAuditEvent } from '../audit/audit.service';
import { db } from '../db';
import { authRouter } from './auth';
import { emergencyAccessRouter } from './emergency-access';
import { gdprRouter } from './gdpr';
import { healthRouter } from './health';
import { rbacRouter } from './rbac';
import { sampleRouter } from './sample';
import { tokensRouter } from './tokens';
import { workspacesRouter } from './workspaces';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware that adds audit helper to context
const auditMiddleware = t.procedure.use(async (opts) => {
  const auditLog = async (auditEvent: AuditEvent) => {
    await enqueueAuditEvent(db, auditEvent);
  };

  return opts.next({
    ctx: {
      ...opts.ctx,
      audit: {
        log: auditLog,
      },
    },
  });
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

export const appRouter = router({
  auth: authRouter,
  emergencyAccess: emergencyAccessRouter,
  gdpr: gdprRouter,
  health: healthRouter,
  rbac: rbacRouter,
  sample: sampleRouter,
  tokens: tokensRouter,
  workspaces: workspacesRouter,
});

export type AppRouter = typeof appRouter;
