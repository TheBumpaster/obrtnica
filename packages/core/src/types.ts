export interface DomainEvent {
  eventId: string;
  eventType: string;
  eventVersion: string;
  occurredAt: Date;
  tenantId: string;
  correlationId?: string;
  payload: Record<string, unknown>;
}

export interface NotificationDelivery {
  channel: 'email' | 'sms' | 'push';
  recipientId: string;
  payload: Record<string, unknown>;
}

export interface EventEmitter {
  emit(event: DomainEvent): Promise<void>;
}

// Data Classification Schema (Step 1)
// See docs/data-classification.md for complete details

export const DataClassifications = {
  PUBLIC: 'PUBLIC',
  INTERNAL: 'INTERNAL',
  CONFIDENTIAL: 'CONFIDENTIAL',
  RESTRICTED: 'RESTRICTED',
} as const;

export type DataClassification =
  (typeof DataClassifications)[keyof typeof DataClassifications];

export const DataCategories = {
  IDENTITY: 'IDENTITY',
  AUTH: 'AUTH',
  TENANT: 'TENANT',
  CONTENT: 'CONTENT',
  FINANCIAL: 'FINANCIAL',
  HEALTH_PHI: 'HEALTH_PHI',
  ANALYTICS: 'ANALYTICS',
  AUDIT: 'AUDIT',
  INTEGRATIONS: 'INTEGRATIONS',
} as const;

export type DataCategory =
  (typeof DataCategories)[keyof typeof DataCategories];

export interface DataTag {
  classification: DataClassification;
  categories: DataCategory[];
}
