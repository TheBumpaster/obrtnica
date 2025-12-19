# EPIC: Stock & Warehouse (Inventory Management)

## 1. Epic Purpose

The **Stock & Warehouse** epic tracks **physical inventory quantities and value**, and ensures:

* Accurate on-hand quantities
* Traceable stock movements
* Reconciliation between **physical stock and accounting value**
* A clean foundation for Selling, Buying, Assets, and Manufacturing (later)

> **Inventory is not just quantity — it is value in motion.**

---

## 2. MVP Scope (Strict)

### ✅ IN SCOPE (MVP)

* Item master
* Inventory tracking (on-hand)
* Stock transactions (in/out/adjustment/transfer)
* Stock reconciliation
* Warehouse configuration (basic)
* Inventory reports & analytics (basic)

### ❌ OUT OF SCOPE (MVP)

* Batch / lot tracking
* Serial numbers
* Expiry dates
* Multi-warehouse routing rules
* FIFO/LIFO valuation methods (use simple average for MVP)
* Manufacturing / BOM

---

## 3. Core Inventory Principles (Locked)

### 3.1 Inventory Is Event-Driven

* Inventory state is derived from **stock transactions**
* No direct mutation of “quantity on hand”
* Every change = transaction + audit

---

### 3.2 Accounting Integration (Mandatory)

Each stock transaction:

* Has a **financial impact**
* Emits accounting entries
* References source document (Buying, Selling, Adjustment)

---

### 3.3 Immutability

* Stock transactions cannot be edited or deleted
* Corrections happen via new transactions
* Reconciliation creates adjustment entries, not edits

---

### 3.4 Single Valuation Method (MVP)

* **Weighted average cost**
* Calculated at transaction time
* Stored per transaction (not recalculated historically)

---

## 4. Domain Model (Conceptual)

### Core Entities

* Item
* Item Category
* Warehouse
* Stock Transaction
* Stock Ledger (derived)
* Inventory Snapshot (derived)
* Stock Reconciliation

### Data Classification

| Entity              | Classification |
| ------------------- | -------------- |
| Item master         | INTERNAL       |
| Stock transactions  | CONFIDENTIAL   |
| Inventory valuation | CONFIDENTIAL   |
| Stock reports       | INTERNAL       |
| Audit metadata      | RESTRICTED     |

---

## 5. Functional Areas & Backlog

---

# 5.1 Item Management (Item Master)

### Purpose

Define *what* can be stocked.

### Requirements

* Item has:

  * Code (unique)
  * Name
  * Category
  * Unit of measure
  * Is stock item (boolean)
* Items can be:

  * Active / inactive
* Items used in transactions cannot be deleted

### Permissions

* `stock.items.manage`
* `stock.items.view`

---

### User Stories

**S-STK-001**

> As a warehouse manager, I want to create an item so that it can be tracked in inventory.

**S-STK-002**

> As a warehouse manager, I want to deactivate an item so that it cannot be used in new transactions.

**S-STK-003**

> As the system, I must prevent deletion of items that have stock transactions.

---

# 5.2 Warehouse Configuration

### Purpose

Define physical or logical storage locations.

### Requirements

* Organization can define:

  * One or more warehouses
* Warehouse has:

  * Name
  * Code
  * Status (active/inactive)
* One default warehouse required

### Permissions

* `stock.warehouses.manage`

---

### User Stories

**S-STK-010**

> As an organization admin, I want to create warehouses so that inventory can be stored logically.

**S-STK-011**

> As the system, I must ensure at least one active warehouse exists.

---

# 5.3 Inventory Tracking (On-Hand Quantity)

### Purpose

Know current stock levels.

### Requirements

* On-hand quantity is:

  * Derived from stock transactions
  * Per item per warehouse
* Negative stock:

  * Allowed in MVP (configurable later)
  * Must be flagged

### Permissions

* `stock.inventory.view`

---

### User Stories

**S-STK-020**

> As a warehouse user, I want to see current stock levels so that I can make operational decisions.

**S-STK-021**

> As the system, I want to flag negative stock so that discrepancies are visible.

---

# 5.4 Stock Transactions (Core Engine)

### Purpose

Record every movement of inventory.

### Transaction Types (MVP)

* Stock In (receipt)
* Stock Out (issue)
* Transfer (between warehouses)
* Adjustment (gain/loss)

### Requirements

Each transaction:

* Has type, date, warehouse(s)
* Has one or more item lines
* Is immutable once posted
* Emits:

  * Audit event
  * Accounting entries

### Permissions

* `stock.transactions.create`
* `stock.transactions.view`

---

### User Stories

**S-STK-030**

> As a warehouse user, I want to record stock receipt so that inventory increases correctly.

**S-STK-031**

> As a warehouse user, I want to record stock issue so that inventory decreases correctly.

**S-STK-032**

> As a warehouse user, I want to transfer stock between warehouses so that inventory is accurate per location.

**S-STK-033**

> As a warehouse manager, I want to record stock adjustments so that discrepancies are corrected transparently.

---

# 5.5 Inventory Valuation

### Purpose

Track inventory value for accounting.

### Requirements

* Each stock transaction line stores:

  * Quantity
  * Unit cost
  * Total value
* Weighted average cost recalculated per transaction
* Value changes must post accounting entries

### Accounting Impact

| Transaction | Accounting                          |
| ----------- | ----------------------------------- |
| Stock In    | Inventory ↑ / Payable or Clearing ↑ |
| Stock Out   | COGS ↑ / Inventory ↓                |
| Adjustment  | Inventory ↑↓ / Gain/Loss            |

---

### User Stories

**S-STK-040**

> As the system, I want to calculate inventory value per transaction so that accounting is accurate.

**S-STK-041**

> As an accountant, I want inventory valuation to reconcile with the general ledger.

---

# 5.6 Stock Reconciliation

### Purpose

Align system stock with physical count.

### Requirements

* Reconciliation:

  * Records counted quantity
  * Compares with system quantity
* Differences create:

  * Adjustment transaction
  * Accounting entries
* Reconciliation is auditable

### Permissions

* `stock.reconciliation.manage`

---

### User Stories

**S-STK-050**

> As a warehouse manager, I want to reconcile inventory so that physical and system stock match.

**S-STK-051**

> As the system, I want to generate adjustment entries from reconciliation differences.

---

# 5.7 Reports & Analytics (Basic)

### Purpose

Provide operational visibility.

### MVP Reports

* Stock balance by item
* Stock balance by warehouse
* Stock movement history
* Low stock list

### Requirements

* Reports are:

  * Read-only
  * Derived
  * Filterable

### Permissions

* `stock.reports.view`

---

### User Stories

**S-STK-060**

> As a manager, I want to view stock reports so that I can monitor inventory health.

---

# 6. Integration with Accounting (Hard Contract)

### Required Accounting Events

* `stock.receipt.posted`
* `stock.issue.posted`
* `stock.transfer.posted`
* `stock.adjustment.posted`

Each event must include:

* Org ID
* Source document ID
* Item(s)
* Quantity
* Value
* Actor

Accounting module **must not care** where the event came from.

---

## 7. Definition of Done – Stock & Warehouse (MVP)

Stock & Warehouse is MVP-complete when:

* Items and warehouses are configurable
* All stock movements go through transactions
* Inventory is derived, not mutated
* Accounting entries are generated for all movements
* Reconciliation works and is auditable
* No hard deletes exist
* Permissions fully enforced
