## S-SET-022 — Assign Roles to Users

> As an organization admin, I want to assign roles to users so that access is controlled.

### Scope
Role assignment to members within an org.

### Dependencies
- Tenancy: `s-set-r-001`
- RBAC: `s-set-r-002` (`org.roles.assign`)
- Audit: `s-set-r-003`
- Data classification: `s-set-r-004`

### Acceptance Criteria
- Admin can assign one or more roles to a user in the org.
- Assignment enforces valid roles and permissions; rejects invalid roles.
- Action is auditable (actor, target user, roles assigned).

### Definition of Done (DoD)
- Tenant-scoped; cannot assign roles across orgs.
- Repo/global DoD applies.
