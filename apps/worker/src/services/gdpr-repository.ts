import type {
  GdprRepository,
  GdprUserRecord,
  GdprMembershipRecord,
  GdprNotificationPreferenceRecord,
  GdprInAppNotificationRecord,
  GdprDeviceTokenRecord,
  GdprSampleEntityRecord,
} from '@serp/core';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import { and, eq, isNull } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';

import {
  deviceTokens,
  inAppNotifications,
  notificationPreferences,
  orgMemberships,
  orgs,
  sampleEntities,
  users,
} from '../db';
import type { Database } from '../db';
import type * as dbSchema from '../db/schema';

const EXPORT_RECORD_LIMIT = 1000;

type DrizzleExecutor =
  | Database
  | PgTransaction<PostgresJsQueryResultHKT, typeof dbSchema, ExtractTablesWithRelations<typeof dbSchema>>;

export class DrizzleGdprRepository implements GdprRepository {
  constructor(private readonly db: DrizzleExecutor) {}

  async getUserById(userId: string): Promise<GdprUserRecord | null> {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user ?? null;
  }

  async listOrgMemberships(userId: string, scopeOrgId?: string | null): Promise<GdprMembershipRecord[]> {
    const whereClause = scopeOrgId
      ? and(eq(orgMemberships.userId, userId), eq(orgMemberships.orgId, scopeOrgId), isNull(orgMemberships.deletedAt))
      : and(eq(orgMemberships.userId, userId), isNull(orgMemberships.deletedAt));

    return await this.db
      .select({
        orgId: orgMemberships.orgId,
        orgName: orgs.name,
        roles: orgMemberships.roles,
        createdAt: orgMemberships.createdAt,
      })
      .from(orgMemberships)
      .leftJoin(orgs, eq(orgs.id, orgMemberships.orgId))
      .where(whereClause);
  }

  async listNotificationPreferences(userId: string): Promise<GdprNotificationPreferenceRecord[]> {
    return await this.db
      .select({
        channel: notificationPreferences.channel,
        enabled: notificationPreferences.enabled,
      })
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
  }

  async listInAppNotifications(
    userId: string,
    scopeOrgId?: string | null
  ): Promise<GdprInAppNotificationRecord[]> {
    const whereClause = scopeOrgId
      ? and(eq(inAppNotifications.recipientId, userId), eq(inAppNotifications.orgId, scopeOrgId))
      : eq(inAppNotifications.recipientId, userId);

    return await this.db
      .select({
        id: inAppNotifications.id,
        type: inAppNotifications.type,
        title: inAppNotifications.title,
        readAt: inAppNotifications.readAt,
        createdAt: inAppNotifications.createdAt,
      })
      .from(inAppNotifications)
      .where(whereClause)
      .limit(EXPORT_RECORD_LIMIT);
  }

  async listDeviceTokens(userId: string, scopeOrgId?: string | null): Promise<GdprDeviceTokenRecord[]> {
    const whereClause = scopeOrgId
      ? and(eq(deviceTokens.userId, userId), eq(deviceTokens.orgId, scopeOrgId))
      : eq(deviceTokens.userId, userId);

    return await this.db
      .select({
        platform: deviceTokens.platform,
        createdAt: deviceTokens.createdAt,
      })
      .from(deviceTokens)
      .where(whereClause);
  }

  async listSampleEntities(scopeOrgId?: string | null): Promise<GdprSampleEntityRecord[]> {
    const whereClause = scopeOrgId
      ? and(eq(sampleEntities.orgId, scopeOrgId), isNull(sampleEntities.deletedAt))
      : isNull(sampleEntities.deletedAt);

    return await this.db
      .select({
        id: sampleEntities.id,
        orgId: sampleEntities.orgId,
        createdAt: sampleEntities.createdAt,
      })
      .from(sampleEntities)
      .where(whereClause)
      .limit(EXPORT_RECORD_LIMIT);
  }

  async anonymizeUser(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({
        email: `anon+${userId}@example.invalid`,
        name: 'Anonymous',
        anonymizedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async deleteDeviceTokens(userId: string, scopeOrgId?: string | null): Promise<void> {
    const whereClause = scopeOrgId
      ? and(eq(deviceTokens.userId, userId), eq(deviceTokens.orgId, scopeOrgId))
      : eq(deviceTokens.userId, userId);

    await this.db.delete(deviceTokens).where(whereClause);
  }

  async softDeleteOrgMemberships(userId: string, scopeOrgId?: string | null): Promise<void> {
    const whereClause = scopeOrgId
      ? and(eq(orgMemberships.userId, userId), eq(orgMemberships.orgId, scopeOrgId), isNull(orgMemberships.deletedAt))
      : and(eq(orgMemberships.userId, userId), isNull(orgMemberships.deletedAt));

    await this.db.update(orgMemberships).set({ deletedAt: new Date() }).where(whereClause);
  }

  async softDeleteSampleEntities(scopeOrgId: string): Promise<void> {
    await this.db
      .update(sampleEntities)
      .set({ deletedAt: new Date() })
      .where(and(eq(sampleEntities.orgId, scopeOrgId), isNull(sampleEntities.deletedAt)));
  }

  async deleteInAppNotifications(userId: string, scopeOrgId?: string | null): Promise<void> {
    const whereClause = scopeOrgId
      ? and(eq(inAppNotifications.recipientId, userId), eq(inAppNotifications.orgId, scopeOrgId))
      : eq(inAppNotifications.recipientId, userId);

    await this.db.delete(inAppNotifications).where(whereClause);
  }
}
