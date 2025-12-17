import type { NotificationDelivery } from '../types';

export interface NotificationService {
  sendEmail(delivery: NotificationDelivery): Promise<void>;
  sendSms(delivery: NotificationDelivery): Promise<void>;
  sendPush(delivery: NotificationDelivery): Promise<void>;
  createInAppNotification(
    recipientId: string,
    payload: Record<string, unknown>
  ): Promise<void>;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
}

export interface NotificationServiceConfig {
  dryRun: boolean;
}
