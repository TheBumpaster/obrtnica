## S-SET-013 — View Organization Members

> As an organization admin, I want to view all organization members so that I can manage access.

### Scope
List org members with roles/permissions summary.

### Dependencies
- Tenancy: `s-set-r-001`
- RBAC: `s-set-r-002` (`org.users.invite`/`org.users.assign_roles` or view-permission as defined)
- Audit (optional read audit per policy): `s-set-r-003`
- Data classification: `s-set-r-004` (**CONFIDENTIAL** membership data)

### Acceptance Criteria
- Admin can list members with key fields (user id, name, email, roles, status).
- Results are tenant-scoped and paginated/bounded.
- Users without permission are denied.

### Definition of Done (DoD)
- No secrets/tokens exposed.
- Pagination and filters documented if large orgs expected.
- Repo/global DoD applies.
