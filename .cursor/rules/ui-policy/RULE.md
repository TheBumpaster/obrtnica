---
alwaysApply: true
---

This rule governs **all UI-related work** in this repository.

UI quality, consistency, and maintainability are mandatory.
Cursor must follow this policy for every UI change.

---

## 1) Scope of This Rule

This rule applies to:
- `apps/web` (Next.js)
- `apps/desktop` (Electron renderer – React DOM)

---

## 2) UI Technology Baseline

- The primary UI system for web and desktop is **shadcn/ui**.
- Components must be installed and managed via **shadcn MCP** whenever possible.
- Hand-written UI components are allowed **only when**:
  - no suitable shadcn component exists, or
  - explicit customization beyond shadcn is required.

Cursor must not introduce alternative UI libraries (e.g. MUI, Ant, Chakra) unless explicitly instructed.

---

## 3) Mandatory Use of shadcn MCP

For UI backlog items in `apps/web` or `apps/desktop`:

- Cursor must **prefer shadcn MCP tools** to:
  - list available components
  - install components
  - scaffold blocks (forms, dialogs, layouts)

- Cursor must not copy-paste shadcn component code manually unless MCP is unavailable.

When MCP is used:
- Installed components must be documented in the implementation summary.
- Only required components should be installed (no bulk installs “just in case”).

---

## 4) UI Architecture Rules

- UI components must be:
  - presentational
  - stateless where possible
  - free of business logic

- Business logic must live in:
  - hooks
  - services
  - `packages/core`
  - tRPC procedures

- UI components must not:
  - access the database
  - contain domain rules
  - bypass API validation

---

## 5) Styling & Consistency

- Styling must follow the existing Tailwind/shadcn conventions.
- No inline styles unless unavoidable.
- No arbitrary design systems or custom CSS frameworks.
- Prefer composition of existing shadcn components over custom UI.

If visual changes affect layout, spacing, or behavior:
- They must be consistent across web and desktop where applicable.

---

## 6) Accessibility & UX Baseline

- All interactive elements must:
  - be keyboard accessible
  - have clear focus states
  - use semantic HTML via shadcn components

- Forms must:
  - show validation errors clearly
  - reflect backend validation messages accurately
  - not silently fail

Cursor must not ship UI that is visually functional but inaccessible.

---

## 7) Backlog-Driven UI Work

- UI changes must map to a backlog item.
- Cursor must not introduce UI features without a backlog file.
- Each UI backlog item must be implementable as:
  - one feature
  - one release note entry

If UI requirements are unclear:
- Cursor must stop
- Document the question in `docs/decisions/`
- Wait for clarification or record assumptions explicitly

---

## 8) Documentation & Traceability

For each UI backlog item, Cursor must be able to state:
- Which shadcn components were installed
- Which UI files were modified
- Which user-facing behavior changed

If a new UI pattern is introduced:
- Document it briefly in `docs/ui.md` or the relevant architecture doc.

---

## 9) Testing Expectations (UI)

- Critical UI flows must have at least one of:
  - component-level tests, or
  - integration tests covering the flow
- UI changes must not break existing tests.
- Visual-only changes must still pass typecheck and build.

---

## 10) Prohibited Actions

Cursor must NOT:
- Hand-roll replacements for existing shadcn components
- Introduce multiple UI patterns for the same interaction
- Add UI-only validation that contradicts backend validation
- Implement UI changes that expand feature scope

---

## 11) Final UI Quality Gate

A UI task is considered **DONE** only if:
- shadcn MCP was used where applicable
- UI follows existing patterns
- Accessibility and validation are respected
- Changes are documented and traceable to backlog
- Definition of Done is fully satisfied

If any of the above is missing, the UI task is **NOT DONE**.
