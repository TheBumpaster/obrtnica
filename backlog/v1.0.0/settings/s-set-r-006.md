## S-SET-R-006 — Access Log & Activity Log Read Model

### What this governs
Read-only access to access/activity logs with proper classification, pagination, filters, and RESTRICTED access controls.

### Depends / used by
`S-SET-060`, `S-SET-061` (logs) and any story exposing log data.

### Constraints (from rules/docs)
- Settings epic §4.7 requirements
- `.cursor/rules/mongodb-derived-only/RULE.md` (if projections used)
- `.cursor/rules/performance-policy/RULE.md`, `.cursor/rules/scalability-design/RULE.md` (pagination, bounded responses)
- Classification: audit/access logs are **RESTRICTED + AUDIT**

### Acceptance Criteria
- Logs are read-only, tenant-scoped, and permission-gated (`org.logs.view`).
- Endpoints are paginated with bounded defaults; support filters (date range, actor/user, action/type).
- If Mongo projections are used, they are rebuildable and Mongo-down degrades gracefully (no core break).
- No sensitive payloads in log records (ids/summary only).

### Definition of Done (DoD)
- Dependent stories specify pagination/filter expectations and classification.
- Failure modes documented (Mongo down, large result sets).
- Repo DoD gates apply.
