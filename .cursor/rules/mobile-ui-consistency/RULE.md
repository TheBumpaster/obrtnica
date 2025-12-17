---
alwaysApply: true
---

Mobile UI (React Native / Expo) must use native primitives and consistent design patterns.

Applies to:
- apps/mobile

---

## 1) UI Foundations

- Use React Native primitives (`View`, `Text`, `Pressable`, etc.).
- Do NOT use web-based UI libraries or DOM abstractions.
- Avoid custom styling conventions per feature.

---

## 2) Component Discipline

- Prefer small, composable components.
- Avoid “mega components” that bundle layout + logic + styling.
- Business logic must not live in UI components.

---

## 3) Design Consistency

- Visual consistency with Web must be achieved via:
  - shared design tokens (colors, spacing, typography), or
  - documented mobile equivalents of Web patterns

- Do NOT attempt to reuse shadcn components directly.

---

## 4) Parity & Validation

- Mobile must expose the same core capabilities as Web.
- Validation and permissions must be enforced server-side.
- UI-only validation must not contradict backend rules.
