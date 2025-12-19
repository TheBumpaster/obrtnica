## S-SET-R-004 — Data Classification & Secrets Handling (Settings)

### What this governs
Classification for user/org data, RBAC data, audit/access logs, and handling of secrets/tokens/OTPs.

### Depends / used by
All Settings stories, especially: profile/password/sessions, invites, roles, billing, security settings, integrations, access/activity logs.

### Constraints (from rules/docs)
- Settings epic §3.4 Data Classification
- `.cursor/rules/data-classification/RULE.md`
- `docs/data-classification.md`
- Forbidden logging of secrets/tokens (audit rule)

### Acceptance Criteria
- Classification applied per data type:
  - User profile, org settings: **CONFIDENTIAL**
  - RBAC rules: **INTERNAL**
  - Audit/access logs: **RESTRICTED + AUDIT**
  - Secrets/tokens/OTPs: **RESTRICTED** and never logged/stored in plaintext
- Logs and audit events never contain secrets/OTPs/tokens or full request payloads.

### Definition of Done (DoD)
- Each dependent story plan states relevant classification and no-log expectations.
- Sensitive artifacts (password reset tokens, invite tokens, MFA secrets) are treated as RESTRICTED and not logged.
- Repo DoD gates apply.
