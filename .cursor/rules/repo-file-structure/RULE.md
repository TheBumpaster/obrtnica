---
alwaysApply: true
---

This repository must maintain a predictable, scalable monorepo structure.
Cursor must follow these rules when creating or moving files.

---

## 1) Top-Level Directories (Canonical)

Only the following top-level directories should contain product code or specs:

- `apps/`        (runtime applications only)
- `packages/`    (shared libraries only)
- `backlog/`     (versioned requirements only)
- `docs/`        (documentation + compliance evidence)
- `scripts/`     (repo tooling scripts)
- `infra/`       (local/dev/prod infrastructure configs)

Cursor must not introduce new top-level directories unless explicitly instructed.

---

## 2) Apps vs Packages Boundary

- `apps/*` may depend on `packages/*`.
- `packages/*` must NEVER depend on `apps/*`.
- `apps/*` must not import from other `apps/*`.

Shared functionality must live in `packages/*`.

---

## 3) Backlog Rules

- All feature/bug work must be defined in `backlog/vX.Y.Z/<feature>/...`.
- Cursor must not implement work without a backlog item.
- Cursor must not modify backlog files unless explicitly instructed.

---

## 4) Documentation Rules

- Clarifications/questions must be documented in `docs/decisions/`.
- Requirement deviations/changes during execution must be documented in `docs/changes/`.
- System-level documentation belongs in `docs/architecture/` and `docs/runbook/`.
- Compliance evidence belongs in `docs/compliance/`.

---

## 5) File Placement Rules

- UI code goes only in:
  - `apps/client/**`

- API code goes only in:
  - `apps/api/**`

- Worker code goes only in:
  - `apps/worker/**`

- Drizzle schemas and DB client code go only in:
  - `packages/db/**`

- Domain/business logic goes only in:
  - `packages/core/**`

- Validation schemas go only in:
  - `packages/validations/**`

- Shared tRPC helpers/types go only in:
  - `packages/trpc/**`

Cursor must not scatter these concerns into unrelated directories.

---

## 6) Consistency & Minimal Diffs

- Prefer adding files into existing folders rather than creating new folder patterns.
- Do not introduce duplicate `utils/`, `helpers/`, or `common/` folders across the repo without strong justification.
- If new structure is required, document it in `docs/decisions/` with rationale.

---

## 7) Completion Gate

A task is NOT DONE if:
- files are placed outside the canonical structure
- boundaries between apps and packages are violated
- documentation paths required by rules are not respected
