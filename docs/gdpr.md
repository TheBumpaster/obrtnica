# GDPR Data Rights Workflows

## Overview

This system implements GDPR-required data rights capabilities:
- **Right of Access** (data export)
- **Right to Rectification** (user profile updates)
- **Right to Erasure** (delete/anonymize)
- **Right to Data Portability** (machine-readable export)

All workflows are **vendor-neutral**, **auditable**, and compatible with our stack (Postgres as source of truth, MongoDB for derived projections, RabbitMQ for async workers).

## Core Principles

- **Core app never breaks** if MongoDB projections are missing
- **Everything is tracked** in `audit_events`
- **Async processing** via RabbitMQ workers for large jobs
- **Org-scoped** admin actions for multi-tenant compliance

## Data Subject Definition

A "data subject" is a **user account**. In our multi-tenant system:
- Users can belong to multiple organizations via `org_memberships`
- Export/erasure can be **self-service** (user requests their own data) or **admin-on-behalf** (org admin requests for a user within their org)

## Export Workflow (Access + Portability)

### API Endpoint

`gdpr.requestExport(input)`

**Input:**
- `targetUserId` (optional): defaults to self
- `scopeOrgId` (optional): for admin-on-behalf, specifies which org's data to include

**Authorization:**
- Self: any authenticated user can export their own data
- Admin-on-behalf: requires `admin` role in `scopeOrgId` membership

**What happens:**
1. Creates `gdpr_requests` record with status `PENDING`
2. Emits audit event: `data.export.requested`
3. Enqueues domain event: `gdpr.export.requested` via outbox

### Worker Processing

Worker consumes `gdpr.export.requested`:

1. Updates request status to `PROCESSING`
2. Loads user data from Postgres:
   - User profile (excludes `passwordHash`)
   - Org memberships (filtered by `scopeOrgId` if provided)
   - Notification preferences
   - In-app notifications (minimized: id, type, title, readAt, createdAt)
   - Device tokens (count + platform metadata, **no token values**)
   - Created content (`sample_entities`, filtered by org if scoped)
3. Builds JSON export bundle
4. Stores via `StorageAdapter` (local filesystem in dev, S3-compatible in prod)
5. Updates request to `COMPLETED` with:
   - `result_location`
   - `checksum` (SHA-256)
   - `expires_at` (30 days from creation)
6. Emits audit event: `data.export.completed`

**On failure:**
- Updates request to `FAILED` with `failure_reason`
- Emits audit event: `data.export.failed`

### Download

`gdpr.downloadExport(requestId)`

**Authorization:**
- Requester or target user can download

Returns export location + checksum. In production with real auth, this would use signed URLs or stream the file directly.

## Erasure Workflow (Delete / Anonymize)

### API Endpoint

`gdpr.requestErasure(input)`

**Input:**
- `targetUserId` (optional): defaults to self
- `scopeOrgId` (optional): for admin-on-behalf, specifies which org's data to affect
- `mode` (default: `ANONYMIZE`): `ANONYMIZE` or `DELETE`

**Authorization:** same as export

**What happens:**
1. Creates `gdpr_requests` record with status `PENDING`
2. Emits audit event: `data.erase.requested`
3. Enqueues domain event: `gdpr.erase.requested` via outbox

### Worker Processing

Worker consumes `gdpr.erase.requested`:

1. Updates request status to `PROCESSING`
2. Performs erasure in Postgres transaction:

**ANONYMIZE mode (default):**
- Replace `email` → `anon+<userId>@example.invalid`
- Replace `name` → `Anonymous`
- Set `anonymized_at` timestamp
- Delete device tokens (scoped by org if provided)
- Soft-delete org memberships (`deleted_at`, scoped if provided)
- Soft-delete created content (`sample_entities`, scoped if provided)
- Delete in-app notifications (scoped if provided)

**DELETE mode:**
- Not implemented in v1.0.0 (throws error)
- Use ANONYMIZE to preserve referential integrity

3. Best-effort: cleanup MongoDB projections
   - Deletes sample projections (scoped by org if provided)
   - **Non-fatal**: if Mongo is down, erasure still completes

4. Updates request to `COMPLETED`
5. Emits audit event: `data.erase.completed`

**On failure:**
- Updates request to `FAILED` with `failure_reason`
- Emits audit event: `data.erase.failed`

## Data Inventory Map

### Postgres Tables

| Table | Export | Erasure Behavior |
|-------|--------|------------------|
| `users` | Name, email (no `passwordHash`) | Anonymize email/name, set `anonymized_at` |
| `org_memberships` | Org IDs, roles, join dates | Soft-delete (`deleted_at`) |
| `notification_preferences` | Channel, enabled | Included in export, kept on anonymize |
| `in_app_notifications` | ID, type, title, readAt, createdAt | Deleted |
| `device_tokens` | Count + platform (no token values) | Deleted |
| `sample_entities` | ID, org ID, createdAt | Soft-delete if org-scoped |
| `audit_events` | **Not included in export** | **Never deleted** (compliance requirement); optionally anonymize `actor_display` |

### MongoDB (Derived)

- `sample_projections`: deleted or rebuilt after erasure (best-effort)
- If MongoDB is unavailable, erasure still completes

### External Providers

- **FCM/APNs**: device tokens deleted locally; cannot be deleted from Apple/Google
- **Mailjet/Twilio**: message IDs retained for audit; no sensitive content stored

## Retention

- **Export bundles**: expire 30 days after creation (`expires_at`)
- **Audit events**: retained per compliance policy (1–7 years, TBD)
- **Anonymized users**: `anonymized_at` timestamp allows compliance queries without reversing anonymization

## Failure Modes

| System | Down | Impact |
|--------|------|--------|
| Postgres | Down | Core app fails (expected; Postgres is authoritative) |
| MongoDB | Down | Export/erasure: projection cleanup skipped (non-fatal); dashboards degraded |
| RabbitMQ | Down | Export/erasure: requests remain `PENDING`; worker resumes when RabbitMQ returns |
| Worker | Down | Same as RabbitMQ down; outbox accumulates events |
| StorageAdapter | Fails | Export marked `FAILED` with reason; user can retry |

## Admin-on-Behalf Scope (Multi-Org)

- Admin can only export/erase data **within their org** (`scopeOrgId` must match admin's org membership)
- **Global user data** (user profile, other org memberships) is **not included** in admin-on-behalf actions
- Self-service export/erasure affects **all** user data across all orgs

## Rectification (Correction)

User profile updates (name, email) are standard tRPC procedures, not GDPR-specific.

Audit events emitted:
- `identity.profile.updated`
- `tenant.member.updated`

## Compliance Mapping

| Requirement | Implementation |
|-------------|----------------|
| GDPR Article 15 (Access) | `gdpr.requestExport` → JSON bundle |
| GDPR Article 16 (Rectification) | Standard profile update procedures |
| GDPR Article 17 (Erasure) | `gdpr.requestErasure` → anonymize |
| GDPR Article 20 (Portability) | JSON export with structured data |
| GDPR Article 5 (Accountability) | Audit events for all GDPR actions |

## Testing

See `apps/api/src/router/gdpr.test.ts` and `apps/worker/src/consumers/gdpr-*.test.ts` for test coverage.

## Future Enhancements

- Automated export expiry cleanup (worker job)
- DELETE mode implementation (requires cascading delete strategy)
- S3-compatible storage adapter for production
- Signed URL generation for secure downloads
