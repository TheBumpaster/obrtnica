## S-SET-041 — Configure Session Lifetime

> As an organization admin, I want to configure session lifetime so that security policies are enforced.

### Scope
Org-level session duration/defaults.

### Dependencies
- Tenancy: `s-set-r-001`
- RBAC: `s-set-r-002` (`org.security.manage`)
- Audit: `s-set-r-003`
- Data classification: `s-set-r-004`

### Acceptance Criteria
- Admin can set session lifetime (bounded, sensible defaults/min/max).
- New sessions adhere to configured lifetime; change is auditable.
- Unauthorized users denied.

### Definition of Done (DoD)
- No secrets logged; only configuration values stored.
- Repo/global DoD applies.
