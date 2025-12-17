# Contents:

* What standards you align with (SOC 2, ISO 27001, GDPR, HIPAA if applicable)
* Scope of the system
* Where to find:

  * policies
  * procedures
  * technical controls
  * evidence
* Statement that controls are enforced via:

  * Cursor rules
  * backlog process
  * CI commands

Example sections:

* System overview
* Data scope
* Control enforcement model
* Evidence generation model

This document connects *process → code → evidence*.

---

# Foundation Documents

* **[Data Classification Schema](../data-classification.md)** — defines classification levels (PUBLIC/INTERNAL/CONFIDENTIAL/RESTRICTED) and data categories used throughout the platform

---

# Policies (what you commit to)

```
docs/compliance/policies/
```

These are **intent statements**. They change rarely.

Minimum set:

1. `security-policy.md`

   * access control principles
   * encryption
   * logging
   * least privilege

2. `privacy-policy-internal.md`

   * how personal data is handled internally
   * data minimization
   * retention philosophy
   * GDPR principles mapping

3. `incident-response-policy.md`

   * how incidents are classified
   * response timeline
   * escalation rules

4. `access-control-policy.md`

   * RBAC principles
   * MFA expectations
   * admin vs user roles

> These do not need legal language. They need **consistency with what you actually do**.

---

# Procedures (how you actually do it)

```
docs/compliance/procedures/
```

These map **1:1 with your implementation**.

Minimum set:

1. `audit-logging.md`

   * what events are logged
   * where logs are stored
   * retention
   * who can access logs

2. `gdpr-rights-procedure.md`

   * export workflow
   * erasure/anonymization workflow
   * timelines
   * failure handling

3. `change-management.md`

   * backlog-driven changes
   * versioned releases
   * Definition of Done
   * review gates

4. `backup-and-recovery.md`

   * what is backed up
   * restore testing cadence
   * RPO/RTO targets (can be aspirational early)

---

# Risk register (ISO 27001 backbone)

```
docs/compliance/risk/
  risk-register.md
```

This is **not scary** if done right.

Structure:

* Risk ID
* Description
* Impact
* Likelihood
* Mitigation
* Owner
* Status

Example risks:

* Unauthorized access to tenant data
* Loss of audit logs
* Misconfigured notification providers
* Data export abuse

Link mitigations to:

* Cursor rules
* backlog items
* audit controls

Auditors love seeing risks tied to **actual controls**.

---

# Incident records (SOC 2 / ISO)

```
docs/compliance/incidents/
```

Each incident = one file.

Naming:

```
incident-YYYY-MM-DD-short-description.md
```

Contents:

* What happened
* When detected
* Impact
* Root cause
* Resolution
* Preventive actions
* Related backlog items

Even “no incidents this quarter” should be documented.

---

# Access reviews (SOC 2 critical)

```
docs/compliance/access/
```

Store:

* periodic access reviews
* admin list snapshots
* service account reviews

Example:

```
access-review-2025-Q1.md
```

Contents:

* who reviewed
* date
* systems reviewed
* changes made (or none)

This is **mandatory** for SOC 2 Type II.

---

# Vendor management (GDPR + HIPAA + SOC2)

```
docs/compliance/vendors/
```

One file per vendor:

```
mailjet.md
twilio.md
fcm-apns.md
mongodb.md
```

Each file includes:

* what data the vendor touches
* data classification
* purpose
* contract status (DPA / BAA if applicable)
* risk notes

This ties directly into GDPR processor obligations.

---

# Evidence folder (the gold mine)

```
docs/compliance/evidence/
```

This is where **proof accumulates automatically**.

Examples of evidence:

* screenshots of MFA enabled
* CI logs showing `pnpm verify`
* migration logs
* audit log samples (redacted)
* access review signoffs
* incident resolution records

Do **not** over-organize here. Evidence is chronological, not theoretical.

---
