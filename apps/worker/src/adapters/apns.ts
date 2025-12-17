import fs from 'fs';

import { Notification, Provider } from 'apn';

import { config } from '../config';

export interface ApnsPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export class ApnsAdapter {
  private provider: Provider | null = null;
  private dryRun: boolean;
  private bundleId: string;

  constructor(dryRun = false) {
    this.dryRun = dryRun;
    this.bundleId = config.APNS_BUNDLE_ID || 'com.serp.app';
    
    if (!dryRun && config.APNS_KEY_ID && config.APNS_TEAM_ID && config.APNS_PRIVATE_KEY_PATH) {
      try {
        const token = {
          key: fs.readFileSync(config.APNS_PRIVATE_KEY_PATH),
          keyId: config.APNS_KEY_ID,
          teamId: config.APNS_TEAM_ID,
        };
        
        this.provider = new Provider({
          token,
          production: config.APNS_PRODUCTION === 'true',
        });
      } catch (err) {
        console.warn('Failed to initialize APNs provider:', err);
      }
    }
  }

  async sendPush(payload: ApnsPayload): Promise<{ success: boolean; invalidToken?: boolean }> {
    if (this.dryRun || !this.provider) {
      console.log('[DRY RUN] Would send APNs push:', {
        token: payload.token.substring(0, 20) + '...',
        title: payload.title,
      });
      return { success: true };
    }

    try {
      const notification = new Notification();
      notification.alert = {
        title: payload.title,
        body: payload.body,
      };
      notification.topic = this.bundleId;
      notification.payload = payload.data || {};
      
      const result = await this.provider.send(notification, payload.token);
      
      if (result.failed.length > 0) {
        const failure = result.failed[0];
        if (failure.status === '410' || failure.response?.reason === 'BadDeviceToken') {
          console.log(`Invalid APNs token: ${payload.token}`);
          return { success: false, invalidToken: true };
        }
        throw new Error(`APNs send failed: ${failure.response?.reason || 'unknown'}`);
      }
      
      console.log(`Sent APNs push to token ${payload.token.substring(0, 20)}...`);
      return { success: true };
    } catch (err) {
      console.error('APNs send error:', err);
      throw err;
    }
  }

  async shutdown(): Promise<void> {
    if (this.provider) {
      this.provider.shutdown();
    }
  }
}
