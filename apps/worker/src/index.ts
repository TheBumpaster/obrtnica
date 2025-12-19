import { createChildLogger } from '@serp/core';

import { startAuditEventConsumer } from './consumers/audit-event-consumer';
import { startAuthEventsConsumer } from './consumers/auth-events-consumer';
import { startGdprEraseConsumer } from './consumers/gdpr-erase-consumer';
import { startGdprExportConsumer } from './consumers/gdpr-export-consumer';
import { startNotificationConsumer } from './consumers/notification-consumer';
import { runOutboxDispatcher } from './consumers/outbox-dispatcher';
import { startSampleEventConsumer } from './consumers/sample-event-consumer';
import { ensureMongoIndexes } from './mongo';
import { closeConnection, getChannel } from './queue/connection';
import { setupQueues } from './queue/setup';
import { cleanupExpiredExports } from './schedulers/jobs/cleanup-expired-exports';
import { cleanupExpiredTokens } from './schedulers/jobs/cleanup-expired-tokens';
import { cleanupOldAuditEvents } from './schedulers/jobs/cleanup-old-audit-events';
import { registerJob, startScheduler, stopScheduler } from './schedulers/scheduler';

const logger = createChildLogger({ component: 'worker' });

async function main() {
  logger.info('Starting worker...');
  
  try {
    // Setup RabbitMQ
    const channel = await getChannel();
    await setupQueues(channel);
    
    // Setup MongoDB indexes
    await ensureMongoIndexes();
    
    // Start consumers
    await startSampleEventConsumer(channel);
    await startAuditEventConsumer(channel);
    await startAuthEventsConsumer(channel);
    await startGdprExportConsumer(channel);
    await startGdprEraseConsumer(channel);
    await startNotificationConsumer(channel);
    
    // Start outbox dispatcher
    await runOutboxDispatcher();
    
    // Register scheduled jobs
    registerJob({
      name: 'cleanup-expired-tokens',
      schedule: '0 2 * * *', // Daily at 2 AM
      task: cleanupExpiredTokens,
    });
    
    registerJob({
      name: 'cleanup-expired-exports',
      schedule: '0 1 * * *', // Daily at 1 AM
      task: cleanupExpiredExports,
    });
    
    registerJob({
      name: 'cleanup-old-audit-events',
      schedule: '0 3 * * 0', // Weekly on Sunday at 3 AM
      task: cleanupOldAuditEvents,
    });
    
    // Start scheduler
    startScheduler();
    
    logger.info('Worker started successfully');
  } catch (err) {
    logger.error({ err }, 'Failed to start worker');
    process.exit(1);
  }
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down worker...');
    stopScheduler();
    await closeConnection();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    logger.info('Shutting down worker...');
    stopScheduler();
    await closeConnection();
    process.exit(0);
  });
}

main();
