## S-SET-051 — Disable an Integration

> As an organization admin, I want to disable an integration so that access can be revoked.

### Scope
Disable (and optionally revoke tokens) for configured integrations (e.g., Google/Microsoft).

### Dependencies
- Tenancy: `s-set-r-001`
- RBAC: `s-set-r-002` (`org.integrations.manage`)
- Audit: `s-set-r-003`
- Data classification/secrets: `s-set-r-004`
- Async notifications (optional): `s-set-r-005`

### Acceptance Criteria
- Admin can disable an integration; tokens/access are revoked/invalidated as per provider capability.
- Action is auditable; unauthorized users denied.
- No secrets are logged during disable/revoke.

### Definition of Done (DoD)
- Document impact on existing sessions/logins.
- Repo/global DoD applies.
