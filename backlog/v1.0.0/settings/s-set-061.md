## S-SET-061 — View Activity Logs

> As an organization admin, I want to view activity logs so that I can audit changes.

### Scope
Read-only activity logs for config/RBAC/security changes.

### Dependencies
- Tenancy: `s-set-r-001`
- RBAC: `s-set-r-002` (`org.logs.view`)
- Audit/log model: `s-set-r-003`, `s-set-r-006`
- Data classification: `s-set-r-004` (logs are **RESTRICTED + AUDIT**)

### Acceptance Criteria
- Admin can view activity logs with filters (date, actor, action/type).
- Results are paginated/bounded; tenant-scoped.
- Entries exclude sensitive payloads; store ids/summary only.

### Definition of Done (DoD)
- Mongo-down behavior documented if projections used; otherwise Postgres-backed.
- Repo/global DoD applies.
