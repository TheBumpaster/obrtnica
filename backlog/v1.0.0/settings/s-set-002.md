## S-SET-002 — Change Password Securely

> As a user, I want to change my password securely so that I can protect my account.

### Scope
Password change for authenticated users, with verification and secret handling.

### Dependencies
- Tenancy/auth: `s-set-r-001`
- RBAC: `s-set-r-002` (`user.profile.manage`)
- Audit: `s-set-r-003` (password change events)
- Data classification/secrets: `s-set-r-004` (RESTRICTED secrets; never log)

### Acceptance Criteria
- Authenticated user can change password with current-password verification (or appropriate step-up).
- Password change invalidates old sessions/tokens per policy.
- Audit event emitted (no password content).
- Unauthorized attempts are denied and auditable.

### Definition of Done (DoD)
- No secrets/OTP tokens logged or stored in plaintext.
- Classification: credentials are RESTRICTED.
- Repo/global DoD applies.
