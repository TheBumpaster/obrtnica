import fetch from 'node-fetch';

import { config } from '../config';

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
      console.log('[DRY RUN] Would send FCM push:', {
        token: payload.token.substring(0, 20) + '...',
        title: payload.title,
      });
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
          console.log(`Invalid FCM token: ${payload.token}`);
          return { success: false, invalidToken: true };
        }
      }
      
      console.log(`Sent FCM push to token ${payload.token.substring(0, 20)}...`);
      return { success: result.success > 0 };
    } catch (err) {
      console.error('FCM send error:', err);
      throw err;
    }
  }
}
