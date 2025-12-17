## Step 1 — Data Classification Schema

Below is a **vendor-neutral, implementable** data classification scheme that works across **HIPAA / SOC2 / ISO 27001 / GDPR** and fits your stack (Postgres, Mongo projections, RabbitMQ, logs, notifications).

### 1) Classification Levels

Use **four** levels. Keep it simple enough that engineers actually follow it.

1. **PUBLIC**
   Information intended for public consumption.
   Examples: marketing pages, public docs, public feature descriptions.

2. **INTERNAL**
   Non-public business/system info that wouldn’t materially harm users if leaked, but should not be public.
   Examples: internal operational metrics, non-sensitive logs (without identifiers), non-secret configs.

3. **CONFIDENTIAL** *(default for user/org data)*
   Data that identifies a person, organization, or could cause harm if leaked.
   Examples:

* user profile (name, email)
* org data
* invoices, contracts, internal documents
* in-app notifications content

4. **RESTRICTED** *(highest sensitivity)*
   Highly sensitive regulated or security-critical data.
   Examples:

* authentication secrets, API keys, signing keys
* payment details (even tokens depending on context)
* **health data / PHI** (HIPAA scope)
* government IDs, highly sensitive personal data
* security/audit logs that reveal sensitive operations

**Rule of thumb:** if you’re unsure, classify as **CONFIDENTIAL** or **RESTRICTED**.

---

### 2) Data Categories (what kind of data it is)

Each data element should also be tagged with one category:

* **IDENTITY**: user identity & account profile (email, name, username)
* **AUTH**: passwords (hashed), sessions, tokens, MFA, device tokens
* **TENANT**: organization identifiers, memberships, roles, permissions
* **CONTENT**: user-generated or customer content (documents, notes, comments)
* **FINANCIAL**: invoices, transactions, accounting records
* **HEALTH/PHI**: anything health-related or medical data (only if applicable)
* **ANALYTICS**: derived reporting metrics (Mongo projections)
* **AUDIT**: security and compliance logs
* **INTEGRATIONS**: provider metadata (Mailjet message id, Twilio SID, push token status)

This lets you say: “CONFIDENTIAL + FINANCIAL” or “RESTRICTED + AUTH”.

---

### 3) Handling Requirements per Classification (the “controls”)

These are the minimum controls that become your compliance baseline.

#### PUBLIC

* No restrictions.
* No secrets.

#### INTERNAL

* Access limited to authenticated internal/admin users.
* Avoid storing personal identifiers in logs.

#### CONFIDENTIAL

* Encryption in transit + at rest.
* Tenant-scoped access mandatory.
* Logged access for sensitive operations (audit events).
* Stored only as long as needed (retention policy applies).
* Allowed in Postgres.
* Allowed in Mongo only as **derived** and preferably minimized.

#### RESTRICTED

* Everything in CONFIDENTIAL, plus:
* Strict access controls (RBAC + explicit authorization).
* Mandatory audit events for any read/write of restricted data.
* No raw values in logs (ever).
* Strong retention rules and secure deletion/anonymization processes.
* If HIPAA/PHI: additional HIPAA access logging, vendor BAAs, and minimum necessary access.

---

### 4) Where to Represent This in the Repo (docs + code)

To make it enforceable, represent it in two places:

#### A) Documentation (required)

Create: `docs/data-classification.md`

Contents:

* definitions above
* examples per module
* handling rules
* retention guidelines (placeholder for step 2+)

#### B) Code-level “data tag” type (recommended)

In `packages/core`, define a lightweight type to tag audit events, fields, and records:

* `DataClassification = PUBLIC | INTERNAL | CONFIDENTIAL | RESTRICTED`
* `DataCategory = IDENTITY | AUTH | TENANT | ...`
* `DataTag = { classification, categories: DataCategory[] }`

Use it for:

* audit events
* notification payload metadata
* export/delete workflows (GDPR)

This is not about runtime enforcement everywhere — it’s about **consistency and documentation**.

---

### 5) Concrete Examples (based on your stack)

**Postgres**

* users.email → CONFIDENTIAL + IDENTITY
* sessions.refresh_token_hash → RESTRICTED + AUTH
* org_membership.role → CONFIDENTIAL + TENANT
* invoices → CONFIDENTIAL + FINANCIAL
* audit_events (security) → RESTRICTED + AUDIT

**Mongo projections**

* dashboard KPIs (daily rollups) → INTERNAL or CONFIDENTIAL depending on whether they identify individuals
* any projection containing email/name → CONFIDENTIAL (prefer to avoid)

**RabbitMQ messages**

* should carry minimal data; prefer IDs over payloads
* event payloads containing identity/financial data are CONFIDENTIAL (avoid where possible)

**Push tokens**

* device token → RESTRICTED + AUTH/INTEGRATIONS (treat as sensitive)

**Email/SMS**

* message body can contain CONFIDENTIAL data; avoid including anything sensitive unless necessary
* delivery receipts are INTERNAL/CONFIDENTIAL depending on linkage to user identity

---

### 6) “Default Rules” to Prevent Confusion

* Default classification for any user/org record: **CONFIDENTIAL**
* Anything auth/security related: **RESTRICTED**
* Analytics should be **derived**, minimal, and ideally not identify individuals.
