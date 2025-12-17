# Audit Logging Procedure

## Overview

This document describes the audit logging system implemented to support **SOC 2**, **ISO 27001**, **HIPAA**, and **GDPR** compliance requirements. The system provides an append-only, tamper-resistant audit trail for security-critical and compliance-relevant operations.

---

## 1. What is Logged (Baseline)

### Authentication & Session Events
- Login success/failure
- Logout
- MFA enrollment/verification/reset
- Password reset/credential changes
- Device token registration/removal

### Authorization & Access Events
- Permission denied (authorization failures)
- Role changes
- Membership changes
- Admin impersonation (if applicable)

### Data Access (Sensitive)
- Reads of **RESTRICTED** classified data
- Exports (GDPR data export requests)
- Deletes/anonymizations (GDPR erasure requests)

### Configuration & Security-Relevant Changes
- Organization settings changes
- Notification preferences changes
- API key creation/revocation
- Webhook configuration changes

### Data Write Operations
- Create/update/delete operations on tenant-scoped entities
- Currently implemented for: `SampleEntity`

---

## 2. Core Design Principles

### Append-Only
Audit events are **never updated or deleted**. Only inserts are allowed.

### Minimal but Useful
Audit logs store metadata and references (IDs) rather than full payload content to minimize storage and avoid accidentally logging sensitive data.

### Correlated
All audit events include:
- `requestId`: Unique identifier for the API request
- `correlationId`: Identifier that can span multiple requests/operations

### Tenant-Aware
Every audit event includes `tenantId` (or `orgId`) when applicable, ensuring proper multi-tenant data isolation.

### Actor-Aware
Audit events record who performed the action:
- **USER**: Authenticated user (includes `actorId` and optionally `actorDisplay`)
- **SERVICE**: Internal service/worker
- **SYSTEM**: System-initiated actions

### Data-Tagged
Each audit event includes data classification and categories from the [data classification schema](../../data-classification.md):
- `dataClassification`: PUBLIC | INTERNAL | CONFIDENTIAL | RESTRICTED
- `dataCategories`: Array of categories (IDENTITY, AUTH, TENANT, CONTENT, etc.)

---

## 3. Forbidden Metadata (Critical)

Audit logs **must never contain**:
- Passwords, password hashes
- Tokens (access, refresh, API keys, OTPs)
- Authorization headers
- Raw payment data
- Full request payloads
- PHI content (if HIPAA scope applies)

### Allowed Metadata Examples
```json
{
  "resourceId": "inv123",
  "permission": "billing:write",
  "count": 12,
  "provider": "mailjet",
  "messageId": "msg-abc123"
}
```

All metadata is automatically sanitized by the `sanitizeAuditMetadata()` function before being stored.

---

## 4. Data Model

### Postgres Table: `audit_events`

| Column | Type | Description |
|--------|------|-------------|
| `id` | varchar(26) | ULID primary key |
| `occurred_at` | timestamp | When the event occurred (UTC) |
| `event_type` | text | Event type (e.g., `security.permission.denied`) |
| `event_version` | integer | Schema version for event evolution |
| `severity` | text | INFO \| WARN \| ERROR |
| `tenant_id` | varchar(26) | Tenant/org identifier (nullable) |
| `actor_type` | text | USER \| SERVICE \| SYSTEM |
| `actor_id` | varchar(26) | Actor identifier (nullable) |
| `actor_display` | text | Human-readable actor name/email (nullable) |
| `ip` | text | Client IP address (nullable) |
| `user_agent` | text | Client user agent (nullable) |
| `request_id` | varchar(26) | Request identifier (nullable) |
| `correlation_id` | varchar(36) | Correlation identifier (nullable) |
| `resource_type` | text | Type of resource affected (nullable) |
| `resource_id` | varchar(26) | Resource identifier (nullable) |
| `action` | text | Action performed (nullable) |
| `status` | text | SUCCESS \| FAILURE |
| `reason` | text | Failure reason or additional context (nullable) |
| `data_classification` | text | Data classification level |
| `data_categories` | jsonb | Array of data categories |
| `metadata` | jsonb | Safe, sanitized metadata (nullable) |

### Indexes
- `(tenant_id, occurred_at DESC)` — tenant-scoped queries
- `(actor_id, occurred_at DESC)` — actor-scoped queries
- `(event_type, occurred_at DESC)` — event type filtering
- `(request_id)` — request tracing
- `(correlation_id)` — correlation tracing

---

## 5. Architecture & Flow

### API Request → Outbox → RabbitMQ → Worker → Postgres

```
1. API receives request
2. Business logic executes in transaction
3. Audit event written to outbox_events (same transaction)
4. Response returned to client
5. Worker polls outbox_events
6. Worker publishes to RabbitMQ (audit.event.*)
7. Audit consumer receives event
8. Audit consumer writes to audit_events (append-only)
9. Event marked as processed
```

This **transactional outbox pattern** ensures:
- Audit events are never lost (even if RabbitMQ is down)
- Core API requests don't block on audit writes
- Audit writes are eventually consistent with business operations

---

## 6. Correlation & Request Tracing

Every audit event can be traced back to:
1. **Request ID**: Unique per API request (ULID)
2. **Correlation ID**: Can span multiple requests (header `x-correlation-id` or generated ULID)

This enables:
- End-to-end request tracing (API → queue → worker)
- Debugging and incident investigation
- Linking related operations across services

---

## 7. Retention Policy

**Status: TBD** (To Be Determined)

**Proposed Default:**
- Retain audit events for **7 years** (aligned with common compliance requirements)
- Implement automated archival/deletion via scheduled worker job (future work)

**Compliance Notes:**
- **SOC 2 / ISO 27001**: Typically 1–3 years minimum
- **HIPAA**: 6 years minimum
- **GDPR**: No fixed requirement; must align with data retention policies and legal obligations

**Action Required:**
- Define retention period based on contractual and regulatory requirements
- Implement scheduled cleanup job (documented in `docs/infrastructure/runbook.md`)

---

## 8. Failure Modes & Resilience

### Postgres Down
- **Impact**: Core API and audit system both unavailable
- **Mitigation**: High availability Postgres setup (primary + replica)

### RabbitMQ Down
- **Impact**: Audit events queue in outbox_events; inserts continue
- **Recovery**: When RabbitMQ recovers, outbox dispatcher resumes publishing

### Worker/Consumer Down
- **Impact**: Audit events remain in RabbitMQ queue; not yet written to audit_events
- **Recovery**: When worker restarts, consumer processes queued events

### Key Point
Audit writes are **asynchronous but guaranteed** via the transactional outbox pattern. If any component fails, audit events are preserved and will be processed when the system recovers.

---

## 9. Event Taxonomy (Starter List)

| Event Type | Description |
|------------|-------------|
| `auth.login.success` | Successful user login |
| `auth.login.failure` | Failed login attempt |
| `auth.logout` | User logout |
| `auth.mfa.enroll` | MFA enrollment |
| `auth.mfa.verify.success` | Successful MFA verification |
| `auth.mfa.verify.failure` | Failed MFA verification |
| `auth.password.reset` | Password reset initiated |
| `auth.password.changed` | Password changed |
| `security.permission.denied` | Authorization failure |
| `tenant.member.role.changed` | Member role updated |
| `tenant.member.invited` | New member invited |
| `data.export.requested` | GDPR export requested |
| `data.export.completed` | GDPR export completed |
| `data.erase.requested` | GDPR erasure requested |
| `data.erase.completed` | GDPR erasure completed |
| `data.write.created` | Entity created |
| `data.write.updated` | Entity updated |
| `data.write.deleted` | Entity deleted |

All event types are versioned (`eventVersion`) to support schema evolution.

---

## 10. Compliance Mapping

### SOC 2 / ISO 27001
- **Requirement**: Audit trail for change accountability and incident investigations
- **How**: All security-relevant actions logged with actor, timestamp, and outcome

### HIPAA
- **Requirement**: Access logs for systems handling PHI, including who accessed what and when
- **How**: Audit events for RESTRICTED data access include actor, resource, and timestamp

### GDPR
- **Requirement**: Accountability principle; evidence of consent, exports, and erasures
- **How**: Audit events for:
  - Data export requests/completions
  - Data erasure requests/completions
  - Consent changes (when implemented)

---

## 11. Testing & Verification

Audit logging behavior is verified through:
- **Core unit tests**: Sanitizer removes forbidden keys (`packages/core/src/audit/*.test.ts`)
- **API integration tests**: Outbox events created for audit events
- **Worker integration tests**: Audit events written to `audit_events` table with tenant isolation
- **Success-path tests**: Normal operations emit audit events
- **Failure-path tests**: Permission denied events emitted on authorization failures

---

## 12. Related Documentation

- [Data Classification Schema](../../data-classification.md)
- [Domain Events](../../infrastructure/events.md)
- [Runbook](../../infrastructure/runbook.md)
- [GDPR Rights Procedure](./gdpr-rights-procedure.md) *(when implemented)*

---

## 13. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-12-17 | 1.0 | System | Initial audit logging implementation (Step 2) |
