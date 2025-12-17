import { z } from 'zod';

export const notificationTypeSchema = z.enum([
  'info',
  'warning',
  'error',
  'success',
]);

export const notificationChannelSchema = z.enum([
  'in_app',
  'email',
  'sms',
  'push',
]);

export const createNotificationSchema = z.object({
  recipientId: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  channels: z.array(notificationChannelSchema),
  metadata: z.record(z.unknown()).optional(),
});

export const notificationPreferenceSchema = z.object({
  userId: z.string(),
  channel: notificationChannelSchema,
  enabled: z.boolean(),
});

export const deviceTokenSchema = z.object({
  userId: z.string(),
  token: z.string(),
  platform: z.enum(['ios', 'android', 'web']),
});
