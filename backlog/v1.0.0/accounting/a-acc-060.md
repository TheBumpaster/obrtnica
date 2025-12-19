## A-ACC-060 — Defer Revenue (Basic)

> As an accountant, I want to defer revenue so that income is recognized over time.

### Scope
Create deferred revenue (and/or expense) items with a start/end date and recognition schedule.

### Dependencies
- **RBAC**: `A-ACC-R-003` (`accounting.deferred.manage`)
- **Immutability**: `A-ACC-R-001`
- **Periods**: `A-ACC-030`–`A-ACC-032`
- **Audit/source**: `A-ACC-R-002`

### Implementation Outline (plan)
- Deferred item entity: amount, start/end date, schedule definition, linked source document (optional).
- Define recognition frequency for MVP (e.g., monthly per period) and document constraints.

### Acceptance Criteria
- Accountant can create a deferred revenue item with:
  - start date, end date
  - recognition schedule definition
  - amount and currency assumption (MVP excludes multi-currency; uses org currency)
- Deferred items are auditable and tenant-scoped.
- Recognition does not mutate historical postings; it generates entries per period (`A-ACC-061`).

### Definition of Done (DoD)
- Classification documented (**CONFIDENTIAL + FINANCIAL**).
- Schedule behavior and edge cases are documented (partial periods, rounding).
