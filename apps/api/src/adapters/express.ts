import type { Context } from '@serp/trpc';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import type { Request, Response } from 'express';
import { ulid } from 'ulid';

import type { AppRouter } from '../router';

export function createContext({ req }: { req: Request; res: Response }): Context {
  // In a real app, extract userId/orgId from JWT or session
  // For now, use mock auth from headers for development
  const userId = req.headers['x-user-id'] as string | undefined;
  const orgId = req.headers['x-org-id'] as string | undefined;
  const roles = req.headers['x-roles']
    ? (req.headers['x-roles'] as string).split(',')
    : undefined;
  
  // Generate unique identifiers for request tracking
  const requestId = ulid();
  const correlationId = req.headers['x-correlation-id'] as string | undefined || ulid();
  
  // Extract client information for audit trail
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
    || req.socket.remoteAddress 
    || undefined;
  const userAgent = req.headers['user-agent'] || undefined;

  return {
    userId,
    orgId,
    roles,
    requestId,
    correlationId,
    ip,
    userAgent,
  };
}

export function createExpressAdapter(router: AppRouter) {
  return createExpressMiddleware({
    router,
    createContext,
  });
}
