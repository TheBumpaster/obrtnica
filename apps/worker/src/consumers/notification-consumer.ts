import { EventTypes, createChildLogger, type NotificationDelivery } from '@serp/core';
import type amqp from 'amqplib';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';

import { db, inAppNotifications, notificationPreferences, processedEvents } from '../db';
import { QUEUES } from '../queue/setup';
import { NotificationService } from '../services/notification-service';

const logger = createChildLogger({ component: 'notification-consumer' });
const notificationService = new NotificationService();

export async function startNotificationConsumer(channel: amqp.Channel): Promise<void> {
  logger.info('Starting notification consumer...');

  await channel.consume(QUEUES.NOTIFICATIONS, async (msg) => {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString());

      // Idempotency check
      const existing = await db
        .select()
        .from(processedEvents)
        .where(eq(processedEvents.eventId, event.eventId))
        .limit(1);

      if (existing.length > 0) {
        logger.debug({ eventId: event.eventId }, 'Event already processed, skipping');
        channel.ack(msg);
        return;
      }

      // Process notification event
      if (event.eventType === EventTypes.NOTIFICATION_REQUESTED) {
        await handleNotificationRequested(event);
      }

      // Mark as processed
      await db.insert(processedEvents).values({
        id: ulid(),
        eventId: event.eventId,
        consumerName: 'notification-consumer',
      });

      channel.ack(msg);
      logger.info({ eventId: event.eventId, eventType: event.eventType }, 'Processed notification event');
    } catch (err) {
      logger.error({ err }, 'Error processing notification event');
      // Reject and requeue (will go to DLQ after TTL)
      channel.nack(msg, false, false);
    }
  });

  logger.info({ queue: QUEUES.NOTIFICATIONS }, 'Notification consumer started');
}

async function handleNotificationRequested(event: {
  eventId: string;
  payload: unknown;
  tenantId: string;
  correlationId?: string;
}): Promise<void> {
  const payload = event.payload as {
    notificationId: string;
    recipientId: string;
    orgId: string;
    channels: Array<'email' | 'sms' | 'push' | 'in_app'>;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
  };

  logger.info(
    { notificationId: payload.notificationId, recipientId: payload.recipientId, channels: payload.channels },
    'Processing notification request'
  );

  // Check user preferences
  const preferences = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, payload.recipientId));

  const emailEnabled = preferences.find((p) => p.channel === 'email')?.enabled ?? true;
  const smsEnabled = preferences.find((p) => p.channel === 'sms')?.enabled ?? true;
  const pushEnabled = preferences.find((p) => p.channel === 'push')?.enabled ?? true;

  // Create in-app notification first
  if (payload.channels.includes('in_app')) {
    await db.insert(inAppNotifications).values({
      id: payload.notificationId,
      orgId: payload.orgId,
      recipientId: payload.recipientId,
      type: payload.metadata?.type as string || 'general',
      title: payload.title,
      body: payload.body,
      metadata: payload.metadata || null,
      deliveryStatusMetadata: {},
    });
  }

  // Send via requested channels (respecting preferences)
  const deliveryStatusMetadata: {
    email?: { sentAt: Date; providerId?: string; bounced?: boolean };
    sms?: { sentAt: Date; providerId?: string; failed?: boolean };
    push?: { sentAt: Date; delivered?: boolean; failed?: boolean };
  } = {};

  // Email
  if (payload.channels.includes('email') && emailEnabled) {
    try {
      const delivery: NotificationDelivery = {
        channel: 'email',
        recipientId: payload.recipientId,
        payload: {
          email: payload.metadata?.email as string,
          subject: payload.title,
          body: payload.body,
          htmlBody: payload.metadata?.htmlBody as string,
        },
      };
      await notificationService.sendEmail(delivery);
      deliveryStatusMetadata.email = { sentAt: new Date() };
    } catch (err) {
      logger.error({ err }, 'Failed to send email notification');
      deliveryStatusMetadata.email = { sentAt: new Date(), bounced: true };
    }
  }

  // SMS
  if (payload.channels.includes('sms') && smsEnabled) {
    try {
      const delivery: NotificationDelivery = {
        channel: 'sms',
        recipientId: payload.recipientId,
        payload: {
          phone: payload.metadata?.phone as string,
          body: payload.body,
        },
      };
      await notificationService.sendSms(delivery);
      deliveryStatusMetadata.sms = { sentAt: new Date() };
    } catch (err) {
      logger.error({ err }, 'Failed to send SMS notification');
      deliveryStatusMetadata.sms = { sentAt: new Date(), failed: true };
    }
  }

  // Push
  if (payload.channels.includes('push') && pushEnabled) {
    try {
      const delivery: NotificationDelivery = {
        channel: 'push',
        recipientId: payload.recipientId,
        payload: {
          title: payload.title,
          body: payload.body,
          data: payload.metadata?.data as Record<string, unknown>,
        },
      };
      await notificationService.sendPush(delivery);
      deliveryStatusMetadata.push = { sentAt: new Date(), delivered: true };
    } catch (err) {
      logger.error({ err }, 'Failed to send push notification');
      deliveryStatusMetadata.push = { sentAt: new Date(), failed: true };
    }
  }

  // Update in-app notification with delivery status
  if (payload.channels.includes('in_app')) {
    await db
      .update(inAppNotifications)
      .set({ deliveryStatusMetadata })
      .where(eq(inAppNotifications.id, payload.notificationId));
  }

  logger.info({ notificationId: payload.notificationId }, 'Notification delivery completed');
}
