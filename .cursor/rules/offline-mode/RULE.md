---
alwaysApply: true
---

- Offline support must be designed so core integrity remains in Postgres.
- Client offline persistence must not bypass server-side validation, auth, or tenant scoping.
- Sync/conflict strategy must be explicit per feature (at minimum version-based or last-write-wins).
- Any “offline-created” entities must use globally unique IDs and support reconciliation on sync.
- Offline features must fail safely: if sync is unavailable, users can continue offline without corrupting server state.
