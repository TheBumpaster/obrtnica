# EPIC: Selling (Selling Essentials)

## 1. Epic Purpose

The **Selling** epic manages customer-side commercial flows:

* Customer master data
* Sales documents (quotes → orders → delivery → invoices)
* Posting to:

  * **Stock** (deliveries reduce inventory)
  * **Accounting** (AR, revenue, taxes, COGS)
* POS (simplified)
* Reports & analytics

> Selling is where inventory becomes **revenue** and **receivables**.

---

## 2. MVP Scope (Strict)

### ✅ IN SCOPE (MVP)

* Customer master
* Sales documents:

  * Sales Quote (optional)
  * Sales Order (SO)
  * Delivery Note (DN) / Shipment
  * Sales Invoice (SI)
  * Sales Credit Note (returns/credits)
* POS (single-screen simplified invoice creation)
* Taxes (use Accounting tax config)
* Status lifecycle + immutability after posting
* Basic reports

### ❌ OUT OF SCOPE (MVP)

* Complex pricing rules (tiered, contracts)
* Promotions/coupons engine
* Advanced revenue recognition
* Multi-currency
* Partial payment allocation & bank reconciliation (later accounting module)
* Delivery routing, picking/packing wave management

---

## 3. Core Principles (Locked)

### 3.1 Document-Driven with State

Selling operates via documents with lifecycle:

* Draft → Submitted → Posted → Closed/Cancelled

### 3.2 Immutability

* Posted documents are immutable
* Corrections via credit notes / reversal docs

### 3.3 Stock Integration

* Deliveries reduce stock (stock-out)
* Returns increase stock (stock-in)

### 3.4 Accounting Integration

Sales posting must generate:

* Accounts Receivable ↑
* Revenue ↑
* Tax payable ↑
* COGS ↑ + Inventory ↓ (when stock items)

---

## 4. Domain Model (Conceptual)

### Core Entities

* Customer
* Customer Contacts/Addresses (minimal)
* Sales Order
* Delivery Note / Shipment
* Sales Invoice
* Sales Credit Note
* Sales Document Line
* POS Session (optional, minimal)

### Data Classification

| Entity          | Classification |
| --------------- | -------------- |
| Customer master | CONFIDENTIAL   |
| Sales docs      | CONFIDENTIAL   |
| Tax amounts     | CONFIDENTIAL   |
| Reports         | INTERNAL       |
| Audit           | RESTRICTED     |

---

## 5. Functional Areas & Backlog

---

# 5.1 Customer Master

### Purpose

Maintain customer identities and defaults.

### Requirements

* Customer fields (MVP):

  * Name (required)
  * Customer code (unique)
  * Tax/VAT ID (optional)
  * Payment terms (optional)
  * Status active/inactive
* Customer referenced by posted docs cannot be deleted

### Permissions

* `selling.customers.manage`
* `selling.customers.view`

### User Stories

**B-SEL-001**

> As a sales user, I want to create and manage customers so that sales documents can be issued correctly.

**B-SEL-002**

> As the system, I must prevent deletion of customers referenced by posted sales documents.

---

# 5.2 Sales Quote (Optional in MVP)

### Purpose

Offer pricing before committing.

### Requirements

* Quote supports:

  * Customer
  * Items and pricing
  * Valid until date (optional)
* Quote does not affect stock or accounting

### Permissions

* `selling.quotes.create`
* `selling.quotes.view`

### User Stories

**B-SEL-010**

> As a sales user, I want to create a sales quote so that I can propose pricing to customers.

---

# 5.3 Sales Order (SO)

### Purpose

Commit intent to sell.

### Requirements

* SO supports:

  * Customer
  * Items (stock or non-stock)
  * Quantities and prices
  * Requested delivery date (optional)
* Status:

  * Draft → Submitted → Closed/Cancelled
* SO does not post accounting in MVP
* Optional: reserve stock (off by default)

### Permissions

* `selling.so.create`
* `selling.so.view`
* `selling.so.manage`

### User Stories

**B-SEL-020**

> As a sales user, I want to create a sales order so that we can track commitments to customers.

**B-SEL-021**

> As a sales user, I want to submit/close a sales order so that order lifecycle is controlled.

---

# 5.4 Delivery Note / Shipment

### Purpose

Record goods shipped and decrease stock.

### Requirements

* Delivery can be created:

  * From Sales Order (linked)
  * Standalone (allowed in MVP)
* Delivery affects:

  * Stock ↓ (for stock items)
  * Creates COGS impact readiness (COGS posting occurs when invoice is posted OR at delivery depending on policy; MVP choose: **at invoice**)
* Supports partial deliveries

### Permissions

* `selling.deliveries.create`
* `selling.deliveries.view`

### User Stories

**B-SEL-030**

> As a warehouse/sales user, I want to record a delivery so that inventory decreases correctly.

**B-SEL-031**

> As the system, I must create stock issue transactions from deliveries for stock items.

---

# 5.5 Sales Invoice (Core)

### Purpose

Record revenue, taxes, and receivables.

### Requirements

* Invoice can be created:

  * From delivery (preferred)
  * From sales order (allowed)
  * Standalone (allowed)
* Posting creates accounting entries:

  * Accounts Receivable ↑
  * Revenue ↑
  * Tax payable ↑
  * COGS ↑ and Inventory ↓ (stock items)
* Must support:

  * Discounts (line/document)
  * Taxes (via Accounting tax config)
  * Partial invoicing (link-only in MVP)

### Permissions

* `selling.invoices.create`
* `selling.invoices.view`
* `selling.invoices.post`

### User Stories

**B-SEL-040**

> As an accountant/sales user, I want to create and post a sales invoice so that revenue and receivables are recorded.

**B-SEL-041**

> As the system, I must generate balanced accounting entries when a sales invoice is posted.

**B-SEL-042**

> As the system, I must prevent posting invoices into closed accounting periods.

---

# 5.6 Sales Credit Note (Returns / Credits)

### Purpose

Correct overcharges, returns, cancellations.

### Requirements

* Credit note can reference:

  * Sales invoice (preferred)
  * Delivery (optional)
* Posting creates reversal accounting entries:

  * AR ↓
  * Revenue ↓
  * Tax payable ↓
  * If stock return: Inventory ↑ and COGS ↓
* If return involves stock:

  * Creates stock receipt (stock-in)

### Permissions

* `selling.credits.create`
* `selling.credits.post`

### User Stories

**B-SEL-050**

> As an accountant, I want to post sales credit notes so that corrections are recorded without editing history.

**B-SEL-051**

> As the system, I must generate stock-in movements for returned stock items where applicable.

---

# 5.7 POS (Point of Sale) — MVP Simplified

### Purpose

Enable fast in-person selling (small businesses).

### MVP POS Scope

* One screen:

  * Search/select items
  * Add quantities
  * Apply tax template
  * Create posted invoice immediately
* Optional: cash payment flag (no banking integration)

### Permissions

* `selling.pos.use`

### User Stories

**B-SEL-060**

> As a cashier, I want to create a POS sale quickly so that customer checkout is fast.

---

# 5.8 Selling Settings (Module-Level)

### Purpose

Configure defaults for sales documents and postings.

### Requirements (MVP)

* Default accounts:

  * Accounts receivable
  * Revenue account mapping (by item category optional)
  * Tax payable mapping
  * COGS + Inventory accounts mapping (from stock/accounting defaults)
* Default warehouse for deliveries
* Default tax template per customer (optional)

### Permissions

* `selling.settings.manage`

### User Stories

**B-SEL-070**

> As an org admin, I want to configure selling defaults so that documents post consistently.

---

# 5.9 Sales Reports & Analytics (Basic)

### Purpose

Provide visibility into sales performance.

### MVP Reports

* Sales by customer
* Sales by item
* Open orders
* Delivered not invoiced
* Invoiced not delivered (flag)
* POS totals by day

### Permissions

* `selling.reports.view`

### User Stories

**B-SEL-080**

> As a manager, I want to view sales reports so that I can monitor revenue and customer activity.

---

## 6. Integration Contracts (Hard Requirements)

### Events emitted (Selling → Worker → projections/notifications)

* `selling.so.submitted`
* `selling.delivery.posted`
* `selling.invoice.posted`
* `selling.credit_note.posted`
* `selling.pos.sale.posted`

Each event includes:

* orgId, customerId
* documentId, documentType
* totals (net, tax, gross)
* stock impact summary (items, qty)
* accounting impact summary (accounts touched)
* actor + correlationId

### Posting rules (MVP recommended)

* **Delivery posted**:

  * Creates stock issue transactions for stock items
* **Invoice posted**:

  * Creates AR + Revenue + Tax entries
  * Creates COGS + Inventory reduction for stock items
* **Credit note posted**:

  * Reverses AR/Revenue/Tax
  * Restores inventory + reverses COGS when stock return

---

## 7. Definition of Done (Selling MVP)

Selling is MVP-complete when:

* Customer master exists
* SO → Delivery → Invoice works end-to-end
* POS can create posted invoice
* Stock is reduced/increased properly for deliveries/returns
* Accounting entries are balanced, immutable, auditable
* No posted docs can be edited or deleted
* Basic reports are accurate
