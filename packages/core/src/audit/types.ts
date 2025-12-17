import type { DataTag } from '../types';

export const AuditEventTypes = {
  // Authentication & session
  AUTH_LOGIN_SUCCESS: 'auth.login.success',
  AUTH_LOGIN_FAILURE: 'auth.login.failure',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_MFA_ENROLL: 'auth.mfa.enroll',
  AUTH_MFA_VERIFY_SUCCESS: 'auth.mfa.verify.success',
  AUTH_MFA_VERIFY_FAILURE: 'auth.mfa.verify.failure',
  AUTH_MFA_RESET: 'auth.mfa.reset',
  AUTH_PASSWORD_RESET: 'auth.password.reset',
  AUTH_PASSWORD_CHANGED: 'auth.password.changed',
  AUTH_DEVICE_REGISTERED: 'auth.device.registered',
  AUTH_DEVICE_REMOVED: 'auth.device.removed',

  // Authorization & access
  SECURITY_PERMISSION_DENIED: 'security.permission.denied',
  TENANT_MEMBER_ROLE_CHANGED: 'tenant.member.role.changed',
  TENANT_MEMBER_INVITED: 'tenant.member.invited',
  TENANT_MEMBER_REMOVED: 'tenant.member.removed',
  SECURITY_IMPERSONATION_STARTED: 'security.impersonation.started',
  SECURITY_IMPERSONATION_ENDED: 'security.impersonation.ended',

  // Data access (sensitive)
  DATA_EXPORT_REQUESTED: 'data.export.requested',
  DATA_EXPORT_COMPLETED: 'data.export.completed',
  DATA_EXPORT_FAILED: 'data.export.failed',
  DATA_ERASE_REQUESTED: 'data.erase.requested',
  DATA_ERASE_COMPLETED: 'data.erase.completed',
  DATA_ERASE_FAILED: 'data.erase.failed',
  DATA_READ_RESTRICTED: 'data.read.restricted',

  // Configuration & security relevant changes
  ORG_SETTINGS_CHANGED: 'org.settings.changed',
  NOTIFICATION_PREFERENCES_CHANGED: 'notification.preferences.changed',
  API_KEY_CREATED: 'api.key.created',
  API_KEY_REVOKED: 'api.key.revoked',
  WEBHOOK_CONFIGURED: 'webhook.configured',
  WEBHOOK_REMOVED: 'webhook.removed',

  // Data write operations (pilot)
  DATA_WRITE_CREATED: 'data.write.created',
  DATA_WRITE_UPDATED: 'data.write.updated',
  DATA_WRITE_DELETED: 'data.write.deleted',
} as const;

export type AuditEventType = (typeof AuditEventTypes)[keyof typeof AuditEventTypes];

export const AuditSeverity = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;

export type AuditSeverityType = (typeof AuditSeverity)[keyof typeof AuditSeverity];

export const AuditStatus = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
} as const;

export type AuditStatusType = (typeof AuditStatus)[keyof typeof AuditStatus];

export const ActorType = {
  USER: 'USER',
  SERVICE: 'SERVICE',
  SYSTEM: 'SYSTEM',
} as const;

export type ActorTypeValue = (typeof ActorType)[keyof typeof ActorType];

export interface AuditActor {
  type: ActorTypeValue;
  id?: string;
  display?: string;
}

export interface AuditEvent {
  id: string;
  occurredAt: Date;
  eventType: AuditEventType;
  eventVersion: number;
  severity: AuditSeverityType;
  tenantId?: string;
  actor: AuditActor;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  correlationId?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  status: AuditStatusType;
  reason?: string;
  dataTag: DataTag;
  metadata?: Record<string, unknown>;
}
