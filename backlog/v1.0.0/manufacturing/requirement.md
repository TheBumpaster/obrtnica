# EPIC: Manufacturing (Production Management)

## 1. Epic Purpose

The **Manufacturing** epic enables organizations to:

* Define how products are made
* Plan and execute production
* Track material, labor, and machine usage
* Control quality
* Capitalize production costs correctly
* Convert **raw materials → WIP → finished goods**

> Manufacturing is the **value-creation engine** of the ERP.

---

## 2. MVP Scope (Strict)

### ✅ IN SCOPE (MVP)

* Bill of Materials (BoM)
* Workstations
* Work Orders
* Job Cards (operations)
* Basic production planning
* Inventory integration (RM, WIP, FG)
* Quality control (pass/fail)
* Production cost posting
* Manufacturing reports

### ❌ OUT OF SCOPE (MVP)

* Multi-level MRP planning
* Capacity planning optimization
* Alternative BoMs
* Subcontracting
* Scrap optimization
* Advanced routing rules
* Predictive maintenance

---

## 3. Core Manufacturing Principles (Locked)

### 3.1 Production Is Document-Driven

Manufacturing operates through:

* BoM → Work Order → Job Cards → Production Posting

No direct stock mutations.

---

### 3.2 Inventory States Are Explicit

Inventory is always in one of:

* Raw Material (RM)
* Work In Progress (WIP)
* Finished Goods (FG)

Transitions are **audited stock transactions**.

---

### 3.3 Cost Is Accumulated, Not Estimated

Production cost includes:

* Material consumption
* Labor time (Projects)
* Machine cost (optional MVP-lite)

Cost flows:

> RM → WIP → FG → COGS

---

### 3.4 Immutability

* Posted production cannot be edited
* Corrections via adjustment work orders

---

## 4. Domain Model (Conceptual)

### Core Entities

* Bill of Materials (BoM)
* BoM Item
* Workstation
* Work Order
* Job Card (operation)
* Production Posting
* Quality Inspection
* Manufacturing Ledger (derived)

### Data Classification

| Entity           | Classification |
| ---------------- | -------------- |
| BoM              | INTERNAL       |
| Work orders      | CONFIDENTIAL   |
| Job cards        | CONFIDENTIAL   |
| Production costs | CONFIDENTIAL   |
| Reports          | INTERNAL       |
| Audit            | RESTRICTED     |

---

## 5. Functional Areas & Backlog

---

# 5.1 Bill of Materials (BoM)

### Purpose

Define **what is needed** to make a product.

### Requirements

* BoM defines:

  * Finished good item
  * Raw material items
  * Quantities
* BoM versioning:

  * Only one active BoM per item
* BoM used in production cannot be deleted

### Permissions

* `manufacturing.bom.manage`
* `manufacturing.bom.view`

### User Stories

**M-MFG-001**

> As a production planner, I want to define a bill of materials so that products can be manufactured consistently.

**M-MFG-002**

> As the system, I must prevent deletion of BoMs used in work orders.

---

# 5.2 Workstations

### Purpose

Represent **where** production happens.

### Requirements

* Workstation has:

  * Name
  * Code
  * Type (machine/manual)
  * Linked asset (optional)
* Workstations can be active/inactive

### Permissions

* `manufacturing.workstations.manage`

### User Stories

**M-MFG-010**

> As an operations manager, I want to define workstations so that production can be routed correctly.

---

# 5.3 Work Orders (WO)

### Purpose

Authorize and track production.

### Requirements

* Work order defines:

  * Product to manufacture
  * Quantity
  * BoM version
  * Target warehouse
* Status:

  * Draft → Released → In Progress → Completed → Closed/Cancelled
* Releasing a WO:

  * Reserves raw materials (optional, default off)

### Permissions

* `manufacturing.work_orders.manage`
* `manufacturing.work_orders.view`

### User Stories

**M-MFG-020**

> As a production planner, I want to create a work order so that manufacturing can be executed.

**M-MFG-021**

> As a production planner, I want to release a work order so that production can begin.

---

# 5.4 Job Cards (Operations)

### Purpose

Execute and track each production step.

### Requirements

* Job card includes:

  * Work order
  * Operation name
  * Workstation
  * Expected duration
* Job card states:

  * Pending → In Progress → Completed
* Job cards track:

  * Time spent (integrates with Projects)

### Permissions

* `manufacturing.job_cards.manage`
* `manufacturing.job_cards.execute`

### User Stories

**M-MFG-030**

> As a shop-floor user, I want to start and complete job cards so that production progress is tracked.

---

# 5.5 Material Consumption (RM → WIP)

### Purpose

Consume raw materials during production.

### Requirements

* Consumption:

  * Based on BoM quantities
  * Allows variance (MVP)
* Posting consumption:

  * Stock ↓ (RM)
  * WIP ↑ (value)

### Permissions

* `manufacturing.materials.consume`

### User Stories

**M-MFG-040**

> As the system, I want to consume raw materials during production so that inventory and WIP are accurate.

---

# 5.6 Production Completion (WIP → FG)

### Purpose

Create finished goods.

### Requirements

* Completing production:

  * Moves quantity from WIP → FG
  * Calculates final cost
* Posting creates:

  * Stock receipt for FG
  * WIP clearance accounting entry

### Permissions

* `manufacturing.production.complete`

### User Stories

**M-MFG-050**

> As a production manager, I want to complete a work order so that finished goods are created.

---

# 5.7 Quality Control

### Purpose

Ensure output meets standards.

### Requirements

* QC check:

  * Pass / Fail
  * Linked to work order
* Failed QC:

  * Blocks completion
  * Requires adjustment or rework (manual MVP)

### Permissions

* `manufacturing.quality.inspect`

### User Stories

**M-MFG-060**

> As a quality inspector, I want to approve or reject production output so that quality is enforced.

---

# 5.8 Production Planning (MVP-lite)

### Purpose

Provide basic scheduling visibility.

### Requirements

* View:

  * Open work orders
  * Workstation load (read-only)
* No auto-optimization in MVP

### Permissions

* `manufacturing.planning.view`

### User Stories

**M-MFG-070**

> As a planner, I want to see production schedules so that I can manage workloads.

---

# 5.9 Manufacturing Reports & Analytics

### Purpose

Understand efficiency and cost.

### MVP Reports

* Production output
* Material variance
* Labor time per work order
* Production cost per unit
* Scrap / rejection count

### Permissions

* `manufacturing.reports.view`

### User Stories

**M-MFG-080**

> As a manager, I want to view manufacturing reports so that production performance is measurable.

---

## 6. Accounting Integration (Hard Requirement)

### Cost Flow

| Step           | Accounting              |
| -------------- | ----------------------- |
| RM Consumption | Inventory RM ↓ / WIP ↑  |
| Labor Posting  | Labor Expense ↑ / WIP ↑ |
| Completion     | FG Inventory ↑ / WIP ↓  |
| Sale           | COGS ↑ / FG Inventory ↓ |

All entries:

* Balanced
* Period-aware
* Immutable
* Audited

---

## 7. Integration Contracts (Events)

### Events Emitted

* `manufacturing.work_order.released`
* `manufacturing.materials.consumed`
* `manufacturing.job_card.completed`
* `manufacturing.production.completed`
* `manufacturing.quality.failed`
* `manufacturing.quality.passed`

Each event includes:

* orgId
* workOrderId
* itemId
* quantities
* cost breakdown
* actor + correlationId

---

## 8. Definition of Done (Manufacturing MVP)

Manufacturing is MVP-complete when:

* BoMs define production inputs
* Work orders manage production lifecycle
* Job cards track execution & time
* Materials move RM → WIP → FG correctly
* Production cost is capitalized correctly
* Accounting reconciles WIP & inventory
* QC gates output
* Reports reflect real performance
