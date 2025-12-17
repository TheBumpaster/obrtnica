import { createChildLogger } from '@serp/core';
import fetch from 'node-fetch';

import { config } from '../config';

const logger = createChildLogger({ component: 'fcm-adapter' });

export interface FcmPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class FcmAdapter {
  private serverKey: string | null;
  private dryRun: boolean;

  constructor(dryRun = false) {
    this.dryRun = dryRun;
    this.serverKey = config.FCM_SERVER_KEY || null;
  }

  async sendPush(payload: FcmPayload): Promise<{ success: boolean; invalidToken?: boolean }> {
    if (this.dryRun || !this.serverKey) {
      logger.debug({ tokenPrefix: payload.token.substring(0, 20), title: payload.title }, '[DRY RUN] Would send FCM push');
      return { success: true };
    }

    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${this.serverKey}`,
        },
        body: JSON.stringify({
          to: payload.token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data,
        }),
      });

      const result = await response.json() as { success: number; failure: number; results?: Array<{ error?: string }> };
      
      if (result.failure > 0 && result.results && result.results[0]?.error) {
        const error = result.results[0].error;
        if (error === 'InvalidRegistration' || error === 'NotRegistered') {
          logger.warn({ tokenPrefix: payload.token.substring(0, 20) }, 'Invalid FCM token');
          return { success: false, invalidToken: true };
        }
      }
      
      logger.debug({ tokenPrefix: payload.token.substring(0, 20) }, 'Sent FCM push');
      return { success: result.success > 0 };
    } catch (err) {
      logger.error({ err }, 'FCM send error');
      throw err;
    }
  }
}
