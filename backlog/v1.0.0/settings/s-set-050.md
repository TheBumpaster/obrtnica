## S-SET-050 — Enable Google Login

> As an organization admin, I want to enable Google login so that users can authenticate easily.

### Scope
Org-level toggle for Google OAuth; config and enablement.

### Dependencies
- Tenancy: `s-set-r-001`
- RBAC: `s-set-r-002` (`org.integrations.manage`)
- Audit: `s-set-r-003`
- Data classification/secrets: `s-set-r-004` (OAuth client secrets RESTRICTED; never logged)
- Async notifications (optional): `s-set-r-005`

### Acceptance Criteria
- Admin can enable Google login for the org with required client config.
- Tokens/secrets are not logged; stored securely.
- Enable/disable actions are auditable and tenant-scoped.

### Definition of Done (DoD)
- Clear disconnect/disable behavior documented.
- Repo/global DoD applies.
