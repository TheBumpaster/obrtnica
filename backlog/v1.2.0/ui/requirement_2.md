You are implementing the **Admin Panel Workspace Shell** for a cross-platform ERP system.

### Non-negotiable principles

1. **Admin panel is not a page** — it is a **permission-driven workspace shell** that renders modules dynamically.
2. **No hardcoded menus per role**, no “admin vs user” forks.
   UI is a projection of **permissions + context**, not personas.
3. **Web + Desktop + Mobile must share the same functional surface area** for the shell (identity context, permission resolver, nav renderer, module host, global search/notifications scaffolding).
   Mobile is an **adaptive projection** (reduced affordances), but **NOT a different product**.
4. **Theme**: simple black/white, both light and dark mode are strictly inverted (no brand colors beyond grayscale). Typography/spacing can differ, but not the color philosophy.
5. Web + Desktop use **shadcn/ui**; Mobile uses **React Native primitives** styled to match the same design tokens.

### Repo constraints (must follow)

* Keep architecture boundaries: UI apps do UI; business logic stays centralized; do not duplicate permission logic differently per platform.
* Use the existing monorepo setup for shadcn in web/desktop (components per-app, already prepared) .
* If any audit/compliance UI is stubbed, ensure data sensitivity is respected and tagged (PUBLIC/INTERNAL/CONFIDENTIAL/RESTRICTED) per the platform vocabulary .

---

# Objective

Implement the **Workspace Shell** and its core UI framework across:

* `apps/web` (Next.js)
* `apps/desktop` (Electron/Vite, web shell)
* `apps/mobile` (Expo React Native)

So that each platform can:

* Resolve identity context (org/workspace/user)
* Resolve permissions (list of permission strings)
* Render dynamic navigation based on permissions
* Host modules via a standardized module interface
* Enforce permission gating at **navigation**, **routes/screens**, and **actions** (UI-only gates; backend remains source of truth)
* Provide a consistent look & feel in pure black/white light/dark

---

# Implementation Plan (do in this exact order)

## 0) Inventory & Safety Checks (read-only first)

1. Locate the existing app entrypoints and routing:

   * Web: Next App Router layout + routing structure
   * Desktop: renderer root and routing (React Router or equivalent)
   * Mobile: navigation stack (React Navigation)
2. Locate how auth/session is represented today (even if mocked).
3. Locate where permission strings are fetched (or if missing, implement a placeholder provider now).

**Do not refactor unrelated auth.** If permissions are not implemented yet, create a stub `PermissionProvider` that returns a static set, but keep a clean interface so later it can call API.

Definition of Done for step 0:

* You can render a “Shell Skeleton” page/screen in each platform without errors.

---

## 1) Define Shared Concepts (cross-platform contract)

Create a shared “contract” (types + module registry shape) in a shared package (or an existing shared package). You must not create a new architecture layer that violates repo boundaries.

### 1.1 Types

Implement these types (or equivalent) in a shared place:

* `Permission = string`
* `NavNode`:

  * `id: string`
  * `label: string`
  * `icon?: string | enum` (web/desktop can map to lucide; mobile can map to a local icon set)
  * `requiredPermissions: Permission[]`
  * `children?: NavNode[]`
  * `platforms?: ("web"|"desktop"|"mobile")[]` (optional; for mobile subset)
* `ModuleDefinition`:

  * `id: string`
  * `label: string`
  * `requiredPermissions: Permission[]` (for “enter module”)
  * `routes/screens`: platform-specific route definitions
  * `getNavNode(): NavNode` (or static mapping)

### 1.2 Permission semantics (must match spec)

* Node is **visible** if user has **ANY** of `requiredPermissions`.
* Node is **disabled** if visible but user lacks relevant `write` permission(s) (rules below).
* Empty groups are hidden.

Write permission heuristics:

* If a module has `*.read` and `*.write`, then:

  * Read-only users can open module, but action buttons are disabled.
  * Write users can perform mutations.

Definition of Done for step 1:

* Single source of truth types exist and are imported by all three apps.

---

## 2) Implement the Shell UI Layers (all platforms)

The shell has these layers:

```
App Shell
 ├─ Identity Context
 ├─ Permission Resolver
 ├─ Navigation Renderer
 ├─ Module Host
 └─ Global Systems (search, audit, notifications) [scaffold]
```

### 2.1 Identity Context Provider

Implement an `IdentityProvider` per platform that exposes:

* `activeOrgId`
* `activeWorkspaceId?`
* `user` minimal info (id, email/name)
* Switchers: `setActiveOrgId`, `setActiveWorkspaceId`

For MVP:

* If org/workspace data doesn’t exist yet, hardcode one org and one workspace but keep the switching API.

### 2.2 Permission Resolver Provider

Implement a `PermissionProvider` that exposes:

* `permissions: Permission[]`
* `isLoading`
* `refresh()`

MVP behavior:

* If API exists, call it; otherwise return a static set:

  * `["accounting.read","projects.read","documents.read","audit.read","security.manage","billing.manage"]`

### 2.3 Permission utility helpers

Create shared helpers:

* `hasAny(permissions, requiredPermissions)`
* `hasAll(...)`
* `canWrite(moduleId)` (heuristic based on `*.write`)
* `guardRoute(requiredPermissions)` (returns “allowed/denied”)

Definition of Done for step 2:

* Each platform can render a shell that knows “who am I / where am I / what can I do”.

---

## 3) Navigation Renderer (dynamic, permission-based)

### 3.1 Module taxonomy (predefined)

Implement module registry (predefined + versioned in code):

* Finance: Accounting, Invoices, Payments, Treasury
* Operations: Inventory, Assets, Projects
* People: Employees, Contractors, Payroll
* Sales: Customers, Orders, CRM
* Documents: Files, Contracts, Templates
* Analytics: Reports, Dashboards
  Governance workspace (separate):
* Organization settings, Workspaces, Roles & permissions, Security & MFA, API tokens, Audit logs, Compliance, Billing

### 3.2 Navigation data

Build a tree of `NavNode`s from the module registry.
Rules:

* Governance must appear as a separate section/group.
* Do not reference personas in code (no “Finance Admin” etc.).

### 3.3 Rendering per platform

* Web/Desktop: left sidebar (collapsible), groups + nested items.
* Mobile: bottom tabs OR drawer (choose whichever exists already), but:

  * show only operational subset (tasks/approvals/read-only insights)
  * hide most governance (unless permission is very high AND you have a “More” screen)
  * Still use the same permission logic and the same registry; only limit `platforms:["mobile"]`

Definition of Done for step 3:

* A user with only `projects.read` sees Projects only.
* A user with `security.manage` sees Governance → Security.
* No menu item is hardcoded for “role”; it’s always permission-driven.

---

## 4) Module Host + Standard Module Layout (MVP scaffolding)

Create a reusable module layout component per platform:

Module layout structure:

* Header (title, context actions)
* Filters/scope selector (scaffold)
* Data view (placeholder table/list)
* Details drawer/screen (placeholder)
* Activity & Audit panel (read-only placeholder)

### 4.1 Web/Desktop module scaffolds

For each module, create a route page that renders:

* ModuleShell + “Coming soon” + placeholder table
* At least one disabled action button that becomes enabled with `*.write`

Use shadcn components on web/desktop only:

* Sidebar/menu
* Buttons
* Dropdowns
* Sheet/Drawer
* Table skeleton
  (If a component doesn’t exist, check shadcn registry first; do NOT invent custom UI unless necessary.)

### 4.2 Mobile module scaffolds

Create screens using RN primitives:

* `View`, `Text`, `Pressable`, `FlatList`
* Implement a small shared “RN UI kit” inside mobile app: Button, Card, ListRow, Header
* Style it using the same tokens as web/desktop (next step).

Definition of Done for step 4:

* At least these modules have scaffold screens/routes across all platforms:

  * Projects
  * Documents
  * Governance → Roles & Permissions (view only)
  * Governance → Audit Logs (view only placeholder)
* Action gating works (write required enables CTA).

---

## 5) Permission Enforcement Layers (critical)

Implement all three layers everywhere:

1. **Navigation**

* Hide nodes when missing required permission(s).
* Disable node when only read is available but node includes write-only actions.

2. **Route/screen guard**

* Web: block navigation + show “Not authorized” page inside shell
* Desktop: same
* Mobile: same (screen that explains missing permission)

3. **Action gating**

* Buttons/CTAs disabled if missing `*.write`.
* Sensitive actions require step-up/MFA (scaffold only):

  * Show modal “Step-up required” if permission metadata says requiresMfa/requiresStepUp
  * No real MFA flow is required in this task; only the UI trigger/stub.

Definition of Done for step 5:

* Direct route navigation without permission shows blocked view (not blank).
* All mutation CTAs are disabled without write permission.

---

## 6) Look & Feel: Strict Black/White Inverted Theme

### 6.1 Token rules (single design system)

Create tokens that exist in all platforms:

* Background: white (light), black (dark)
* Foreground text: black (light), white (dark)
* Borders: subtle gray (light), subtle gray (dark) but still grayscale
* No color accents (no blue/gold/etc.). Only grayscale.

### 6.2 Web/Desktop (Tailwind + shadcn tokens)

* Ensure shadcn CSS variables are set to grayscale only (override if needed).
* Confirm both light and dark modes are perfect inverse.

### 6.3 Mobile theme

* Implement a `theme.ts` in mobile with the same tokens.
* Create `useTheme()` hook and style components from tokens, not inline random colors.

Definition of Done for step 6:

* Screenshots in light vs dark show perfect inversion (no stray colors).
* Buttons, borders, cards are readable and consistent across platforms.

---

## 7) Governance Workspace (scaffold with stricter behavior)

Implement a dedicated Governance section in nav + screens/routes:

* Organization
* Workspaces
* Roles & Permissions
* Security
* API & Integrations
* Audit Logs
* Compliance
* Billing

Rules:

* Governance is separated visually and in route namespace (e.g., `/governance/...`).
* Governance screens must show an “audit required” badge (UI-only).
* Where data classification is displayed (e.g., audit log entries), label them using the classification vocabulary and keep metadata minimal .

Definition of Done for step 7:

* Governance routes exist (placeholders), permission gated, consistent across platforms.

---

# Testing Checklist (must implement basic tests)

Add minimal tests per platform to prevent regressions:

### Shared unit tests

* `hasAny`, nav visibility, route guard decisions.

### Web/Desktop

* Render shell, verify:

  * Sidebar hides “Accounting” without `accounting.read`
  * “Projects” appears with `projects.read`
  * Action button disabled without `projects.write`

### Mobile

* Same logic tests; if UI tests are heavy, at least test the permission resolver + registry filtering.

---

# Final Acceptance Criteria

This task is complete only when:

1. Web, Desktop, Mobile all render the same **shell concept** (top bar/context + nav + module host).
2. Navigation is fully permission-driven (no role hardcoding).
3. Route guard + action gating works.
4. Theme is strict black/white inverted with no non-grayscale colors.
5. Governance workspace exists and is clearly separated.
6. Code is structured to avoid duplicating business logic across platforms.

---

# Common Cursor Mistakes to Avoid

* Do NOT create role-based menus. Only permissions.
* Do NOT duplicate separate nav trees per platform; use one registry with platform filtering.
* Do NOT introduce random colors or “brand accents”.
* Do NOT hardcode persona labels anywhere.
* Do NOT skip mobile parity; mobile must have the shell + module scaffolds too.
