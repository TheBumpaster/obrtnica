---
name: Shadcn manual monorepo setup
overview: Set up Tailwind + shadcn/ui manual prerequisites for both apps/web (Next.js) and apps/desktop (Vite/Electron), using per-app component folders and configs while keeping changes minimal and monorepo-friendly.
todos:
  - id: tailwind-web
    content: Install and wire Tailwind + globals.css in apps/web (Next.js), import in layout.tsx.
    status: completed
  - id: tailwind-desktop
    content: Install and wire Tailwind + globals.css in apps/desktop (Vite), import in main.tsx.
    status: completed
  - id: shadcn-deps
    content: Install shadcn manual dependencies (cva/clsx/tailwind-merge/lucide-react/tw-animate-css) in both apps.
    status: completed
    dependencies:
      - tailwind-web
      - tailwind-desktop
  - id: cn-helper
    content: Add cn helper utils.ts in both apps and ensure tsconfig aliases match.
    status: completed
    dependencies:
      - shadcn-deps
  - id: components-json
    content: Add components.json (root for web tooling) + apps/desktop/components.json (desktop-local tooling).
    status: completed
    dependencies:
      - cn-helper
  - id: verify
    content: Run pnpm verify and smoke test web + desktop dev builds.
    status: completed
    dependencies:
      - components-json
---

# Plan: Install shadcn/ui (manual) in pnpm monorepo

## Context we discovered

- `apps/web` (Next.js 15) and `apps/desktop` (Vite + Electron) currently have **no Tailwind** and **no shadcn dependencies** wired.
- `apps/web/tsconfig.json` already has `@/*` path alias; `apps/desktop` does not.
- No `components.json` exists yet.

We’ll follow the shadcn/ui manual installation guidance ([manual installation doc](https://ui.shadcn.com/docs/installation/manual)) and adapt it to a monorepo with **per-app** component ownership.

## Decisions (based on your answers)

- Scope: **apps/web + apps/desktop**
- Ownership: **per-app** (each app has its own `components/`, `lib/utils.ts`, and shadcn config)

## Implementation steps

### 1) Add Tailwind CSS to each app

- **apps/web**
- Install Tailwind + PostCSS wiring appropriate for Next.js.
- Add a global stylesheet at [`apps/web/src/styles/globals.css`](apps/web/src/styles/globals.css) (using the CSS variables + `tw-animate-css` pattern from the manual doc).
- Import the stylesheet from [`apps/web/src/app/layout.tsx`](apps/web/src/app/layout.tsx).

- **apps/desktop**
- Install Tailwind + PostCSS wiring appropriate for Vite.
- Add [`apps/desktop/src/styles/globals.css`](apps/desktop/src/styles/globals.css).
- Import it from [`apps/desktop/src/main.tsx`](apps/desktop/src/main.tsx).

Notes:

- We’ll keep Tailwind setup minimal and aligned with the shadcn manual doc’s styling approach (`@import "tailwindcss";`, `@import "tw-animate-css";`, CSS variables).

### 2) Install shadcn manual dependencies in each app

Per the manual doc, add these dependencies in **each** app:

- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `lucide-react`
- `tw-animate-css`

(Plus Tailwind/PostCSS dependencies from step 1.)

### 3) Add the `cn` helper in each app

Create the shared helper from the manual doc:

- [`apps/web/src/lib/utils.ts`](apps/web/src/lib/utils.ts)
- [`apps/desktop/src/lib/utils.ts`](apps/desktop/src/lib/utils.ts)

### 4) Ensure path aliases work (TS + bundlers)

- **apps/web**
- Already has `@/* -> ./src/*` in [`apps/web/tsconfig.json`](apps/web/tsconfig.json); verify it matches the `components.json` aliases.

- **apps/desktop**
- Add TS path alias `@/* -> ./src/*` in [`apps/desktop/tsconfig.json`](apps/desktop/tsconfig.json).
- Add matching Vite alias in [`apps/desktop/vite.config.ts`](apps/desktop/vite.config.ts) so runtime imports resolve.

### 5) Add shadcn `components.json`

Because this is a monorepo and you chose “per-app”, we’ll do:

- **Root `components.json` targeting web**, to support running shadcn tooling from the repo root (including shadcn MCP in Cursor):
- [`components.json`](components.json)
- Points `tailwind.css` to `apps/web/src/styles/globals.css`
- Aliases map to `apps/web/src/components`, `apps/web/src/lib/utils`, etc.

- **Desktop-local `components.json`** for desktop-specific generation when working inside that folder:
- [`apps/desktop/components.json`](apps/desktop/components.json)
- Points `tailwind.css` to `apps/desktop/src/styles/globals.css`
- Aliases map to `apps/desktop/src/components`, `apps/desktop/src/lib/utils`, etc.

### 6) Create the shadcn component folders

- [`apps/web/src/components/ui/`](apps/web/src/components/ui/)
- [`apps/desktop/src/components/ui/`](apps/desktop/src/components/ui/)

(Empty initially; populated when you add shadcn components.)

### 7) Validate with repo scripts (Definition of Done gate)

Run:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm verify`

If either UI app has additional checks, run those via existing scripts (e.g. `pnpm web:build`, `pnpm desktop:build`).

### 8) Smoke test

- Run `pnpm web:dev` and confirm Tailwind styles apply (background/text tokens + typography).
- Run `pnpm desktop:dev` and confirm Tailwind styles apply.

### 9) (Optional follow-up) Add one shadcn component to prove the pipeline

After install is green:

- Add `button` (or `card`) and render it in:
- [`apps/web/src/app/page.tsx`](apps/web/src/app/page.tsx)
- [`apps/desktop/src/App.tsx`](apps/desktop/src/App.tsx)

We’ll only do this if you want a quick end-to-end validation beyond “Tailwind loads”.

## Primary files we expect to touch

- [`components.json`](components.json)
- [`apps/desktop/components.json`](apps/desktop/components.json)
- [`apps/web/src/styles/globals.css`](apps/web/src/styles/globals.css)
- [`apps/desktop/src/styles/globals.css`](apps/desktop/src/styles/globals.css)
- [`apps/web/src/app/layout.tsx`](apps/web/src/app/layout.tsx)
- [`apps/desktop/src/main.tsx`](apps/desktop/src/main.tsx)
- [`apps/desktop/tsconfig.json`](apps/desktop/tsconfig.json)
- [`apps/desktop/vite.config.ts`](apps/desktop/vite.config.ts)
- [`apps/web/src/lib/utils.ts`](apps/web/src/lib/utils.ts)
- [`apps/desktop/src/lib/utils.ts`](apps/desktop/src/lib/utils.ts)

## Risks / gotchas to watch

- **Alias mismatch** between TS and Vite/Next can break imports (`@/lib/utils`).
- **Tailwind config differences** between Next and Vite: we’ll keep the setup explicit and verified by running each app.
- **Multiple `components.json`**: root one is for tooling from repo root; desktop one is for tooling from within `apps/desktop`.