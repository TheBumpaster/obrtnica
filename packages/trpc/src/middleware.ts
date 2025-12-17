import { TRPCError } from '@trpc/server';

import type { Context } from './context';

export function requireAuth(ctx: Context) {
  if (!ctx.userId || !ctx.orgId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
  return {
    userId: ctx.userId,
    orgId: ctx.orgId,
    roles: ctx.roles || [],
  };
}

export function scopeToTenant(ctx: Context, tenantId: string) {
  const auth = requireAuth(ctx);
  if (auth.orgId !== tenantId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Access denied to this tenant',
    });
  }
  return auth;
}
