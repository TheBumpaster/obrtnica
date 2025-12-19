# EPIC: Project (Project Essentials)

## 1. Epic Purpose

The **Projects** epic enables organizations to:

* Organize work into projects
* Track time spent by users
* Attribute cost and/or revenue to projects
* Support **time-based payouts and billing**
* Provide project-level reporting

> Projects answer the question:
> **“What did we work on, for whom, and what did it cost or earn?”**

---

## 2. MVP Scope (Strict)

### ✅ IN SCOPE (MVP)

* Project master
* Project membership & roles
* Time tracking
* Time-based payouts (internal or contractor)
* Project reports (time & cost)
* Accounting integration (labor cost)

### ❌ OUT OF SCOPE (MVP)

* Task management / kanban
* Project budgets & forecasting
* Milestone billing
* External client invoicing from projects (can link later to Selling)
* Resource planning
* Approval workflows (single-step approve in MVP)

---

## 3. Core Principles (Locked)

### 3.1 Project ≠ Task System

Projects are:

* Containers for work
* Cost & revenue attribution units
* Not task boards

---

### 3.2 Time Is a Financial Event

* Logged time:

  * Has a cost
  * May result in payout
  * May later be billed
* Approved time is **financially relevant**

---

### 3.3 Accounting Integration (Mandatory)

Approved time:

* Creates accounting entries
* Uses configured labor cost accounts
* Can be expensed or capitalized (flag-based, MVP = expense only)

---

### 3.4 Immutability

* Approved time entries cannot be edited
* Corrections via adjustments

---

## 4. Domain Model (Conceptual)

### Core Entities

* Project
* Project Member
* Project Role (lightweight)
* Time Entry
* Time Approval
* Time Payout
* Project Ledger (derived)

### Data Classification

| Entity          | Classification |
| --------------- | -------------- |
| Project master  | INTERNAL       |
| Time entries    | CONFIDENTIAL   |
| Payouts         | CONFIDENTIAL   |
| Project reports | INTERNAL       |
| Audit           | RESTRICTED     |

---

## 5. Functional Areas & Backlog

---

# 5.1 Project Master

### Purpose

Define and manage projects.

### Requirements

* Project has:

  * Name
  * Code (unique)
  * Description (optional)
  * Status (Active / On Hold / Closed)
  * Start date (optional)
  * End date (optional)
* Closed projects:

  * Do not accept new time entries

### Permissions

* `projects.manage`
* `projects.view`

---

### User Stories

**P-PRJ-001**

> As a project manager, I want to create a project so that work can be organized and tracked.

**P-PRJ-002**

> As a project manager, I want to close a project so that no new work can be logged.

---

# 5.2 Project Membership & Roles

### Purpose

Control who can work on a project.

### Requirements

* Project members are:

  * Organization users
  * Assigned to projects explicitly
* Project roles (MVP):

  * Manager
  * Contributor
  * Viewer
* Roles define:

  * Who can log time
  * Who can approve time

### Permissions

* `projects.members.manage`

---

### User Stories

**P-PRJ-010**

> As a project manager, I want to assign users to a project so that they can log time.

**P-PRJ-011**

> As the system, I must prevent non-members from logging time on a project.

---

# 5.3 Time Tracking (Core)

### Purpose

Capture work performed.

### Requirements

* Time entry includes:

  * Project
  * User
  * Date
  * Duration (hours/minutes)
  * Description (optional)
* Time entry states:

  * Draft
  * Submitted
  * Approved
  * Rejected
* Users can:

  * Create & submit time
  * Edit until submitted

### Permissions

* `projects.time.log`
* `projects.time.view`

---

### User Stories

**P-PRJ-020**

> As a contributor, I want to log time on a project so that my work is recorded.

**P-PRJ-021**

> As a contributor, I want to submit my time entries so that they can be approved.

---

# 5.4 Time Approval

### Purpose

Validate time before financial impact.

### Requirements

* Only approved time:

  * Can be paid out
  * Can be posted to accounting
* Approval:

  * Single-step (MVP)
  * By project manager
* Rejected time:

  * Can be edited and resubmitted

### Permissions

* `projects.time.approve`

---

### User Stories

**P-PRJ-030**

> As a project manager, I want to approve time entries so that only valid work is paid and expensed.

**P-PRJ-031**

> As the system, I must prevent unapproved time from being posted to accounting.

---

# 5.5 Time-Based Payouts

### Purpose

Pay internal staff or contractors based on time.

### Requirements

* Payout configuration:

  * Hourly rate per user OR per project
* Payout run:

  * Select approved time entries
  * Lock them
* Payout posting creates accounting entry:

  * Labor expense ↑
  * Payroll / Payables ↑

### Permissions

* `projects.payouts.manage`

---

### User Stories

**P-PRJ-040**

> As an admin, I want to generate payouts from approved time so that work is compensated correctly.

**P-PRJ-041**

> As the system, I must prevent double payout of the same time entry.

---

# 5.6 Accounting Integration (Labor Cost)

### Purpose

Ensure time has financial representation.

### Requirements

* Approved time generates:

  * Journal entry
* Default accounts:

  * Labor expense
  * Payroll clearing / AP
* Time posting:

  * Is auditable
  * Respects accounting periods

### Permissions

* System-driven (approval gated)

---

### User Stories

**P-PRJ-050**

> As an accountant, I want approved time to post to accounting so that labor cost is reflected in financials.

---

# 5.7 Project Reports & Analytics

### Purpose

Provide insight into project performance.

### MVP Reports

* Time by project
* Time by user
* Cost by project
* Approved vs unapproved time

### Permissions

* `projects.reports.view`

---

### User Stories

**P-PRJ-060**

> As a manager, I want to view project reports so that I can monitor effort and cost.

---

## 6. Integration Contracts (Hard Requirements)

### Events Emitted (Projects → Worker → Accounting/Reports)

* `projects.created`
* `projects.time.submitted`
* `projects.time.approved`
* `projects.payout.generated`
* `projects.time.posted_to_accounting`

Each event includes:

* orgId
* projectId
* userId
* time entry IDs
* hours
* monetary amounts (if applicable)
* actor + correlationId

---

## 7. Definition of Done (Projects MVP)

Projects is MVP-complete when:

* Projects can be created and managed
* Users can log and submit time
* Time approval works
* Payouts are generated correctly
* Labor cost posts to accounting
* No approved time can be edited
* All actions are audited
* Reports reflect accurate totals
