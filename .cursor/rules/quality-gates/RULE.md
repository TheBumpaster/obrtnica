---
alwaysApply: true
---

- Do not consider work “done” unless these pass locally (or in CI):
  - lint
  - typecheck
  - tests (unit + integration where applicable)
  - build (for touched apps/packages)
- Never merge/work around failing checks by weakening rules, disabling lint, or adding ignore directives.
- Any newly introduced module must have at least minimal tests or be explicitly marked as a follow-up task with rationale.
