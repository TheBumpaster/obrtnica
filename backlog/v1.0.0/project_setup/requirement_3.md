## Step 2 — Audit Event Infrastructure

Goal: add an **append-only, tamper-resistant-by-design** audit trail that supports **SOC2 / ISO 27001 / HIPAA** and helps GDPR accountability. It must work with your architecture (tRPC API + worker + Postgres + RabbitMQ) and stay vendor-neutral.

---

# 2.1 What must be auditable (minimum baseline)

Audit events must be emitted for:

### Authentication & session

* login success/failure
* logout
* MFA enroll/verify/reset
* password reset / credential change
* device token registration/removal

### Authorization & access

* permission denied (authorization failures)
* role changes, membership changes
* admin impersonation (if you allow it)

### Data access (sensitive)

* reads of **RESTRICTED** data (and optionally CONFIDENTIAL depending on module)
* exports (GDPR export)
* deletes/anonymizations (GDPR erase)

### Configuration & security relevant changes

* org settings changes
* notification preferences changes
* API key creation/revocation (if you have them)
* webhook configuration changes

---

# 2.2 Core design principles

* **Append-only**: never update audit rows; only insert.
* **Minimal but useful**: store metadata + references; avoid storing sensitive payload content.
* **Correlated**: include `request_id`/`correlation_id` to trace API → queue → worker.
* **Tenant-aware**: always include `tenant_id/org_id` if applicable.
* **Actor-aware**: who performed the action (user/service/worker).
* **Data-tagged**: attach the Step 1 classification/category tags.

---

# 2.3 Data model (Postgres)

Create a dedicated table: `audit_events`

Recommended fields:

* `id` (UUID/ULID) — event id
* `occurred_at` (timestamp, UTC)
* `event_type` (string enum-like)
* `event_version` (int)
* `severity` (`INFO | WARN | ERROR`)
* `tenant_id` (nullable, UUID/ULID)
* `actor_type` (`USER | SERVICE | SYSTEM`)
* `actor_id` (nullable, UUID/ULID)
* `actor_display` (nullable string) *(e.g., email, service name; avoid if sensitive)*
* `ip` (nullable string)
* `user_agent` (nullable string)
* `request_id` (nullable string)
* `correlation_id` (nullable string)
* `resource_type` (nullable string) *(e.g., Invoice, User, Membership)*
* `resource_id` (nullable string/UUID)
* `action` (string) *(e.g., CREATE/UPDATE/DELETE/READ/EXPORT)*
* `status` (`SUCCESS | FAILURE`)
* `reason` (nullable string) *(e.g., “permission_denied”, “invalid_mfa”)*
* `data_classification` (`PUBLIC | INTERNAL | CONFIDENTIAL | RESTRICTED`)
* `data_categories` (text[] or jsonb array of categories)
* `metadata` (jsonb) *(strictly non-sensitive; ids, counts, flags; never secrets)*

**Indexes**

* `(tenant_id, occurred_at desc)`
* `(actor_id, occurred_at desc)`
* `(event_type, occurred_at desc)`
* `(request_id)`
* `(correlation_id)`

**Retention**

* define a policy now (e.g., 1–7 years depending on product and contracts)
* enforcement can be via scheduled worker job (later)

---

# 2.4 Where audit events are emitted

### A) In the API (tRPC)

Audit events should be created for:

* auth/session changes
* permission failures
* user-triggered sensitive operations (create/update/delete/export)

**Rule:** emitting an audit event must not block the request path if DB is slow.
But since audit is compliance-critical, the simplest reliable approach is:

* write to Postgres directly in the request transaction (preferred for critical events)
* OR use transactional outbox + worker (good if you already standardize on outbox)

For security-critical events (login, role changes, exports), prefer **direct insert** (or outbox in same DB transaction).

### B) In the worker

Worker emits audit events for:

* notification delivery attempts (optional but helpful)
* queue processing failures that affect user data
* rebuild/export/delete background jobs

---

# 2.5 Implementation structure (repo)

### `packages/core`

Add:

* `audit/types.ts`

  * `AuditEvent`
  * `AuditEventType`
  * `Actor`
  * `DataTag` (from Step 1)
* `audit/builders.ts`

  * small helpers to construct consistent events
* `audit/sanitize.ts`

  * strips secrets / ensures metadata is safe

### `apps/api`

Add:

* `audit/audit.service.ts`

  * `writeAuditEvent(event)` calls audit repository
* tRPC middleware:

  * attaches `request_id`, `correlation_id`, actor, tenant to context
  * provides helper `ctx.audit.log(...)`
* auth flows call `ctx.audit.log(...)`

### `apps/worker`

Add:

* `audit/audit.service.ts` or reuse via package
* worker context includes correlation ids from message headers

---

# 2.6 “Safe metadata” rules (very important)

Audit logs must never contain:

* passwords, tokens, OTPs
* raw payment data
* full request payloads
* PHI content (if HIPAA scope)

Allowed metadata examples:

* `{ invoiceId, amount, currency }` (maybe)
* `{ affectedUserId }`
* `{ count: 12 }`
* `{ permission: "billing:write" }`
* `{ provider: "mailjet", messageId: "..." }`

If unsure → store only IDs.

---

# 2.7 Event taxonomy (starter list)

Use `event_version = 1` initially.

Examples:

* `auth.login.success`
* `auth.login.failure`
* `auth.mfa.enroll`
* `auth.mfa.verify.failure`
* `tenant.member.role.changed`
* `tenant.member.invited`
* `security.permission.denied`
* `data.export.requested`
* `data.export.completed`
* `data.erase.requested`
* `data.erase.completed`
* `notification.email.sent`
* `notification.sms.sent`
* `notification.push.sent`

---

# 2.8 How this ties to compliance

* **SOC 2 / ISO 27001**: audit trail + change accountability + incident investigations
* **HIPAA**: required access logs for systems handling PHI (plus BAAs etc.)
* **GDPR**: accountability principle, evidence of consent changes, exports, erasures

---

# 2.9 Deliverables for Step 2 (what you’ll end up with)

* `docs/audit-logging.md` describing:

  * what is logged, what is forbidden, retention
* Drizzle migration for `audit_events`
* `packages/core/audit/*` types + sanitizer
* API context support: `ctx.audit.log(...)`
* One or two pilot audit events implemented (e.g., login success/failure + permission denied)
