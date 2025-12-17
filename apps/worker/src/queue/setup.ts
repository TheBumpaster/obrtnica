import type amqp from 'amqplib';

export const EXCHANGES = {
  DOMAIN_EVENTS: 'domain.events',
} as const;

export const QUEUES = {
  SAMPLE_EVENTS: 'sample.events',
  SAMPLE_EVENTS_DLQ: 'sample.events.dlq',
  AUDIT_EVENTS: 'audit.events',
  AUDIT_EVENTS_DLQ: 'audit.events.dlq',
  GDPR_EXPORT: 'gdpr.export',
  GDPR_EXPORT_DLQ: 'gdpr.export.dlq',
  GDPR_ERASE: 'gdpr.erase',
  GDPR_ERASE_DLQ: 'gdpr.erase.dlq',
  AUTH_EVENTS: 'auth.events',
  AUTH_EVENTS_DLQ: 'auth.events.dlq',
} as const;

export async function setupQueues(channel: amqp.Channel): Promise<void> {
  // Create exchange
  await channel.assertExchange(EXCHANGES.DOMAIN_EVENTS, 'topic', { durable: true });

  // Create sample events queue with DLQ
  await channel.assertQueue(QUEUES.SAMPLE_EVENTS_DLQ, { durable: true });
  
  await channel.assertQueue(QUEUES.SAMPLE_EVENTS, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': '',
      'x-dead-letter-routing-key': QUEUES.SAMPLE_EVENTS_DLQ,
      'x-message-ttl': 60000, // 60 seconds before going to DLQ
    },
  });

  // Bind sample events queue to exchange
  await channel.bindQueue(QUEUES.SAMPLE_EVENTS, EXCHANGES.DOMAIN_EVENTS, 'sample.event.*');

  // Create audit events queue with DLQ
  await channel.assertQueue(QUEUES.AUDIT_EVENTS_DLQ, { durable: true });
  
  await channel.assertQueue(QUEUES.AUDIT_EVENTS, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': '',
      'x-dead-letter-routing-key': QUEUES.AUDIT_EVENTS_DLQ,
      'x-message-ttl': 60000, // 60 seconds before going to DLQ
    },
  });

  // Bind audit events queue to exchange
  await channel.bindQueue(QUEUES.AUDIT_EVENTS, EXCHANGES.DOMAIN_EVENTS, 'audit.event.*');

  // Create GDPR export queue with DLQ
  await channel.assertQueue(QUEUES.GDPR_EXPORT_DLQ, { durable: true });
  
  await channel.assertQueue(QUEUES.GDPR_EXPORT, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': '',
      'x-dead-letter-routing-key': QUEUES.GDPR_EXPORT_DLQ,
      'x-message-ttl': 60000,
    },
  });

  await channel.bindQueue(QUEUES.GDPR_EXPORT, EXCHANGES.DOMAIN_EVENTS, 'gdpr.export.*');

  // Create GDPR erase queue with DLQ
  await channel.assertQueue(QUEUES.GDPR_ERASE_DLQ, { durable: true });
  
  await channel.assertQueue(QUEUES.GDPR_ERASE, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': '',
      'x-dead-letter-routing-key': QUEUES.GDPR_ERASE_DLQ,
      'x-message-ttl': 60000,
    },
  });

  await channel.bindQueue(QUEUES.GDPR_ERASE, EXCHANGES.DOMAIN_EVENTS, 'gdpr.erase.*');

  // Create auth events queue with DLQ
  await channel.assertQueue(QUEUES.AUTH_EVENTS_DLQ, { durable: true });

  await channel.assertQueue(QUEUES.AUTH_EVENTS, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': '',
      'x-dead-letter-routing-key': QUEUES.AUTH_EVENTS_DLQ,
      'x-message-ttl': 60000,
    },
  });

  // Bind auth events queue to exchange (email verification, password reset, magic link, OTP)
  await channel.bindQueue(QUEUES.AUTH_EVENTS, EXCHANGES.DOMAIN_EVENTS, 'auth.email_verification.*');
  await channel.bindQueue(QUEUES.AUTH_EVENTS, EXCHANGES.DOMAIN_EVENTS, 'auth.password_reset.*');
  await channel.bindQueue(QUEUES.AUTH_EVENTS, EXCHANGES.DOMAIN_EVENTS, 'auth.magic_link.*');
  await channel.bindQueue(QUEUES.AUTH_EVENTS, EXCHANGES.DOMAIN_EVENTS, 'auth.otp.*');

  console.log('Queues and exchanges setup complete');
}
