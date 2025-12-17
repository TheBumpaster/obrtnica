## 1. Core Product Principle

> **The Admin Panel is not a page.
> It is a permission-driven workspace shell that renders ERP modules dynamically.**

This means:

* No hardcoded menus per role
* No “admin vs user” UI forks
* UI = projection of **permissions + context**

---

## 2. Target Users (Personas)

| Persona                          | Description                                           |
| -------------------------------- | ----------------------------------------------------- |
| **Org Owner**                    | Full system visibility, governance, billing, security |
| **Finance Admin**                | Accounting, invoices, payroll, treasury               |
| **Operations Manager**           | Inventory, projects, workflows                        |
| **HR Admin**                     | Employees, contracts, attendance                      |
| **Auditor / Compliance Officer** | Read-only access to logs, reports                     |
| **Service Account**              | No UI access (API only)                               |

👉 **UI never references personas directly**
👉 Personas are emergent from permission sets

---

## 3. Platform Scope

| Platform    | Role                                                      |
| ----------- | --------------------------------------------------------- |
| **Web**     | Primary admin surface (full ERP)                          |
| **Desktop** | Web shell + native wrappers (same UI)                     |
| **Mobile**  | Operational subset (tasks, approvals, read-only insights) |

> Desktop = web build
> Mobile = adaptive projection, not a different product

---

## 4. High-Level UI Architecture

### 4.1 UI Layers

```
App Shell
 ├─ Identity Context (who am I, where am I)
 ├─ Permission Resolver
 ├─ Navigation Renderer
 ├─ Module Host
 │   ├─ ERP Modules
 │   └─ Settings / Governance
 └─ Global Systems (search, audit, notifications)
```

---

## 5. App Shell (Constant)

These elements **always exist**, regardless of permissions.

### 5.1 Top Bar (Global)

**Contents**

* Organization switcher
* Workspace switcher (optional)
* Global search
* Notifications
* User menu (profile, security, logout)

**Rules**

* No business actions here
* Context only

---

### 5.2 Side Navigation (Dynamic)

The sidebar is **fully permission-generated**.

#### Navigation Node Structure

```ts
{
  id: "accounting",
  label: "Accounting",
  icon: LedgerIcon,
  requiredPermissions: ["accounting.read"],
  children?: [...]
}
```

#### Rendering Rules

* Node visible if `ANY(requiredPermissions)`
* Node disabled if visible but missing `write` permissions
* Empty groups are hidden

---

## 6. ERP Module Taxonomy (Predefined)

These modules are **platform-defined and versioned**
(not user-created, not configurable)

### 6.1 Core ERP Modules

| Category       | Modules                                  |
| -------------- | ---------------------------------------- |
| **Finance**    | Accounting, Invoices, Payments, Treasury |
| **Operations** | Inventory, Assets, Projects              |
| **People**     | Employees, Contractors, Payroll          |
| **Sales**      | Customers, Orders, CRM                   |
| **Documents**  | Files, Contracts, Templates              |
| **Analytics**  | Reports, Dashboards                      |

---

### 6.2 Governance & Settings (Always Separated)

> Governance is **not an ERP module**

| Governance Area                  |
| -------------------------------- |
| Organization settings            |
| Workspaces                       |
| Roles & permissions              |
| Security & MFA                   |
| API tokens                       |
| Audit logs                       |
| Compliance & data classification |
| Billing                          |

---

## 7. Permission-Driven UI Rules (Critical)

### 7.1 Permission Categories

Permissions are **platform-owned**, already aligned with your RBAC:

```
accounting.read
accounting.write
accounting.export
security.manage
audit.read
billing.manage
```

---

### 7.2 UI Enforcement Rules

| Layer                 | Rule                              |
| --------------------- | --------------------------------- |
| **Navigation**        | Hide if no permission             |
| **Pages**             | Block route if missing permission |
| **Actions**           | Disable buttons if no write       |
| **Sensitive Actions** | Require step-up / MFA             |
| **Emergency Access**  | UI banner + restrictions          |

⚠️ **UI checks are advisory**
⚠️ **Backend enforcement is mandatory**

---

## 8. Module UI Structure (Standardized)

Every ERP module follows the same internal layout:

```
ModuleRoot
 ├─ Header (title, context actions)
 ├─ Filters / Scope selector
 ├─ Data View
 │   ├─ Table / Kanban / Timeline
 │   └─ Bulk actions
 ├─ Details Drawer / Page
 └─ Activity & Audit (read-only)
```

This guarantees:

* UX consistency
* predictable development
* shared components

---

## 9. Settings / Governance Workspace

This is **not just another menu item**.

### Governance Has:

* Stricter permission gates
* Mandatory audit logging
* MFA / step-up triggers
* Read-only modes for auditors

#### Governance Sections

```
Settings
 ├─ Organization
 ├─ Workspaces
 ├─ Roles & Permissions
 ├─ Security
 ├─ API & Integrations
 ├─ Audit Logs
 ├─ Compliance
 └─ Billing
```

---

## 10. Cross-Platform Behavior Rules

### 10.1 Web / Desktop

* Full module access
* Full CRUD
* Complex tables and workflows

### 10.2 Mobile

* Read-only by default
* Actions limited to:

  * approvals
  * acknowledgements
  * quick edits
* Governance mostly hidden

> Same permissions → different **UI affordances**, not different logic

---

## 11. Audit & Compliance UX

### 11.1 User-Visible Audit

* Show “last changed by / when”
* Show limited activity timeline per record

### 11.2 Admin Audit

* Full immutable audit log
* Filter by user, action, module
* Export guarded by permission

---

## 12. Non-Goals (Explicit)

To protect velocity, **we do NOT**:

* Allow users to create custom modules
* Allow UI-defined permissions
* Hardcode role names in UI
* Duplicate logic across platforms
* Build separate “admin apps”

---

## 13. MVP Scope (What to Build First)

### Phase 1 — Shell + Governance

* App shell
* Permission-based navigation
* Organization & roles UI
* Security settings
* Audit log viewer

### Phase 2 — First ERP Modules

* Accounting (read/write)
* Projects (basic)
* Documents

### Phase 3 — Expansion

* Inventory
* HR
* Analytics dashboards

---

## 14. Deliverables for Teams

### Product Team

* This document = UX contract
* Define module-level workflows only

### Design Team

* Design **one shell**
* Design **one module**
* Everything else derives

### Engineering Team

* Implement permission resolver once
* Implement module interface once
* Reuse everywhere

---

## 15. One-Sentence North Star

> **The ERP Admin Panel is a permission-driven operating system for business, not a collection of admin pages.**
