---
alwaysApply: true
---

All user-facing features must maintain **Web and Desktop parity by default**.

---

## 1) Scope of This Rule

This rule applies to:
- `apps/web`
- `apps/desktop`

---

## 2) Default Requirement (Non-Negotiable)

For any backlog item that introduces or modifies a **user-facing feature**:

- The feature MUST be implemented in:
  - Web (`apps/web`)
  - Desktop (`apps/desktop`)

This includes:
- new screens
- new workflows
- user actions
- settings
- user-visible data changes

---

## 3) Acceptable Exceptions (Explicit Only)

A feature may be implemented in **only one platform** if and only if:

1) The backlog item explicitly states:
   - “Web-only” or “Desktop-Only”, OR

2) A documented exception exists in:
   - `docs/decisions/`

The exception document must include:
- why parity is not required
- whether the other platform will support it later
- any user impact

Silent or implicit exclusions are NOT allowed.

---

## 4) Platform-Specific UX Is Allowed

Parity does NOT mean identical UI.

Allowed:
- platform-appropriate layouts
- different navigation patterns
- conditional UI affordances

Required:
- same core capability
- same business rules
- same permissions and validation
- same API behavior

---

## 5) Shared Logic Expectations

To reduce duplication:
- Business logic must live in `packages/core`
- API contracts must be shared via tRPC
- Validation must come from `packages/validations`

UI apps may differ only in:
- presentation
- interaction patterns
- platform-specific integrations

---

## 6) Verification Requirement

For any user-facing backlog item, Cursor must state in the task/PR summary:

- Web implementation:
  - files/screens touched
- Desktop implementation:
  - files/screens touched

If parity is intentionally skipped:
- link to the explicit exception (backlog or decision doc)

---

## 7) Prohibited Actions

Cursor must NOT:
- implement a feature on Web and “leave Desktop for later”
- assume Desktop parity is optional
- hide missing Desktop functionality behind feature flags without documentation
- rely on Web as a substitute for Desktop

---

## 8) Completion Gate

A backlog item is **NOT DONE** unless:

- the feature exists on both Web and Desktop, OR
- a documented exception exists and is referenced

Failure to meet this rule invalidates the task completion.
