---
alwaysApply: true
---

The Expo (React Native) app must follow a feature-oriented structure.

Applies to:
- apps/mobile

---

## 1) Required Folder Structure

- `app/` (routes only; must stay thin)
- `features/` (feature modules: screens/components/hooks)
- `components/` (shared presentational components)
- `api/` (tRPC client setup and API wiring)
- `hooks/` (shared UI hooks)
- `lib/` (UI utilities only; no domain/business rules)
- `offline/` (local persistence and sync-related modules)
- `assets/` (static assets)

---

## 2) Separation of Concerns

- Route files under `app/` must only compose screens and layouts.
- Feature modules own their UI and UI state wiring.
- Business logic must not live in the mobile app:
  - place it in `packages/core`
  - or call it via tRPC APIs
- No direct database access from UI components.

---

## 3) Offline-Ready Design

- Any local persistence code must live under `offline/`.
- Sync orchestration must be isolated under `offline/sync/` (when added).
- Offline features must not bypass server-side validation, auth, or tenant scoping.

---

## 4) Consistency Requirements

- Avoid creating one-off folder patterns per feature.
- New features must be added under `features/<feature-name>/...`.
- Shared components must remain generic and reusable.
