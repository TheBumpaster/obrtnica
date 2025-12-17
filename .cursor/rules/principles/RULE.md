---
alwaysApply: true
---

- AI never invents new architecture unless the task explicitly says so.
- Prefer minimal diffs: change the smallest surface area possible to achieve the goal.
- No “quick fixes” that bypass types, validation, auth, multi-tenancy, or safety checks.
- Prefer refactor over duplication: reuse existing helpers/middleware/adapters.
- Keep changes scoped: one task = one concern. If touching >3 apps/packages, explain why in the PR summary.
- If unsure, stop and inspect existing patterns in this repo before adding new ones.
