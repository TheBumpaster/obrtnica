export interface UserExportData {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
  memberships: Array<{
    orgId: string;
    orgName: string;
    roles: string[];
    joinedAt: string;
  }>;
  notificationPreferences: Array<{
    channel: string;
    enabled: boolean;
  }>;
  inAppNotifications: Array<{
    id: string;
    type: string;
    title: string;
    readAt: string | null;
    createdAt: string;
  }>;
  deviceTokens: {
    count: number;
    platforms: Array<{
      platform: string;
      registeredAt: string;
    }>;
  };
  createdContent: {
    sampleEntities: Array<{
      id: string;
      orgId: string;
      createdAt: string;
    }>;
  };
}

export interface ExportBuildParams {
  targetUserId: string;
  scopeOrgId?: string | null;
}

export interface ErasureParams {
  targetUserId: string;
  scopeOrgId?: string | null;
  mode: 'ANONYMIZE' | 'DELETE';
}

export interface GdprService {
  /**
   * Builds an export bundle for a user.
   * If scopeOrgId is provided, only includes data scoped to that org.
   *
   * @param params - Export parameters
   * @returns Promise containing the user's exportable data
   */
  buildExportBundle(params: ExportBuildParams): Promise<UserExportData>;

  /**
   * Anonymizes or deletes user data.
   * If scopeOrgId is provided, only affects data within that org.
   * Default mode is ANONYMIZE to preserve referential integrity.
   *
   * @param params - Erasure parameters
   * @returns Promise that resolves when erasure is complete
   */
  eraseUserData(params: ErasureParams): Promise<void>;
}

export interface GdprUserRecord {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GdprMembershipRecord {
  orgId: string;
  orgName: string | null;
  roles: string[];
  createdAt: Date;
}

export interface GdprNotificationPreferenceRecord {
  channel: string;
  enabled: boolean;
}

export interface GdprInAppNotificationRecord {
  id: string;
  type: string;
  title: string;
  readAt: Date | null;
  createdAt: Date;
}

export interface GdprDeviceTokenRecord {
  platform: string;
  createdAt: Date;
}

export interface GdprSampleEntityRecord {
  id: string;
  orgId: string;
  createdAt: Date;
}

export interface GdprRepository {
  getUserById(userId: string): Promise<GdprUserRecord | null>;
  listOrgMemberships(userId: string, scopeOrgId?: string | null): Promise<GdprMembershipRecord[]>;
  listNotificationPreferences(userId: string): Promise<GdprNotificationPreferenceRecord[]>;
  listInAppNotifications(userId: string, scopeOrgId?: string | null): Promise<GdprInAppNotificationRecord[]>;
  listDeviceTokens(userId: string, scopeOrgId?: string | null): Promise<GdprDeviceTokenRecord[]>;
  listSampleEntities(scopeOrgId?: string | null): Promise<GdprSampleEntityRecord[]>;
  anonymizeUser(userId: string): Promise<void>;
  deleteDeviceTokens(userId: string, scopeOrgId?: string | null): Promise<void>;
  softDeleteOrgMemberships(userId: string, scopeOrgId?: string | null): Promise<void>;
  softDeleteSampleEntities(scopeOrgId: string): Promise<void>;
  deleteInAppNotifications(userId: string, scopeOrgId?: string | null): Promise<void>;
}

export function createGdprService(repository: GdprRepository): GdprService {
  return {
    async buildExportBundle({ targetUserId, scopeOrgId = null }: ExportBuildParams): Promise<UserExportData> {
      const user = await repository.getUserById(targetUserId);

      if (!user) {
        throw new Error('User not found');
      }

      const [memberships, preferences, notifications, tokens, content] = await Promise.all([
        repository.listOrgMemberships(targetUserId, scopeOrgId),
        repository.listNotificationPreferences(targetUserId),
        repository.listInAppNotifications(targetUserId, scopeOrgId),
        repository.listDeviceTokens(targetUserId, scopeOrgId),
        repository.listSampleEntities(scopeOrgId),
      ]);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        memberships: memberships.map((membership) => ({
          orgId: membership.orgId,
          orgName: membership.orgName || 'Unknown',
          roles: membership.roles,
          joinedAt: membership.createdAt.toISOString(),
        })),
        notificationPreferences: preferences.map((pref) => ({
          channel: pref.channel,
          enabled: pref.enabled,
        })),
        inAppNotifications: notifications.map((notification) => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          readAt: notification.readAt ? notification.readAt.toISOString() : null,
          createdAt: notification.createdAt.toISOString(),
        })),
        deviceTokens: {
          count: tokens.length,
          platforms: tokens.map((token) => ({
            platform: token.platform,
            registeredAt: token.createdAt.toISOString(),
          })),
        },
        createdContent: {
          sampleEntities: content.map((entity) => ({
            id: entity.id,
            orgId: entity.orgId,
            createdAt: entity.createdAt.toISOString(),
          })),
        },
      };
    },

    async eraseUserData({ targetUserId, scopeOrgId = null, mode }: ErasureParams): Promise<void> {
      if (mode === 'DELETE') {
        throw new Error('DELETE mode not implemented - use ANONYMIZE');
      }

      await repository.anonymizeUser(targetUserId);
      await repository.deleteDeviceTokens(targetUserId, scopeOrgId);
      await repository.softDeleteOrgMemberships(targetUserId, scopeOrgId);

      if (scopeOrgId) {
        await repository.softDeleteSampleEntities(scopeOrgId);
      }

      await repository.deleteInAppNotifications(targetUserId, scopeOrgId);
    },
  };
}
