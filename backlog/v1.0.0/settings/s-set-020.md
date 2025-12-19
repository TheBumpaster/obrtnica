## S-SET-020 — Create a Role with Permissions

> As an organization admin, I want to create a role with a defined set of permissions so that responsibilities are clearly separated.

### Scope
Org-defined roles composed of platform-defined permissions.

### Dependencies
- Tenancy: `s-set-r-001`
- RBAC: `s-set-r-002` (`org.roles.manage`)
- Audit: `s-set-r-003`
- Data classification: `s-set-r-004` (roles = INTERNAL)

### Acceptance Criteria
- Admin can create a role and assign allowed permissions (platform-owned list).
- Invalid/unknown permissions are rejected.
- Creation is tenant-scoped and auditable.

### Definition of Done (DoD)
- Role data classified INTERNAL; no secrets.
- Repo/global DoD applies.
