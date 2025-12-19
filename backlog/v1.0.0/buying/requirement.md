# EPIC: Buying (Supplier Essentials)

## 1. Epic Purpose

The **Buying** epic manages procurement and supplier-side financial flows:

* Supplier master data
* Purchase documents (requests → orders → receipts → invoices)
* Posting to:

  * **Stock** (when items are stock-tracked)
  * **Accounting** (AP, expenses, taxes)
* Reports & analytics

> Buying is where cost becomes both **inventory value** and **financial liability**.

---

## 2. MVP Scope (Strict)

### ✅ IN SCOPE (MVP)

* Supplier master
* Purchase documents:

  * Purchase Order (PO)
  * Goods Receipt (GRN) / Purchase Receipt
  * Purchase Invoice (PI)
  * Supplier Credit Note (basic)
* Purchase taxes (using Accounting tax config)
* Status lifecycle + immutability after posting
* Reports (basic)

### ❌ OUT OF SCOPE (MVP)

* RFQ / vendor bidding
* Multi-warehouse routing
* Partial approvals / approval chains (can be a later governance feature)
* Landed costs (freight allocation)
* 3-way match enforcement (we’ll support linking, not strict enforcement)
* Multi-currency

---

## 3. Core Principles (Locked)

### 3.1 Document-Driven

Buying operates through **documents** with state:

* Draft → Submitted → Posted → Closed/Cancelled

### 3.2 Immutability

* Once posted:

  * No editing
  * No deletion
  * Corrections through credit notes / reversal documents

### 3.3 Integration Contracts

Buying must integrate with:

* **Stock** (receipts increase inventory)
* **Accounting** (invoice posts AP + expense/inventory + taxes)

### 3.4 Supplier Ledger Readiness

Every posted supplier invoice must be traceable into:

* Supplier ledger summary (Accounting)
* Audit events
* Source document chain

---

## 4. Domain Model (Conceptual)

### Core Entities

* Supplier
* Supplier Address / Contacts (minimal in MVP)
* Purchase Order
* Purchase Receipt (GRN)
* Purchase Invoice
* Credit Note (supplier return/credit)
* Purchase Document Line
* Purchase Taxes Summary (per document)

### Data Classification

| Entity          | Classification |
| --------------- | -------------- |
| Supplier master | CONFIDENTIAL   |
| Purchase docs   | CONFIDENTIAL   |
| Tax amounts     | CONFIDENTIAL   |
| Reports         | INTERNAL       |
| Audit           | RESTRICTED     |

---

## 5. Functional Areas & Backlog

---

# 5.1 Supplier Master

### Purpose

Maintain supplier identities and defaults.

### Requirements

* Supplier fields (MVP):

  * Name (required)
  * Supplier code (unique)
  * Tax/VAT ID (optional)
  * Default currency (MVP = org currency)
  * Payment terms (optional)
  * Status active/inactive
* Supplier used in docs cannot be deleted

### Permissions

* `buying.suppliers.manage`
* `buying.suppliers.view`

### User Stories

**B-BUY-001**

> As a procurement user, I want to create and manage suppliers so that purchase documents can be issued correctly.

**B-BUY-002**

> As the system, I must prevent deletion of suppliers referenced by posted purchase documents.

---

# 5.2 Purchase Order (PO)

### Purpose

Commit intent to buy goods/services.

### Requirements

* PO supports:

  * Supplier
  * Items (stock or non-stock)
  * Quantities and agreed prices
  * Expected delivery date (optional)
* Status:

  * Draft → Submitted → Closed/Cancelled
* Posting:

  * PO does **not** affect Accounting in MVP
  * PO can reserve quantities (optional; default off)

### Permissions

* `buying.po.create`
* `buying.po.view`
* `buying.po.manage`

### User Stories

**B-BUY-010**

> As a procurement user, I want to create a purchase order so that suppliers receive an official request.

**B-BUY-011**

> As a procurement user, I want to submit/close a purchase order so that purchasing lifecycle is controlled.

---

# 5.3 Purchase Receipt (GRN)

### Purpose

Record goods received and increase stock.

### Requirements

* Receipt can be created:

  * From PO (linked)
  * Standalone (allowed in MVP)
* Receipt affects:

  * Stock ↑ (for stock items)
  * Accounting inventory clearing (configurable) OR direct inventory (MVP pick: **Inventory Clearing** recommended)
* Must support partial receipts

### Permissions

* `buying.receipts.create`
* `buying.receipts.view`

### User Stories

**B-BUY-020**

> As a warehouse/procurement user, I want to record goods receipt so that inventory increases accurately.

**B-BUY-021**

> As the system, I must create stock transactions from purchase receipts for stock items.

---

# 5.4 Purchase Invoice (PI)

### Purpose

Record supplier invoice and create liability.

### Requirements

* Invoice can be created:

  * From receipt (linked)
  * Standalone (allowed in MVP)
* Posting creates accounting entries:

  * Accounts Payable ↑
  * Inventory / Expense ↑
  * Tax accounts ↑
* Must support:

  * Discounts (line or document level)
  * Taxes (using accounting tax templates)
  * Partial invoicing (later strict matching; MVP link-only)

### Permissions

* `buying.invoices.create`
* `buying.invoices.view`
* `buying.invoices.post`

### User Stories

**B-BUY-030**

> As an accountant, I want to create and post a purchase invoice so that liabilities and costs are recorded.

**B-BUY-031**

> As the system, I must generate balanced accounting entries when a purchase invoice is posted.

**B-BUY-032**

> As the system, I must prevent posting purchase invoices into closed accounting periods.

---

# 5.5 Supplier Credit Note (Returns / Credits)

### Purpose

Correct overcharges, returns, or adjustments.

### Requirements

* Credit note can reference:

  * Purchase invoice (preferred)
  * Purchase receipt (optional)
* Posting creates reversal accounting entries:

  * AP ↓
  * Inventory/Expense ↓
  * Tax ↓
* If stock return is involved:

  * Stock ↓ via stock transaction

### Permissions

* `buying.credits.create`
* `buying.credits.post`

### User Stories

**B-BUY-040**

> As an accountant, I want to post supplier credit notes so that corrections are recorded without editing history.

**B-BUY-041**

> As the system, I must generate stock-out movements for returned stock items where applicable.

---

# 5.6 Buying Settings (Module-Level)

### Purpose

Configure defaults and posting behavior.

### Requirements (MVP)

* Default warehouse for receipts
* Default accounts:

  * Inventory
  * Inventory clearing
  * Purchases expense (for non-stock)
  * Accounts payable
  * Tax accounts mapping
* Default tax template per supplier (optional)

### Permissions

* `buying.settings.manage`

### User Stories

**B-BUY-050**

> As an org admin, I want to configure buying defaults so that documents post consistently.

---

# 5.7 Purchase Reports & Analytics (Basic)

### Purpose

Provide visibility into spending and supplier performance.

### MVP Reports

* Purchases by supplier
* Purchases by item
* Open POs
* Received not invoiced
* Invoiced not received (flag)

### Permissions

* `buying.reports.view`

### User Stories

**B-BUY-060**

> As a manager, I want to view purchase reports so that I can monitor spending and supplier activity.

---

## 6. Integration Contracts (Hard Requirements)

### Events emitted (Buying → Worker → Projections/Notifications)

* `buying.po.submitted`
* `buying.receipt.posted`
* `buying.invoice.posted`
* `buying.credit_note.posted`

Each must include:

* orgId, supplierId
* documentId, documentType
* totals (net, tax, gross)
* stock impact summary (items, qty)
* accounting impact summary (accounts touched)
* actor + correlationId

### Posting rules (MVP)

* **Receipt posted**:

  * Creates `stock.transaction.receipt` for stock items
  * Creates accounting entry: `Inventory Clearing` pattern (recommended)
* **Invoice posted**:

  * Creates AP + expense/inventory + tax entries
  * If linked to receipt: clears inventory clearing balance

---

## 7. Definition of Done (Buying MVP)

Buying is MVP-complete when:

* Supplier master exists
* PO → Receipt → Invoice works end-to-end
* Posting creates:

  * Stock movements (when stock items)
  * Balanced accounting entries
* All sensitive actions are audited
* No posted docs can be edited or deleted
* Reports return correct totals
