import fs from 'fs/promises';
import path from 'path';

import { createChildLogger } from '@serp/core';
import { and, eq, isNotNull, lt } from 'drizzle-orm';

import { db, gdprRequests } from '../../db';

const logger = createChildLogger({ component: 'cleanup-expired-exports' });


/**
 * Delete expired GDPR export files
 * Runs daily at 1 AM
 */
export async function cleanupExpiredExports(): Promise<void> {
  logger.info('Starting expired exports cleanup');

  const now = new Date();

  // Find expired export requests
  const expiredExports = await db
    .select()
    .from(gdprRequests)
    .where(
      and(
        eq(gdprRequests.type, 'EXPORT'),
        eq(gdprRequests.status, 'COMPLETED'),
        isNotNull(gdprRequests.expiresAt),
        lt(gdprRequests.expiresAt, now)
      )
    );

  let deletedCount = 0;
  for (const exportRequest of expiredExports) {
    try {
      if (exportRequest.resultLocation) {
        // Delete file from storage (local FS)
        const basePath = process.env.STORAGE_BASE_PATH || './.local-storage';
        const fullPath = path.join(basePath, exportRequest.resultLocation);
        await fs.unlink(fullPath).catch(() => {
          // File may already be deleted, ignore error
        });
        
        // Mark request as expired
        await db
          .update(gdprRequests)
          .set({ status: 'EXPIRED' })
          .where(eq(gdprRequests.id, exportRequest.id));
        
        deletedCount++;
      }
    } catch (err) {
      logger.error({ err, exportId: exportRequest.id }, 'Failed to delete expired export');
    }
  }

  logger.info({ deletedCount, totalExpired: expiredExports.length }, 'Expired exports cleanup completed');
}
