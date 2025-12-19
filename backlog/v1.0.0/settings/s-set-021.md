## S-SET-021 — Edit a Role

> As an organization admin, I want to edit a role so that permissions can evolve.

### Scope
Update role name/description/permission set within allowed platform permissions.

### Dependencies
- Tenancy: `s-set-r-001`
- RBAC: `s-set-r-002` (`org.roles.manage`)
- Audit: `s-set-r-003`
- Data classification: `s-set-r-004`

### Acceptance Criteria
- Admin can modify a role’s permissions and metadata.
- Cannot assign invalid permissions.
- Edits are tenant-scoped and auditable.

### Definition of Done (DoD)
- Changes do not orphan admins (if role is admin, last-admin protection applies via `S-SET-023`).
- Repo/global DoD applies.
