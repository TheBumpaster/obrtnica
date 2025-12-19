## S-SET-060 — View Access Logs

> As an organization admin, I want to view access logs so that I can monitor security.

### Scope
Read-only access log view (login events, IP/device/timestamp).

### Dependencies
- Tenancy: `s-set-r-001`
- RBAC: `s-set-r-002` (`org.logs.view`)
- Audit/log model: `s-set-r-003`, `s-set-r-006`
- Data classification: `s-set-r-004` (logs are **RESTRICTED + AUDIT**)

### Acceptance Criteria
- Admin can view access logs, filtered by date range and optionally user/actor.
- Results are paginated/bounded; tenant-scoped.
- No sensitive payloads in log entries (ids/summary only).

### Definition of Done (DoD)
- Mongo-down behavior documented if projections used; otherwise Postgres-backed.
- Repo/global DoD applies.
