# UI / UX TECHNICAL & DESIGN SPECIFICATION

**Product:** Obrtnica ERP
**Screen Type:** Primary Application Shell + Dashboard / Module Workspace
**Platform:** Web-first (responsive → desktop & tablet), mobile later via adaptive views

---

## 1. High-Level UI Architecture

This screen establishes the **global application shell** used across all ERP modules.

### Core Layout Regions

1. **Left Sidebar (Primary Navigation)**
2. **Top Bar (Context + Global Actions)**
3. **Page Header (Title + Tabs)**
4. **Content Grid (Dashboard / Module Body)**
5. **Floating / Contextual Actions**

This structure should be **shared across all modules** to ensure consistency.

---

## 2. Left Sidebar – Primary Navigation

### Purpose

* Persistent module navigation
* Organization-level scope
* Role-aware visibility

### Visual Characteristics

* Fixed width (≈ 260–280px)
* Dark background (near-black, #111–#151515)
* Icon + label per navigation item
* Active state highlighted (subtle purple accent)

### Observed Navigation Items

* Dashboard
* Računovodstvo (Accounting)
* Kupovina (Buying)
* Prodaja (Selling)
* POS
* Zalihe (Stock)
* Sredstva (Assets)
* Projekti (Projects)
* Postavke Obrtnice (Settings)
* Odjavi se (Logout – destructive)

### UX / Behavior Requirements

* **Permission-driven rendering**

  * Items hidden if user lacks permission
* **Expandable groups** (future-ready)

  * e.g. Accounting → Ledger, Taxes, Reports
* **Keyboard navigable**
* **Collapsible sidebar (desktop optional)**

### Technical Spec

* Component: `<AppSidebar />`
* State:

  * `collapsed: boolean`
  * `activeModule: string`
* Data source:

  * Permission catalog + module registry

---

## 3. Top Bar – Global Context & Actions

### Purpose

* Organization/user context
* Global actions (notifications, create)

### Visible Elements

* App logo (left)
* Notification bell
* User avatar + name + role
* Global “Create New” button

### UX Requirements

* Notifications:

  * Badge count
  * Dropdown panel
* User menu:

  * Profile
  * Organization switch (future)
  * Logout
* “Create New”:

  * Context-aware (module dependent)
  * Opens modal or dropdown

### Technical Spec

* Component: `<TopNav />`
* State:

  * `notifications[]`
  * `currentUser`
  * `currentOrg`
* Integration:

  * WebSocket / polling for notifications

---

## 4. Page Header – Contextual Controls

### Purpose

* Identify current view
* Provide intra-module navigation

### Elements Observed

* Page title (editable / dynamic)
* Inline input (possibly filter or name editor)
* Tab navigation (horizontal)

### Tabs

* Multiple tabs visible (overflow scrolling)
* Active tab indicated with purple underline

### UX Requirements

* Tabs are **route-driven**, not just state
* Overflow handling (horizontal scroll / dropdown)
* Tab visibility permission-aware

### Technical Spec

* Component: `<PageHeader />`
* Sub-components:

  * `<PageTitle />`
  * `<TabsNav />`
* Routing:

  * `/module/:moduleId/:tabId`

---

## 5. Content Area – Modular Grid System

### Purpose

* Display dashboards, reports, lists, forms

### Observed Layout

* Card-based grid
* Mixed card sizes
* Responsive columns
* Empty state placeholders visible

### Grid Characteristics

* Likely 12-column grid
* Cards span:

  * 3 cols (small)
  * 4 cols (medium)
  * 6 cols (large)
  * 12 cols (full-width)
* Vertical rhythm consistent

### UX Requirements

* Drag & drop reordering (future)
* Saved per user / per role (future)
* Loading skeletons
* Empty states

### Technical Spec

* Component: `<DashboardGrid />`
* Card abstraction:

  * `<WidgetCard />`
* Layout engine:

  * CSS Grid or GridStack (if drag/drop later)
* State persistence:

  * User preferences table

---

## 6. Cards / Widgets

### Purpose

* Present KPIs, charts, summaries, lists

### Visual Style

* Dark cards on dark background
* Rounded corners (≈ 12px)
* Subtle elevation (soft shadow)
* No hard borders

### States

* Loading
* Empty
* Error
* Interactive (click → drilldown)

### Technical Spec

* Base component:

  * `<Card />` (shadcn-based)
* Variants:

  * KPI
  * Chart
  * List
  * Action

---

## 7. Design System (Inferred)

### Color Palette

* Background: #0E0E0E – #141414
* Card surface: #1A1A1A – #202020
* Primary accent: Purple (#A855F7-ish)
* Text:

  * Primary: #FFFFFF
  * Secondary: #A1A1AA
  * Muted: #71717A
* Destructive: Red (#EF4444)

### Typography

* Sans-serif (Inter / Geist / similar)
* Clear hierarchy:

  * Page title
  * Section headers
  * Body
  * Meta text

### Iconography

* Line icons
* Consistent stroke
* Likely Lucide / Heroicons

---

## 8. Accessibility & UX Rules

### Accessibility

* Contrast AA minimum
* Keyboard navigation
* Focus rings visible
* Click targets ≥ 40px

### UX Rules

* No disabled actions → hide instead
* No silent failures
* Confirmation for destructive actions
* Optimistic UI where safe

---

## 9. State Management (Technical)

### Global State

* Auth
* Org context
* Permissions
* Navigation state

### Page State

* Filters
* Tab selection
* Pagination
* Sorting


---

## 10. Open Questions / Clarifications Needed

These cannot be safely inferred from the image:

1. **Is the dashboard customizable per user or fixed per role?**
- Fixed per role
2. **Are tabs meant to represent:**
   * Views - yes
   * Data subsets - no
   * Workflow stages - no
3. **Does “Create New” depend on current module or always global?**
- Depends on current module and tab
4. **Should the sidebar support multi-org switching now or later?**
- Later
5. **Are cards static or interactive (drilldowns, filters)?**
- Static
6. **Is this layout shared across mobile or will mobile use a different shell?**
- Mobile will use a different shell


## Implement App Shell Layout (Sidebar + Topbar + Header Tabs + Dashboard Grid)

### Goal

Implement the **Obrtnica ERP main app layout** exactly like the provided screenshot:

* Left **fixed sidebar** with module navigation
* Top **app bar** with notifications + user menu + “Create New” button
* Page header with **title** and **tab row**
* Main content area with **dashboard widget grid placeholders** (cards/skeleton blocks)
* Permission-driven visibility for navigation items and top actions
* Responsive behavior for smaller widths (sidebar collapses into drawer)

### Non-negotiables / Rules

* Use **existing project patterns** and **refactor minimally**.
* Use **shadcn/ui components via MCP registry**. If a component exists in shadcn registry, use it; only create custom components when needed.
* Keep styling consistent with project’s dark theme rules.
* Do NOT hardcode roles. Use **permissions** to determine visibility.
* Layout must be reusable across all modules (`/dashboard`, `/accounting`, `/buying`, `/selling`, etc.).
* Implement in a way that supports **web first** but is responsive for tablet widths.

---

## Step 0: Inspect Existing Repo

Before writing new code:

1. Search for existing layout/shell components: `AppShell`, `Sidebar`, `Topbar`, `DashboardLayout`, etc.
2. Check for:

   * Existing permission hooks (`usePermissions`, `can()`, `hasPermission()`, etc.)
   * Existing user/org context providers
   * Existing navigation config
3. Reuse what exists. Only create missing parts.

---

## Step 1: Create Layout Structure (Route Group)

### Files / Folders

Implement using Next.js App Router route groups:

* `apps/web/src/app/(app)/layout.tsx`

  * Wraps authenticated application routes
  * Uses `AppShell` component

* `apps/web/src/app/(app)/dashboard/page.tsx`

  * Renders the dashboard page using header + tab row + grid

If your repo already has route groups, fit into existing.

---

## Step 2: Implement `AppShell` Container

### Create:

`apps/web/src/components/shell/app-shell.tsx`

**Responsibilities**

* Renders 2-column layout:

  * Left `<AppSidebar />` fixed
  * Right main column:

    * `<TopNav />`
    * `<main>` content area

**Layout**

* Full height viewport
* Sidebar fixed width ~ 280px on desktop
* Main content scrolls (not the sidebar)
* Background dark, subtle borders

**Responsive**

* Below `lg` breakpoint:

  * Sidebar collapses into **Sheet** (drawer)
  * TopNav includes “menu” button to open sheet

---

## Step 3: Implement Sidebar Navigation

### Create:

`apps/web/src/components/shell/app-sidebar.tsx`

Use shadcn components:

* `Button`
* `ScrollArea`
* optionally `Separator`
* `Tooltip` (optional)
* icons from `lucide-react`

**Sidebar content**

* Brand/logo area at top (“OBRTNICA”)
* Navigation items (as in screenshot):

```ts
const NAV_ITEMS = [
  { label: "Dashboard", icon: "Heart", href: "/dashboard", permission: "app.dashboard.view" },
  { label: "Računovodstvo", icon: "LayoutGrid", href: "/accounting", permission: "accounting.view" },
  { label: "Kupovina", icon: "ShoppingBag", href: "/buying", permission: "buying.view" },
  { label: "Prodaja", icon: "HeartHandshake", href: "/selling", permission: "selling.view" },
  { label: "POS", icon: "CreditCard", href: "/pos", permission: "selling.pos.use" },
  { label: "Zalihe", icon: "Package", href: "/stock", permission: "stock.view" },
  { label: "Sredstva", icon: "Landmark", href: "/assets", permission: "assets.view" },
  { label: "Projekti", icon: "FolderKanban", href: "/projects", permission: "projects.view" },
];
```

* A separate section near bottom:

  * “Postavke Obrtnice” → `/settings` (permission `settings.view`)
  * “Odjavi se” → logout action (red)

**Permission enforcement**

* Implement `filterNavItemsByPermission(items, permissions)` using existing permission utility.
* If no permission utility exists yet, implement a small helper:

  * `hasPermission(permissionId: string): boolean`
  * Use your existing auth context to get `permissionIds: string[]`.

**Active state**

* Highlight active route:

  * Left accent border or purple underline
  * Active background slightly lighter
* Use `usePathname()` to detect active item

---

## Step 4: Implement Top Navigation

### Create:

`apps/web/src/components/shell/top-nav.tsx`

**Content (right aligned)**

* Notification bell icon button
* User avatar + name + role (dropdown)
* “Create New” button on the far right (blue, with `+` icon)

Use shadcn:

* `Button`
* `DropdownMenu`, `DropdownMenuItem`
* `Avatar`
* `Badge` (optional)
* `Separator`

**Behavior**

* “Create New” opens a dropdown:

  * context-aware items (for now just static list):

    * Create Sales Invoice
    * Create Purchase Invoice
    * Create Item
    * Create Project
  * Each item should be permission-gated (e.g. `selling.invoices.create` etc.)

**User dropdown**

* Profile
* Settings
* Logout

Logout should call existing logout procedure (tRPC) or route to `/logout` handler if exists.

---

## Step 5: Page Header + Tabs (Dashboard Example)

### Create:

`apps/web/src/components/shell/page-header.tsx`

**Header layout**

* Left: page title (“Add Title” placeholder)
* Optional inline input on right side (like screenshot — can be `Input`)
* Tabs row below title:

  * multiple “Tab Name” items
  * active tab has purple underline

Use shadcn:

* `Input`
* `Tabs` OR implement a custom tabs row (preferred if you want the exact underline look)
* `Button` or `Link`

**For MVP**

* Define dashboard tabs as:

  * Overview
  * Sales
  * Buying
  * Stock
  * Finance
  * Activity
    (Names can be placeholders)

Tabs should update URL query `?tab=overview` etc.

---

## Step 6: Dashboard Grid Placeholders

### Create:

`apps/web/src/components/dashboard/dashboard-grid.tsx`

Use a CSS grid that matches the screenshot:

* Multiple rows
* Mixed card sizes
* Cards are dark rectangles with rounded corners
* No content required yet, just placeholders

Example:

* Top row: 4 small cards
* Middle row: 2 large cards
* Next row: 1 extra-wide + 2 stacked small on right
* Last row: 4 small cards

Use shadcn:

* `Card` component
* Or `Skeleton` blocks inside cards

---

## Step 7: Styling Rules (Match Screenshot)

* Dark theme background for app shell
* Sidebar:

  * subtle border on the right
  * active state purple accent
* Main content:

  * large padding
  * cards have subtle shadow
  * consistent spacing
* Tabs:

  * purple underline on active tab
  * muted inactive tabs

Ensure typography matches:

* Title larger and bold
* Tabs smaller, muted

---

## Step 8: Acceptance Criteria (Must Pass)

* Sidebar exists and matches item list
* Active nav item is highlighted
* Items are hidden without permissions
* Top bar shows notification icon, user dropdown, Create New
* Create New dropdown items are permission gated
* Dashboard page has title + tab row + widget grid placeholders
* Responsive:

  * On smaller screens sidebar becomes a drawer
* Uses shadcn components where applicable

---

## Step 9: QA Checklist

* Test with a user that has all permissions → sees everything
* Test with restricted permissions → sees only allowed modules
* Confirm no module route is accessible if permission missing (middleware/guard already exists; if not, add route guard)
* Confirm layout is reused across all module routes under `(app)`

---

## Deliverables

* New reusable layout components:

  * `AppShell`, `AppSidebar`, `TopNav`, `PageHeader`, `DashboardGrid`
* Dashboard page wired to layout
* Permission-driven navigation + actions
* Responsive sidebar drawer
