# EPIC: Assets (Asset Management)

## 1. Epic Purpose

The **Assets** epic manages **capitalized items** whose value is:

* Long-term
* Depreciated over time
* Auditable
* Reconciled with the General Ledger

> Assets are not inventory.
> They **stop moving** and start **aging financially**.

---

## 2. MVP Scope (Strict)

### ✅ IN SCOPE (MVP)

* Asset master & classification
* Asset acquisition (manual + from Buying)
* Asset capitalization
* Depreciation schedules
* Periodic depreciation posting
* Asset ledger & reports
* Asset disposal (basic)

### ❌ OUT OF SCOPE (MVP)

* Asset revaluation
* Impairment testing
* Leasing (IFRS 16)
* Asset transfer between orgs
* Component depreciation
* Advanced maintenance planning

---

## 3. Core Principles (Locked)

### 3.1 Asset Lifecycle

Assets follow a strict lifecycle:

1. Draft / Registered
2. Capitalized
3. Depreciating
4. Disposed

No skipping steps.

---

### 3.2 Accounting Is the Authority

* Asset value **must reconcile** with GL
* Depreciation is:

  * Period-based
  * Automated
  * Immutable once posted

---

### 3.3 Immutability & Corrections

* Posted depreciation entries cannot be edited
* Corrections via:

  * Reversal entries
  * Adjusted future schedules

---

### 3.4 Asset ≠ Stock

* Assets are **not tracked in inventory**
* Once capitalized:

  * Removed from stock
  * Managed only in Assets

---

## 4. Domain Model (Conceptual)

### Core Entities

* Asset Category
* Asset
* Asset Acquisition
* Depreciation Schedule
* Depreciation Entry
* Asset Ledger (derived)
* Asset Disposal

### Data Classification

| Entity            | Classification |
| ----------------- | -------------- |
| Asset master      | CONFIDENTIAL   |
| Depreciation data | CONFIDENTIAL   |
| Asset ledger      | INTERNAL       |
| Disposal records  | CONFIDENTIAL   |
| Audit             | RESTRICTED     |

---

## 5. Functional Areas & Backlog

---

# 5.1 Asset Categories

### Purpose

Define accounting behavior and depreciation rules.

### Requirements

* Category defines:

  * Asset account
  * Accumulated depreciation account
  * Depreciation expense account
  * Default depreciation method (MVP: straight-line only)
  * Default useful life (months/years)
* Categories are reusable
* Categories used by assets cannot be deleted

### Permissions

* `assets.categories.manage`
* `assets.categories.view`

---

### User Stories

**A-AST-001**

> As an accountant, I want to define asset categories so that depreciation rules are standardized.

**A-AST-002**

> As the system, I must prevent deletion of categories used by assets.

---

# 5.2 Asset Registration & Master

### Purpose

Register assets into the system.

### Requirements

* Asset has:

  * Name
  * Category
  * Acquisition date
  * Acquisition cost
  * Location (free text, MVP)
  * Status (Draft, Capitalized, Disposed)
* Assets can be:

  * Created manually
  * Created from Buying invoice lines (recommended)

### Permissions

* `assets.manage`
* `assets.view`

---

### User Stories

**A-AST-010**

> As an accountant, I want to register an asset so that it can be capitalized and depreciated.

**A-AST-011**

> As the system, I want to allow asset creation from purchase invoices to avoid duplicate data entry.

---

# 5.3 Asset Capitalization

### Purpose

Move value into fixed assets.

### Requirements

* Capitalization:

  * Locks acquisition cost
  * Creates accounting entry:

    * Asset account ↑
    * Inventory / Clearing / Expense ↓
* Asset becomes immutable except for:

  * Location
  * Notes

### Permissions

* `assets.capitalize`

---

### User Stories

**A-AST-020**

> As an accountant, I want to capitalize an asset so that it starts depreciating correctly.

**A-AST-021**

> As the system, I must prevent capitalization if accounting period is closed.

---

# 5.4 Depreciation Schedules

### Purpose

Define how asset value is expensed over time.

### Requirements (MVP)

* Only **Straight-Line** depreciation
* Schedule defines:

  * Start date
  * End date
  * Periodic amount
* Schedule auto-generated on capitalization
* Schedule is immutable once depreciation starts

### Permissions

* `assets.depreciation.manage`

---

### User Stories

**A-AST-030**

> As an accountant, I want the system to generate a depreciation schedule automatically so that errors are avoided.

---

# 5.5 Depreciation Posting (Automated)

### Purpose

Expense asset value periodically.

### Requirements

* Depreciation posting:

  * Runs per period
  * Posts only for open periods
* Posting creates accounting entries:

  * Depreciation expense ↑
  * Accumulated depreciation ↑
* Posting is:

  * Automated
  * Auditable
  * Idempotent

### Permissions

* System-driven (manual override restricted)

---

### User Stories

**A-AST-040**

> As the system, I want to post depreciation entries each period so that financials remain accurate.

**A-AST-041**

> As an accountant, I want to review posted depreciation so that I can audit asset expenses.

---

# 5.6 Asset Ledger & Reporting

### Purpose

Provide visibility into asset values.

### MVP Reports

* Asset register
* Asset ledger (by asset)
* Depreciation summary
* Net book value

### Requirements

* Reports are:

  * Read-only
  * Derived
  * Filterable

### Permissions

* `assets.reports.view`

---

### User Stories

**A-AST-050**

> As an accountant, I want to view asset reports so that I can understand asset value and depreciation.

---

# 5.7 Asset Disposal

### Purpose

Remove assets from books.

### Requirements

* Disposal:

  * Requires disposal date
  * Calculates:

    * Net book value
    * Gain / loss on disposal
* Posting creates accounting entries:

  * Remove asset cost
  * Remove accumulated depreciation
  * Post gain/loss
* Asset becomes permanently closed

### Permissions

* `assets.dispose`

---

### User Stories

**A-AST-060**

> As an accountant, I want to dispose of an asset so that books reflect its removal.

**A-AST-061**

> As the system, I must calculate gain or loss on disposal automatically.

---

# 5.8 Asset Maintenance (MVP-lite)

### Purpose

Track basic asset activity without operational depth.

### Requirements

* Asset can have:

  * Notes
  * Activity log
* No scheduling engine in MVP

### Permissions

* `assets.activity.view`

---

### User Stories

**A-AST-070**

> As a user, I want to record notes or activity on an asset so that history is preserved.

---

## 6. Integration Contracts (Hard Requirements)

### Events emitted (Assets → Worker → Accounting/Reports)

* `assets.registered`
* `assets.capitalized`
* `assets.depreciation.posted`
* `assets.disposed`

Each event includes:

* orgId
* assetId
* categoryId
* amounts (cost, depreciation, NBV)
* accounting entry references
* actor + correlationId

### Posting Rules Summary

| Action         | Accounting Impact                                      |
| -------------- | ------------------------------------------------------ |
| Capitalization | Asset ↑ / Inventory or Expense ↓                       |
| Depreciation   | Expense ↑ / Accumulated Depreciation ↑                 |
| Disposal       | Remove asset & accumulated depreciation / Gain or Loss |

---

## 7. Definition of Done (Assets MVP)

Assets is MVP-complete when:

* Assets can be registered and categorized
* Capitalization posts correct accounting entries
* Depreciation schedules auto-generate
* Depreciation posts per period
* Disposal works with gain/loss
* Asset ledger reconciles with GL
* All actions are auditable and immutable
