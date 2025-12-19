## S-SET-R-001 — Identity, Tenancy & Org Context

### What this governs
Multi-org membership, org-scoped permission evaluation, and mandatory middleware enforcement for any Settings action.

### Depends / used by
All Settings stories (`S-SET-001`…`S-SET-061`), especially org membership, roles, invites, security settings, and logs.

### Constraints (from rules/docs)
- `.cursor/rules/auth-multitenancy/RULE.md`
- `.cursor/rules/api-trpc/RULE.md` (auth/tenant middleware, no business logic in routers)
- Settings epic §3.1 Identity & Tenancy

### Acceptance Criteria
- Every Settings read/write is scoped to the active org/tenant; cross-tenant access is disallowed unless explicitly authorized and audited.
- Org context is derived server-side (no trust in client-supplied org ids).
- Middleware enforces auth + tenant scope before handler logic.

### Definition of Done (DoD)
- Tenant/org scoping is explicitly called out in each dependent story plan.
- No bypass paths (UI hiding is not security); API enforces.
- Repo DoD gates apply (`.cursor/rules/definition-of-done/RULE.md`).
