---
alwaysApply: true
---

- Any system-level change must update docs:
  - architecture overview (what/why)
  - runbook (how to run locally, how to debug)
  - events/contracts (new/changed event types)
- Prefer concise, actionable docs over long prose.
- Document failure modes and fallback behavior (e.g., Mongo down, queue down, provider failures).
