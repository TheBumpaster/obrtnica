# Data Classification Schema

This document defines the data classification and categorization system used across the entire platform. It provides a vendor-neutral, implementable framework that aligns with **HIPAA / SOC2 / ISO 27001 / GDPR** requirements and works across our tech stack (Postgres, MongoDB projections, RabbitMQ, logs, notifications).

---

## 1) Classification Levels

Use **four** levels. Keep it simple enough that engineers actually follow it.

### PUBLIC
Information intended for public consumption.

**Examples:**
- Marketing pages
- Public documentation
- Public feature descriptions

### INTERNAL
Non-public business/system information that wouldn't materially harm users if leaked, but should not be public.

**Examples:**
- Internal operational metrics
- Non-sensitive logs (without identifiers)
- Non-secret configurations

### CONFIDENTIAL *(default for user/org data)*
Data that identifies a person, organization, or could cause harm if leaked.

**Examples:**
- User profile (name, email)
- Organization data
- Invoices, contracts, internal documents
- In-app notification content

### RESTRICTED *(highest sensitivity)*
Highly sensitive regulated or security-critical data.

**Examples:**
- Authentication secrets, API keys, signing keys
- Payment details (even tokens depending on context)
- **Health data / PHI** (HIPAA scope)
- Government IDs, highly sensitive personal data
- Security/audit logs that reveal sensitive operations

**Rule of thumb:** If you're unsure, classify as **CONFIDENTIAL** or **RESTRICTED**.

---

## 2) Data Categories (what kind of data it is)

Each data element should also be tagged with one or more categories:

- **IDENTITY**: user identity & account profile (email, name, username)
- **AUTH**: passwords (hashed), sessions, tokens, MFA, device tokens
- **TENANT**: organization identifiers, memberships, roles, permissions
- **CONTENT**: user-generated or customer content (documents, notes, comments)
- **FINANCIAL**: invoices, transactions, accounting records
- **HEALTH/PHI**: anything health-related or medical data (only if applicable)
- **ANALYTICS**: derived reporting metrics (MongoDB projections)
- **AUDIT**: security and compliance logs
- **INTEGRATIONS**: provider metadata (Mailjet message id, Twilio SID, push token status)

This lets you say: "CONFIDENTIAL + FINANCIAL" or "RESTRICTED + AUTH".

---

## 3) Handling Requirements per Classification (the controls)

These are the minimum controls that become our compliance baseline.

### PUBLIC
- No restrictions
- No secrets

### INTERNAL
- Access limited to authenticated internal/admin users
- Avoid storing personal identifiers in logs

### CONFIDENTIAL
- Encryption in transit + at rest
- Tenant-scoped access mandatory
- Logged access for sensitive operations (audit events)
- Stored only as long as needed (retention policy applies)
- Allowed in Postgres
- Allowed in MongoDB only as **derived** and preferably minimized

### RESTRICTED
Everything in CONFIDENTIAL, plus:
- Strict access controls (RBAC + explicit authorization)
- Mandatory audit events for any read/write of restricted data
- No raw values in logs (ever)
- Strong retention rules and secure deletion/anonymization processes
- If HIPAA/PHI: additional HIPAA access logging, vendor BAAs, and minimum necessary access

---

## 4) Where to Represent This in the Repo (docs + code)

To make it enforceable, we represent it in two places:

### A) Documentation (this file)
This document defines:
- Classification levels and categories
- Examples per module
- Handling rules
- Retention guidelines (see Step 2+ for full retention procedures)

### B) Code-level "data tag" type
In `packages/core`, we define a lightweight type to tag audit events, fields, and records:

```typescript
DataClassification = PUBLIC | INTERNAL | CONFIDENTIAL | RESTRICTED
DataCategory = IDENTITY | AUTH | TENANT | ...
DataTag = { classification, categories: DataCategory[] }
```

This is used for:
- Audit events
- Notification payload metadata
- Export/delete workflows (GDPR)

This is not about runtime enforcement everywhere — it's about **consistency and documentation**.

---

## 5) Concrete Examples (based on our stack)

### Postgres
- `users.email` → **CONFIDENTIAL** + **IDENTITY**
- `sessions.refresh_token_hash` → **RESTRICTED** + **AUTH**
- `org_membership.role` → **CONFIDENTIAL** + **TENANT**
- `invoices` → **CONFIDENTIAL** + **FINANCIAL**
- `audit_events` (security) → **RESTRICTED** + **AUDIT**

### MongoDB projections
- Dashboard KPIs (daily rollups) → **INTERNAL** or **CONFIDENTIAL** depending on whether they identify individuals
- Any projection containing email/name → **CONFIDENTIAL** (prefer to avoid)

### RabbitMQ messages
- Should carry minimal data; prefer IDs over payloads
- Event payloads containing identity/financial data are **CONFIDENTIAL** (avoid where possible)

### Push tokens
- Device token → **RESTRICTED** + **AUTH/INTEGRATIONS** (treat as sensitive)

### Email/SMS
- Message body can contain **CONFIDENTIAL** data; avoid including anything sensitive unless necessary
- Delivery receipts are **INTERNAL/CONFIDENTIAL** depending on linkage to user identity

---

## 6) Default Rules to Prevent Confusion

- **Default classification for any user/org record:** **CONFIDENTIAL**
- **Anything auth/security related:** **RESTRICTED**
- **Analytics should be:** derived, minimal, and ideally not identify individuals

---

## Related Documentation

- [Compliance Overview](./compliance/README.md)
- [Audit Logging](./compliance/procedures/audit-logging.md) *(when implemented)*
- [GDPR Rights Procedure](./compliance/procedures/gdpr-rights-procedure.md) *(when implemented)*
