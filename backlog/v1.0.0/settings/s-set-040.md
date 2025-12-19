## S-SET-040 — Enforce MFA

> As an organization admin, I want to enforce MFA so that accounts are more secure.

### Scope
Org-level MFA requirement toggle (all users, MVP).

### Dependencies
- Tenancy: `s-set-r-001`
- RBAC: `s-set-r-002` (`org.security.manage`)
- Audit: `s-set-r-003` (security setting changes)
- Data classification/secrets: `s-set-r-004` (MFA secrets RESTRICTED; never logged)

### Acceptance Criteria
- Admin can enable/disable org-level MFA requirement.
- Change applies to org users on next auth per policy; audited.
- No MFA secrets or recovery codes are logged or exposed.

### Definition of Done (DoD)
- Failure/success paths audited.
- Repo/global DoD applies.
