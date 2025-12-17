---
alwaysApply: true
---

Drizzle schema organization must be consistent and scalable.

---

## 1) Single Source of Truth

- All Drizzle schemas must live in the designated schema location (preferred: `packages/db/src/schema`).
- Cursor must not create duplicate schemas across apps.

---

## 2) Domain-Based Structure (Required)

- Tables must be grouped by domain folder:
  - `auth/`, `tenant/`, `audit/`, `gdpr/`, `notifications/`, etc.
- Use one table per file.
- Export tables through `schema/index.ts` only.

---

## 3) Relations (Recommended)

- Relations must live in `packages/db/src/relations` (or a single `relations.ts` if small).
- Avoid circular imports; keep table definitions clean.

---

## 4) Schema Files Must Be Pure

Schema files must contain:
- table definitions
- enums
- relation definitions (if co-located)

Schema files must NOT contain:
- queries
- business logic
- API logic
- side effects

---

## 5) Migrations

- Schema changes must include a migration generated via drizzle-kit.
- Cursor must not modify existing migration history unless explicitly instructed.
- Migration changes must be documented in the task/PR summary.

---

## 6) Imports & Consistency

- All code must import schema via the canonical export module (e.g. `@repo/db/schema`).
- Cursor must not introduce ad-hoc relative imports to schema files from apps.
