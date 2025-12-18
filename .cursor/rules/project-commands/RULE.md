---
alwaysApply: true
---

All implementation and verification work in this repository must use **project-defined commands**.
Cursor must not invent, assume, or replace commands with ad-hoc alternatives.

---

## 1) Single Source of Truth

- The canonical commands are the scripts defined in:
  - root `package.json`
  - app-level `package.json` files (if present)

If a needed command does not exist:
- Cursor must NOT guess.
- Cursor must propose adding a new script to root `package.json` (preferred) or the relevant app package.

---

## 2) Mandatory Verification Commands

Before marking any backlog item **DONE**, Cursor must ensure the relevant checks pass using the project scripts:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test` (when tests exist for touched areas)
- `pnpm test:integration` (when API/worker/db/queue behavior is affected)
- `pnpm build`

If the project provides `pnpm verify`, Cursor must use it as the default completion gate.

Cursor must not bypass checks by:
- disabling lint rules
- weakening tsconfig
- removing tests
- adding ignore directives to make checks pass

---

## 3) Local Infrastructure Commands

For any work that depends on services (Postgres, MongoDB, RabbitMQ), Cursor must use project scripts such as:

- `pnpm infra:up`
- `pnpm infra:down`
- `pnpm infra:reset`

Cursor must not recommend manual docker commands unless no project command exists.

---

## 4) Database & Migration Commands

For schema or data layer changes, Cursor must use project scripts such as:

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:studio`
- `pnpm db:reset`

Cursor must not suggest manual SQL execution unless explicitly required and documented.

---

## 5) App-Specific Dev Commands

When instructing how to run or test an app locally, Cursor must reference project scripts such as:

- `pnpm web:dev`, `pnpm web:build`
- `pnpm desktop:dev`, `pnpm desktop:build`
- `pnpm api:dev`, `pnpm api:build`
- `pnpm worker:dev`, `pnpm worker:build`

Cursor must not invent alternative run commands (e.g., `next dev`, `expo start`, `electron .`) unless no project script exists.

---

## 6) Backlog & Release Commands

If the project includes automation scripts, Cursor must prefer them:

- `pnpm backlog:validate`
- `pnpm release:notes`

Release notes generation must use the defined scripts when present.

---

## 7) Documentation Requirement

Any time Cursor references a command for developers to run, it must:
- use a project script name (preferred)
- keep instructions consistent with `docs/` runbook/commands documentation (if present)

If documentation is missing or out of date:
- Cursor must propose updating `docs/commands.md` or `docs/runbook.md`.

---

## 8) Prohibited Actions

Cursor must NOT:
- assume yarn/npm when the project uses pnpm
- introduce new command conventions without approval
- recommend “just run X directly” when a script exists
- silently add scripts without documenting them

---

## 9) Completion Gate

A task is **NOT DONE** unless:
- the relevant project commands have been executed (or explicitly instructed to be executed)
- results are consistent with Definition of Done
- any newly required commands are added as scripts (not left as tribal knowledge)
