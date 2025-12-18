---
alwaysApply: true
---

UI apps must follow a clean, predictable architecture and file organization.

Applies to:
- apps/client (Next.js with Electron build target)

---

## 1) UI Folder Structure (Required)

UI code must be organized into these layers (names can vary slightly but purpose must match):

- `app/` or `pages/` (routing only)
- `features/` (feature modules: screens, flows, feature hooks)
- `components/` (reusable presentational components)
- `layouts/` (layout shells, navigation, page scaffolding)
- `hooks/` (UI hooks only: state wiring, query hooks, view models)
- `lib/` (UI-only utilities: formatting, small helpers; NO business rules)
- `styles/` (if needed)

Rules:
- Route files must be thin: compose feature components, no business logic.
- Feature modules own their UI, local hooks, and local components.
- Shared components must be generic and reusable.

---

## 2) Separation of Concerns (Non-Negotiable)

- Business logic must NOT live in UI apps.
- UI apps must not:
  - access Postgres/Drizzle/Mongo directly
  - contain permission logic beyond display concerns
  - implement domain rules (move to `packages/core`)

Allowed in UI:
- calling tRPC clients
- view-model style mapping of API data to UI needs
- presentation state (loading, error, UI-only filters)

---

## 3) Data Fetching Pattern (Consistency)

- Use a single consistent data-fetching approach per UI app.
- All API calls must go through the typed tRPC client.
- Prefer:
  - “container/feature component fetches data”
  - “presentational components receive props”
- Avoid “API calls scattered across leaf components”.

---

## 4) UI Changes Must Be Traceable

For every UI backlog item, Cursor must be able to state:
- which screens/features changed
- which shadcn components were installed/used (if applicable)
- what the user-visible behavior change is
