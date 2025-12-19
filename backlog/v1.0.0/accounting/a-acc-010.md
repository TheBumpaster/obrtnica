## A-ACC-010 — Journal Entry Templates

> As an accountant, I want to define journal entry templates so that repetitive postings are faster and consistent.

### Scope
Create/manage optional templates that pre-fill debit/credit accounts and naming. **Templates do not auto-post in MVP.**

### Dependencies
- **RBAC**: `A-ACC-R-003` (`accounting.journal_templates.manage`)
- **CoA**: requires CoA accounts exist and are selectable

### Implementation Outline (plan)
- CRUD templates: name + default lines (account + debit/credit side).
- Validate referenced accounts are active.

### Acceptance Criteria
- User can create a template with:
  - template name
  - default debit/credit account selections
- Templates are optional and do not automatically create postings.
- Only users with `accounting.journal_templates.manage` can manage templates.
- Templates cannot reference inactive accounts (or become invalid and require update).

### Definition of Done (DoD)
- Templates are stored as **CONFIDENTIAL + FINANCIAL** if they reveal financial structure; otherwise INTERNAL is acceptable but must be documented.
- Changes are auditable where appropriate (template changes are configuration-like).
