## A-ACC-050 — Configure Tax Rules

> As an accountant, I want to configure tax rules so that postings are compliant.

### Scope
Define tax categories, rules, and templates used by Selling/Buying calculations and Accounting postings.

### Dependencies
- **RBAC**: `A-ACC-R-003` (`accounting.tax.manage`)
- **Cross-module**: Selling/Buying calculate taxes externally; Accounting posts them (see accounting epic)
- **Audit**: tax config changes are sensitive configuration (audit required by policy)

### Implementation Outline (plan)
- Define tax categories and rules (e.g., VAT standard/reduced/zero).
- Define mapping from tax category/rule to ledger accounts (tax payable/receivable).
- Ensure tax configuration is tenant-scoped.

### Acceptance Criteria
- Accountant can define:
  - tax categories
  - tax rules
  - sales & purchase tax templates
- Tax config includes mapping needed for posting tax amounts to correct accounts (`A-ACC-051`).
- Only users with `accounting.tax.manage` can manage tax config.
- Changes are auditable and do not log sensitive payloads.

### Definition of Done (DoD)
- Data classification is documented (**CONFIDENTIAL + FINANCIAL**).
- Any integration contract assumptions with Selling/Buying are clearly stated in this plan.
