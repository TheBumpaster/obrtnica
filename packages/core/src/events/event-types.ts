export const EventTypes = {
  SAMPLE_EVENT_CREATED: 'sample.event.created',
  NOTIFICATION_REQUESTED: 'notification.requested',
  AUDIT_EVENT_CREATED: 'audit.event.created',
  GDPR_EXPORT_REQUESTED: 'gdpr.export.requested',
  GDPR_ERASE_REQUESTED: 'gdpr.erase.requested',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];
