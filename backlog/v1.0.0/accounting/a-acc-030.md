## A-ACC-030 — Define Accounting Periods

> As an accountant, I want to define accounting periods so that entries are grouped correctly.

### Scope
Create and manage accounting periods with open/closed states.

### Dependencies
- **RBAC**: `A-ACC-R-003` (`accounting.periods.manage`)
- **Audit**: `A-ACC-R-002` (period close/reopen audited)

### Implementation Outline (plan)
- Period entity: name, start/end dates, status (open/closed).
- Enforce non-overlapping periods policy (if required) or document allowed overlaps.

### Acceptance Criteria
- Accountant can define a period with start/end boundaries.
- Period status can be set to Open/Closed by authorized users.
- Period definitions are tenant-scoped and permission-gated.

### Definition of Done (DoD)
- Period rules are documented clearly (especially overlap and boundary inclusivity).
- Period state is enforced by posting validation (`A-ACC-032`).
