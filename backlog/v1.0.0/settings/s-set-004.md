## S-SET-004 — Revoke a Specific Session

> As a user, I want to revoke a specific session so that I can log out from lost or unused devices.

### Scope
User-driven revocation of own sessions (except possibly current session per policy).

### Dependencies
- Tenancy/auth: `s-set-r-001`
- RBAC: `s-set-r-002` (`user.sessions.manage`)
- Audit: `s-set-r-003` (revocation is sensitive)
- Data classification: `s-set-r-004`

### Acceptance Criteria
- User can revoke a chosen session (identified by session id/device/createdAt).
- Revocation invalidates the target session promptly.
- Attempting to revoke without permission is denied and auditable.
- Policy on revoking current session is defined (allowed or explicitly disallowed).

### Definition of Done (DoD)
- No tokens disclosed in logs or responses.
- Audit event emitted for revoke action with safe metadata.
- Repo/global DoD applies.
