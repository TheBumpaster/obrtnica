## S-SET-003 — View Active Sessions

> As a user, I want to see all my active sessions so that I can detect suspicious access.

### Scope
List user’s active sessions with device/agent/time metadata.

### Dependencies
- Tenancy/auth: `s-set-r-001`
- RBAC: `s-set-r-002` (`user.sessions.manage` for self view; confirm policy)
- Data classification: `s-set-r-004` (**CONFIDENTIAL**, no secrets/refresh tokens in payload)

### Acceptance Criteria
- User can list their sessions (device, IP, created/last-seen).
- Response excludes secrets/tokens; includes only identifiers/metadata.
- Unauthorized users cannot view others’ sessions.

### Definition of Done (DoD)
- Pagination/bounds if sessions can be numerous.
- No tokens in logs or responses.
- Repo/global DoD applies.
