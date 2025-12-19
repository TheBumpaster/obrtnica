# EPIC: Accounting (General Ledger & Financial Core)

## 1. Epic Purpose

The **Accounting epic** provides a **single, immutable financial truth** for the organization.

It must:

* Record *every* financial event
* Support audit & compliance
* Serve as the backbone for all other modules
* Never silently change history

> **Accounting does not care who created the data — only that it is correct, auditable, and immutable.**

---

## 2. MVP Scope (Strict)

### ✅ IN SCOPE (MVP)

* General Ledger (GL)
* Chart of Accounts (CoA)
* Journal Entries
* Accounting Periods
* Tax configuration
* Deferred revenue & expense (basic)
* Ledger summaries & reports
* Immutable ledger

### ❌ OUT OF SCOPE (MVP)

* Multi-currency
* FX revaluation
* Consolidation
* Cost centers / profit centers
* Budgeting & forecasting
* Advanced revenue recognition rules

---

## 3. Core Accounting Principles (Locked)

### 3.1 Double-Entry Accounting (Non-Negotiable)

* Every posting has:

  * ≥1 debit
  * ≥1 credit
* Total debits == total credits
* Balanced or rejected

---

### 3.2 Period Control

* Accounting periods can be:

  * Open
  * Closed (locked)
* No modifications allowed in closed periods
* Adjustments must go into a new period

---

### 3.3 Immutability

* Posted entries **cannot be edited**
* Corrections are done via:

  * Reversal entries
  * Adjustment entries
* Original entries remain intact

---

### 3.4 Source-Driven Entries

Journal entries must record:

* Source module (Selling, Buying, Stock, etc.)
* Source document ID
* Actor (user / system)

---

## 4. Accounting Domain Model (Conceptual)

### Core Entities

* Chart of Accounts
* Journal Entry
* Journal Entry Line
* Accounting Period
* Tax Configuration
* Deferred Schedules
* Ledger Views (derived)

### Data Classification

| Entity            | Classification |
| ----------------- | -------------- |
| Chart of Accounts | INTERNAL       |
| Journal Entries   | CONFIDENTIAL   |
| Tax Config        | CONFIDENTIAL   |
| Ledger Reports    | INTERNAL       |
| Audit Metadata    | RESTRICTED     |

---

## 5. Functional Areas & Backlog

---

# 5.1 Chart of Accounts (CoA)

### Purpose

Define the financial structure of the organization.

### Requirements

* System provides default CoA template
* Org can:

  * Import CoA
  * Create custom accounts
* Accounts have:

  * Type (Asset, Liability, Equity, Revenue, Expense)
  * Parent (hierarchy)
  * Status (active/inactive)
* Accounts used in entries **cannot be deleted**

### Permissions

* `accounting.coa.manage`
* `accounting.coa.view`

---

### User Stories

**A-ACC-001**

> As an organization admin, I want to import a chart of accounts so that I can start accounting quickly.

**A-ACC-002**

> As an organization admin, I want to create and manage accounts so that my financial structure matches my business.

**A-ACC-003**

> As the system, I must prevent deletion of accounts that have accounting entries.

---

# 5.2 Journal Entry Templates

### Purpose

Standardize recurring postings.

### Requirements

* Templates define:

  * Entry name
  * Default debit/credit accounts
* Templates are optional
* Templates do NOT post automatically in MVP

### Permissions

* `accounting.journal_templates.manage`

---

### User Stories

**A-ACC-010**

> As an accountant, I want to define journal entry templates so that repetitive postings are faster and consistent.

---

# 5.3 Journal Entries (Manual & Generated)

### Purpose

Record financial transactions.

### Requirements

* Journal Entry:

  * Date
  * Reference
  * Description
  * Lines (debit/credit)
* Must validate:

  * Period is open
  * Accounts are active
  * Entry is balanced
* Entry becomes immutable once posted

### Permissions

* `accounting.entries.create`
* `accounting.entries.view`

---

### User Stories

**A-ACC-020**

> As an accountant, I want to create a journal entry so that financial events are recorded.

**A-ACC-021**

> As the system, I must reject unbalanced journal entries.

**A-ACC-022**

> As the system, I must lock journal entries after posting so history cannot be altered.

---

# 5.4 Accounting Periods & Closing

### Purpose

Control time boundaries of accounting.

### Requirements

* Periods can be:

  * Open
  * Closed
* Closing a period:

  * Prevents new entries
  * Emits audit event
* Reopening a period:

  * Restricted
  * Audited

### Permissions

* `accounting.periods.manage`

---

### User Stories

**A-ACC-030**

> As an accountant, I want to define accounting periods so that entries are grouped correctly.

**A-ACC-031**

> As an accountant, I want to close a period so that financials are finalized.

**A-ACC-032**

> As the system, I must prevent postings in closed periods.

---

# 5.5 Ledger Views & Summaries

### Purpose

Provide visibility into financial position.

### Requirements

* Ledger views:

  * General Ledger
  * Account Ledger
  * Customer Ledger (later tied to Selling)
  * Supplier Ledger (later tied to Buying)
* Views are:

  * Read-only
  * Derived from entries

### Permissions

* `accounting.ledger.view`

---

### User Stories

**A-ACC-040**

> As a user, I want to view the general ledger so that I can understand financial activity.

**A-ACC-041**

> As a user, I want to view account balances so that I can analyze performance.

---

# 5.6 Tax Configuration & Posting

### Purpose

Prepare system for compliant tax postings.

### Requirements

* Define:

  * Tax categories
  * Tax rules
  * Sales & purchase tax templates
* Taxes:

  * Are calculated externally (Selling/Buying)
  * Are posted via accounting entries

### Permissions

* `accounting.tax.manage`

---

### User Stories

**A-ACC-050**

> As an accountant, I want to configure tax rules so that postings are compliant.

**A-ACC-051**

> As the system, I want to post tax amounts to correct ledger accounts.

---

# 5.7 Deferred Revenue & Expense (Basic)

### Purpose

Support compliance-correct timing of recognition.

### Requirements

* Deferred items have:

  * Start date
  * End date
  * Recognition schedule
* System generates:

  * Periodic recognition entries
* Fully auditable

### Permissions

* `accounting.deferred.manage`

---

### User Stories

**A-ACC-060**

> As an accountant, I want to defer revenue so that income is recognized over time.

**A-ACC-061**

> As the system, I want to automatically generate recognition entries per period.

---

# 5.8 Immutable Ledger & Audit

### Purpose

Guarantee trust in financial data.

### Requirements

* Ledger is append-only
* All changes emit:

  * Audit event
  * Actor
  * Source
* No hard deletes

### Permissions

* System-enforced (not user-controlled)

---

### User Stories

**A-ACC-070**

> As an auditor, I want to see immutable accounting records so that financial data is trustworthy.

---

## 6. Accounting Definition of Done (MVP)

Accounting is MVP-complete when:

* CoA exists and is enforced
* Journal entries are balanced & immutable
* Period closing works
* Ledger views are accurate
* All postings are auditable
* Other modules can post entries without hacks
