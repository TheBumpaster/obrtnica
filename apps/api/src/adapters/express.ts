import { TokenService, hashToken } from '@serp/core';
import type { Context, ValidatedPrincipal } from '@serp/trpc';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { eq, and, isNull } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { ulid } from 'ulid';

import { db, apiTokens } from '../db';
import type { AppRouter } from '../router';

const tokenService = new TokenService(process.env.JWT_SECRET || 'dev-secret-change-in-production');

export async function createContext({ req }: { req: Request; res: Response }): Promise<Context> {
  let principal: ValidatedPrincipal | undefined;
  let userId: string | undefined;
  let orgId: string | undefined;

  // Try to parse bearer token
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // Check if it's an API token (starts with api_)
    if (token.startsWith('api_')) {
      try {
        const tokenHash = hashToken(token);

        // Lookup API token in database
        const tokens = await db
          .select()
          .from(apiTokens)
          .where(and(eq(apiTokens.tokenHash, tokenHash), isNull(apiTokens.revokedAt)))
          .limit(1);

        if (tokens.length > 0) {
          const apiToken = tokens[0];

          // Check expiration
          if (!apiToken.expiresAt || apiToken.expiresAt > new Date()) {
            // Valid API token - create service principal
            principal = {
              serviceAccountId: apiToken.serviceAccountId || apiToken.id,
              orgId: apiToken.orgId,
              type: 'service',
            };
            orgId = apiToken.orgId;

            // Update last used (fire and forget)
            db.update(apiTokens)
              .set({ lastUsedAt: new Date() })
              .where(eq(apiTokens.id, apiToken.id))
              .catch((err) => console.error('Failed to update API token last used:', err));
          }
        }
      } catch (err) {
        console.warn('Invalid API token:', err);
      }
    } else {
      // Regular JWT access token
      try {
        principal = tokenService.validateAccessToken(token);

        // Extract for convenience
        if (principal.type === 'user') {
          userId = principal.userId;
          orgId = principal.orgId;
        } else {
          orgId = principal.orgId;
        }
      } catch (err) {
        // Token invalid or expired - context will have no principal
        console.warn('Invalid bearer token:', err);
      }
    }
  }

  // Fallback to dev headers if no bearer token (for backward compat during migration)
  if (!principal) {
    userId = req.headers['x-user-id'] as string | undefined;
    orgId = req.headers['x-org-id'] as string | undefined;
  }

  // Generate unique identifiers for request tracking
  const requestId = ulid();
  const correlationId = (req.headers['x-correlation-id'] as string | undefined) || ulid();

  // Extract client information for audit trail
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    undefined;
  const userAgent = req.headers['user-agent'] || undefined;

  return {
    principal,
    userId,
    orgId,
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
