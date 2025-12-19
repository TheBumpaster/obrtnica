## A-ACC-051 — Post Tax Amounts to Correct Ledger Accounts

> As the system, I want to post tax amounts to correct ledger accounts.

### Scope
Use tax configuration to post tax amounts (provided by Selling/Buying) into appropriate tax accounts as part of journal entries.

### Dependencies
- **Tax config**: `A-ACC-050`
- **Source-driven entries**: `A-ACC-R-002` (source module/document/actor)
- **Journal entries**: `A-ACC-020` (creation), `A-ACC-021` (balanced), `A-ACC-022` (immutable)
- **Cross-module**: Selling/Buying supply calculated tax amounts

### Implementation Outline (plan)
- Define how Selling/Buying provide tax amount breakdowns (IDs over payloads preferred).
- Map tax category/rule/template to ledger account(s) (payable/receivable) using Accounting tax configuration.
- Include tax lines in postings such that journal entry remains balanced.

### Acceptance Criteria
- For a taxable document, system posts tax amounts to configured ledger accounts.
- Posting uses the correct side (debit/credit) based on sales vs purchase context.
- Posting is rejected if tax configuration mapping is missing (explicit error).
- Generated entries include source module/document id and are auditable.

### Definition of Done (DoD)
- Tax posting behavior is documented as an integration contract between modules (Selling/Buying → Accounting).
- Follows immutability + period control (`A-ACC-R-001`, `A-ACC-032`).
