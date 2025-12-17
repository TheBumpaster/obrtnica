---
alwaysApply: true
---

- TypeScript must remain strict. Do not weaken tsconfig or relax compiler flags.
- Avoid `any`. If absolutely required at an adapter boundary, isolate it to a small area and add a comment explaining why.
- Do not use `@ts-ignore` / `@ts-expect-error` unless:
  - there is a clear justification comment, and
  - the usage is localized and unavoidable.
- Add explicit return types to exported functions that form public APIs (routers, services, adapters).
- Prefer `unknown` + runtime narrowing over `any`.
