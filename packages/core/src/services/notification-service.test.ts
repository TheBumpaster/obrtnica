import { describe, it, expect } from 'vitest';

import type { NotificationService } from './notification-service';

describe('NotificationService interface', () => {
  it('should define expected methods', () => {
    const mockService: NotificationService = {
      sendEmail: async () => {},
      sendSms: async () => {},
      sendPush: async () => {},
      createInAppNotification: async () => {},
    };

    expect(mockService.sendEmail).toBeDefined();
    expect(mockService.sendSms).toBeDefined();
    expect(mockService.sendPush).toBeDefined();
    expect(mockService.createInAppNotification).toBeDefined();
  });
});
