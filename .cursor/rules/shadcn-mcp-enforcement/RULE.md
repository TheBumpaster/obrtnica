---
alwaysApply: true
---

Client UI must use **shadcn/ui** as the primary component system and must leverage the **shadcn MCP server** for discovery and installation.

Applies to:
- apps/client (Next.js with Electron build target)

---

## 1) Mandatory MCP-First Workflow

For any UI work in `apps/client`, Cursor must follow this order:

1) **Search/List** the shadcn registry via MCP for an existing component/block that matches the need.
2) **Install** the component via MCP if it exists.
3) **Compose** and style using installed shadcn components.
4) Only if no suitable component exists, create a custom component.

Cursor must not copy/paste shadcn component source manually if MCP installation is available.

---

## 2) “Before Building a New Component” Requirement

Before creating any new reusable component under:
- `apps/client/components`
- `apps/client/src/app/**/components`
- `apps/client/src/features/**/components`
- shared component areas

Cursor must:
- check the shadcn registry (via MCP) for:
  - a matching component
  - a close equivalent that can be composed
  - a block pattern that can be adapted

If an equivalent exists:
- Cursor must use/compose shadcn components instead of creating a new base component.

If no equivalent exists:
- Cursor must document in the task/PR summary:
  - what was searched for
  - why shadcn components were insufficient
  - why a custom component is necessary

---

## 3) Consistency Best Practices (Required)

- Prefer composition of shadcn primitives over custom primitives.
  Example: compose `Dialog + Form + Button` rather than creating a new "Modal" primitive.

- Avoid introducing parallel design systems.
  Do not add other UI component libraries unless explicitly instructed.

- Keep custom components:
  - small
  - presentational
  - prop-driven
  - free of business logic

- If a custom component becomes widely reused:
  - treat it as a "project component"
  - document it in `docs/ui.md` (or create `docs/ui-components.md`)
  - ensure it wraps shadcn primitives rather than replacing them

---

## 4) shadcn Installation Discipline

- Install only the components required for the backlog item.
- Do not bulk-install unrelated components.
- Do not modify installed shadcn components unless necessary.
  - If modification is required, document why and keep diffs minimal.

---

## 5) Styling & Theming Rules

- Use Tailwind/shadcn conventions.
- Do not introduce one-off styling conventions that differ from existing patterns.
- Ensure consistent spacing, typography, and component variants across the app.

---

## 6) Verification & Reporting (Mandatory)

For any UI backlog item, Cursor must include in the summary:

- Which shadcn components/blocks were installed via MCP (list them)
- Which screens/features were changed
- Whether any custom components were created
  - and if yes, why shadcn registry did not satisfy the requirement

If this summary is missing, the task is NOT DONE.

---

## 7) Prohibited Actions

Cursor must NOT:
- create custom versions of components that exist in shadcn
- introduce a second component library
- add new primitives when shadcn already provides primitives
- bypass MCP checks and “just implement” a component from scratch

---

## 8) Completion Gate

A UI task is complete only if:
- MCP-first workflow was followed
- shadcn components were used wherever possible
- any custom component creation is justified and documented
- existing UI patterns remain consistent across the app
