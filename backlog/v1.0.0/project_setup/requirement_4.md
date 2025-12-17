## Step 3 — GDPR Data Rights Workflows

Goal: implement GDPR-required capabilities in a way that’s **vendor-neutral**, **auditable**, and compatible with your stack (Postgres as source of truth, Mongo projections as derived, RabbitMQ workers, notifications). This step covers:

* **Right of Access** (data export)
* **Right to Rectification** (correction)
* **Right to Erasure** (delete/anonymize)
* **Right to Data Portability** (machine-readable export)

We’ll design it so **core app never breaks** if Mongo projections are missing, and everything is **tracked in audit_events** (Step 2).

---

# 3.1 Scope & Definitions (important upfront)

### Data subject

A “data subject” is typically a **user account**. In multi-tenant SaaS, you also need to consider:

* Users belonging to multiple orgs
* Org-level data tied to a user (membership, created content)

### GDPR Roles

Your system may act as:

* **Controller** for your own product accounts
* **Processor** for customer org data (common in B2B)
  This affects retention and deletion behavior, but the technical workflows are still needed.

---

# 3.2 System Requirements

## A) Data Export (Access + Portability)

### Must provide

* export of user personal data in a structured, commonly used format (JSON is acceptable; optionally CSV for some datasets)
* include references to:

  * profile data
  * memberships & permissions
  * notifications history (in-app)
  * created content (if it contains personal data)
* exclude secrets (password hashes, tokens), and avoid exposing other users’ data

### Constraints

* Large exports must be async (worker job)
* Export must be auditable:

  * `data.export.requested`
  * `data.export.completed`
  * `data.export.failed`
* Access control:

  * User can export their own data
  * Admin can export on behalf only if authorized and logged

## B) Rectification (Correction)

Mostly a product-level feature:

* user can update personal fields (name, email, etc.)
* admin can correct if authorized
* changes must be audited where sensitive:

  * `identity.profile.updated`
  * `tenant.member.updated` etc.

## C) Erasure (Delete / Anonymize)

### Must support

* deleting or anonymizing personal data where legally allowed
* preserving required records where legally required (accounting, audit)
* where deletion isn’t possible: **anonymize**

### Must be auditable:

* `data.erase.requested`
* `data.erase.completed`
* `data.erase.failed`

### Must propagate to derived systems:

* Mongo projections (delete or rebuild)
* Notifications delivery identifiers (device tokens)
* External providers: best-effort cleanup where feasible (usually limited)

---

# 3.3 Data Inventory Map (what gets exported/deleted)

You need a maintained “inventory” list (doc + code mapping). Minimal MVP inventory:

**Postgres**

* users: name, email, phone (if present), preferences
* auth: sessions (delete), MFA devices (delete)
* org memberships: roles, org ids
* in-app notifications: content (subject to minimization), read status
* audit events:

  * do NOT delete (compliance) but **anonymize actor_display** and optionally replace actor_id with a pseudonymous id if required

**Mongo (derived)**

* delete projections related to user OR mark user as anonymized and rebuild

**Providers**

* FCM/APNs: delete device tokens locally; cannot delete from Apple/Google but you can stop sending
* Mailjet/Twilio: retain message IDs for audit; do not store sensitive content

---

# 3.4 Workflow Design (API + Worker)

## 3.4.1 Export Workflow

### API endpoint (tRPC)

`gdpr.requestExport()`

Creates a Postgres job record:

* `gdpr_requests` table or generic `jobs` table
* status: `PENDING`
* includes `requester_user_id`, `target_user_id`, `tenant_id` (nullable)
* scope: `SELF` or `ADMIN_ON_BEHALF`
* requested_at
* correlation_id

Emits audit:

* `data.export.requested` (CONFIDENTIAL + IDENTITY)

Enqueue RabbitMQ job:

* `gdpr.export.requested`

### Worker

Consumes `gdpr.export.requested`:

1. Loads target user + related records from Postgres
2. Builds an export bundle (JSON)
3. Stores it in a retrievable place:

   * vendor-neutral option: store in Postgres as `bytea` (small exports)
   * better: object storage abstraction (S3-compatible / MinIO) via adapter, store URL + checksum in Postgres
4. Marks job `COMPLETED`, saves:

   * `export_location`
   * `checksum`
   * `expires_at` (exports should expire)
5. Emits audit:

   * `data.export.completed`

### Download endpoint

`gdpr.getExportDownloadLink(exportId)` or `gdpr.downloadExport(exportId)`

* verifies requester is authorized
* returns a short-lived signed link (if object storage) or streams data (if DB)
* logs audit:

  * `data.export.downloaded` (optional but useful)

---

## 3.4.2 Erasure Workflow

### API endpoint (tRPC)

`gdpr.requestErasure()`

Creates job record:

* status `PENDING`
* reason (optional)
* scope (self/admin)
* records legal hold flags (if needed)

Emits audit:

* `data.erase.requested` (RESTRICTED + IDENTITY/AUDIT depending)

Enqueue RabbitMQ job:

* `gdpr.erase.requested`

### Worker

Consumes `gdpr.erase.requested`:

1. Validate eligibility:

   * if legal retention required, choose **anonymize** instead of delete
2. Execute in a DB transaction:

   * Remove auth sessions
   * Remove device tokens
   * Remove personal fields or replace with anonymized placeholders
   * Handle created content:

     * either delete
     * or re-assign to “Anonymous” user id and remove identifying fields
3. Mark user as `anonymized_at` / `deleted_at`
4. Trigger Mongo projection cleanup:

   * delete user-related docs
   * OR queue “rebuild projections”
5. Emit audit:

   * `data.erase.completed` with minimal metadata `{ target_user_id, mode: "ANONYMIZE" | "DELETE" }`

### Anonymization strategy (recommended)

* Replace:

  * `email` → `anon+<userId>@example.invalid`
  * `name` → `Anonymous`
  * `phone` → null
* Keep:

  * internal ids for referential integrity
  * financial records (but detach identity where possible)
* Mark:

  * `anonymized_at` timestamp

---

# 3.5 Storage Abstractions (vendor-neutral requirement)

Introduce `packages/core/storage` interface:

* `StorageAdapter.putObject(key, bytes, contentType) -> { location, checksum }`
* `StorageAdapter.getSignedUrl(location, expiresIn) -> url`
* Dev implementation can be local FS
* Prod can be S3-compatible (MinIO, Wasabi, Backblaze, AWS S3)

This avoids AWS lock-in while enabling large exports.

---

# 3.6 Tables / Entities to add (minimum)

### `gdpr_requests` (or `privacy_requests`)

* `id`
* `type` (`EXPORT` | `ERASURE`)
* `status` (`PENDING | PROCESSING | COMPLETED | FAILED`)
* `requester_user_id`
* `target_user_id`
* `tenant_id` (nullable)
* `requested_at`, `processed_at`
* `result_location` (nullable)
* `expires_at` (nullable)
* `failure_reason` (nullable)
* `correlation_id` / `request_id`

---

# 3.7 Cursor-rule-friendly compliance checks

For any GDPR workflow implementation:

* must use Zod validation
* must audit request + completion/failure
* must be async via worker for large jobs
* must minimize payload exposure (IDs over full content)
* must document behavior in `docs/gdpr.md`

---

# 3.8 Deliverables for Step 3

* `docs/gdpr.md` including:

  * export & erasure flow
  * data inventory map
  * retention notes
* Postgres tables for privacy requests + export results
* Worker consumers for export/erasure
* Audit events emitted for each step
* Tests:

  * export success path
  * erasure success path
  * permission boundary checks
