## A-ACC-070 — Immutable Ledger & Audit Visibility

> As an auditor, I want to see immutable accounting records so that financial data is trustworthy.

### Scope
Provide read access to immutable accounting records and associated audit metadata, consistent with audit logging rules.

### Dependencies
- **Immutability**: `A-ACC-R-001`
- **Audit contract**: `A-ACC-R-002`
- **RBAC**: `A-ACC-R-003` (ledger view permissions; audit logs are RESTRICTED)
- **Audit logging procedure**: `docs/compliance/procedures/audit-logging.md`

### Implementation Outline (plan)
- Expose read-only views into accounting entries (and optionally the audit trail of key actions) without leaking forbidden metadata.
- Ensure access is appropriately restricted and tenant-scoped.

### Acceptance Criteria
- Auditor can verify that posted entries are append-only (no edits/deletes), by observing:
  - immutable entry data
  - correction entries linked via reversal/adjustment references
- Access to audit events follows RESTRICTED handling rules (no secrets, minimal metadata).
- All views are tenant-scoped; cross-tenant access is not permitted.

### Definition of Done (DoD)
- Data classification is explicit:
  - ledger/accounting data: **CONFIDENTIAL + FINANCIAL**
  - audit logs: **RESTRICTED + AUDIT**
- Audit visibility does not violate “forbidden metadata” constraints.
