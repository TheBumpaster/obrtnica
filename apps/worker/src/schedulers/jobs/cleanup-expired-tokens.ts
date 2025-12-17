import { createChildLogger } from '@serp/core';
import { and, isNotNull, lt } from 'drizzle-orm';

import { apiTokens, db } from '../../db';

const logger = createChildLogger({ component: 'cleanup-expired-tokens' });

/**
 * Cleanup expired API tokens
 * Runs daily at 2 AM
 */
export async function cleanupExpiredTokens(): Promise<void> {
  logger.info('Starting expired tokens cleanup');

  const now = new Date();

  // Delete expired and revoked tokens older than 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  await db
    .delete(apiTokens)
    .where(
      and(
        // Expired tokens
        isNotNull(apiTokens.expiresAt),
        lt(apiTokens.expiresAt, thirtyDaysAgo),
        // Or revoked tokens older than 30 days
        and(isNotNull(apiTokens.revokedAt), lt(apiTokens.revokedAt, thirtyDaysAgo))
      )
    );

  logger.info('Expired tokens cleanup completed');
}
