import 'dotenv/config';

import { startAuditEventConsumer } from './consumers/audit-event-consumer';
import { startAuthEventsConsumer } from './consumers/auth-events-consumer';
import { startGdprEraseConsumer } from './consumers/gdpr-erase-consumer';
import { startGdprExportConsumer } from './consumers/gdpr-export-consumer';
import { runOutboxDispatcher } from './consumers/outbox-dispatcher';
import { startSampleEventConsumer } from './consumers/sample-event-consumer';
import { ensureMongoIndexes } from './mongo';
import { closeConnection, getChannel } from './queue/connection';
import { setupQueues } from './queue/setup';

async function main() {
  console.log('Starting worker...');
  
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
    
    // Start outbox dispatcher
    await runOutboxDispatcher();
    
    console.log('Worker started successfully');
  } catch (err) {
    console.error('Failed to start worker:', err);
    process.exit(1);
  }
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down worker...');
    await closeConnection();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('Shutting down worker...');
    await closeConnection();
    process.exit(0);
  });
}

main();
