# Shadcn/UI Manual Setup Implementation Summary

**Date**: 2025-12-17  
**Scope**: apps/web, apps/desktop  
**Implementation**: Per-app component ownership

## Overview

Successfully implemented manual shadcn/ui setup for the monorepo following the official [manual installation guide](https://ui.shadcn.com/docs/installation/manual). Both `apps/web` (Next.js) and `apps/desktop` (Vite/Electron) now have full Tailwind CSS v4 + shadcn/ui infrastructure ready for component installation.

## Changes Made

### 1. Tailwind CSS v4 Installation

#### apps/web (Next.js)
- Installed dependencies:
  - `tailwindcss@^4.1.18`
  - `postcss@^8.5.6`
  - `autoprefixer@^10.4.23`
  - `@tailwindcss/postcss@^4.1.18`
  - `tw-animate-css@^1.4.0`
- Created `tailwind.config.ts` with Next.js content paths
- Created `postcss.config.mjs` using `@tailwindcss/postcss` plugin (required for Tailwind v4)
- Created `src/styles/globals.css` with full shadcn CSS variable theming
- Imported globals.css in `src/app/layout.tsx`

#### apps/desktop (Vite/Electron)
- Installed same dependencies as web
- Created `tailwind.config.ts` with Vite content paths
- Created `postcss.config.mjs` using `@tailwindcss/postcss` plugin
- Created `src/styles/globals.css` with identical shadcn CSS variable theming
- Imported globals.css in `src/main.tsx`

### 2. Shadcn Manual Dependencies

Installed in both apps:
- `class-variance-authority@^0.7.1`
- `clsx@^2.1.1`
- `tailwind-merge@^3.4.0`
- `lucide-react@^0.561.0`

### 3. CN Helper Utility

Created `src/lib/utils.ts` in both apps with the standard `cn()` helper:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 4. Path Aliases

#### apps/web
- Already had `@/* -> ./src/*` configured in tsconfig.json
- No changes needed

#### apps/desktop
- Added `baseUrl: "."` and `paths: { "@/*": ["./src/*"] }` to tsconfig.json
- Updated `vite.config.ts` to add matching alias resolution:
  ```typescript
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  }
  ```

### 5. Components.json Configuration

Created two `components.json` files to support both tooling scenarios:

#### Root `components.json` (for repo-root tooling and shadcn MCP)
- Points to `apps/web` paths
- Enables shadcn CLI and MCP to work from project root
- Style: `new-york`
- Icon library: `lucide`

#### apps/desktop/components.json (for desktop-specific tooling)
- Points to local desktop paths using `@/` aliases
- Enables shadcn CLI when working within apps/desktop
- Same style and icon library settings

### 6. Component Folders

Created empty UI component folders (ready for shadcn component installation):
- `apps/web/src/components/ui/`
- `apps/desktop/src/components/ui/`

## Verification Results

All Definition of Done gates passed:

✅ **Lint**: No errors or warnings  
✅ **Typecheck**: All TypeScript checks pass  
✅ **Test**: 31 tests passed (5 test files in packages/core)  
✅ **Build**: Both web and desktop apps build successfully  
✅ **pnpm verify**: Full verification suite passed  

## Key Implementation Notes

### Tailwind v4 PostCSS Plugin
The official Tailwind v4 requires `@tailwindcss/postcss` instead of the old `tailwindcss` PostCSS plugin. Both apps use the correct plugin configuration.

### CSS Variable Theming
Both apps use identical CSS variable definitions for:
- Light/dark mode tokens (`:root` and `.dark`)
- Design tokens (background, foreground, primary, secondary, etc.)
- Chart colors (chart-1 through chart-5)
- Sidebar tokens
- Radius tokens (sm, md, lg, xl)

### Per-App Ownership
Components will be duplicated per app rather than shared via a `packages/ui`. This approach:
- Simplifies the setup (no additional package wiring)
- Allows per-app customization if needed
- Maintains clear boundaries per the project's architectural rules

## Next Steps (Optional)

To prove the pipeline end-to-end, you can now:

1. Install a shadcn component (e.g., button):
   ```bash
   # From repo root (installs to apps/web):
   npx shadcn@latest add button
   
   # From apps/desktop:
   cd apps/desktop && npx shadcn@latest add button
   ```

2. Use shadcn MCP in Cursor to search and install components:
   - MCP will use the root `components.json` by default (web)
   - Desktop components require running commands from `apps/desktop/`

## Files Modified

### New Files
- `components.json`
- `apps/web/tailwind.config.ts`
- `apps/web/postcss.config.mjs`
- `apps/web/src/styles/globals.css`
- `apps/web/src/lib/utils.ts`
- `apps/desktop/components.json`
- `apps/desktop/tailwind.config.ts`
- `apps/desktop/postcss.config.mjs`
- `apps/desktop/src/styles/globals.css`
- `apps/desktop/src/lib/utils.ts`

### Modified Files
- `apps/web/src/app/layout.tsx` (added globals.css import)
- `apps/desktop/src/main.tsx` (added globals.css import)
- `apps/desktop/tsconfig.json` (added path aliases)
- `apps/desktop/vite.config.ts` (added resolve aliases, fixed import order)
- `apps/web/package.json` (added dependencies)
- `apps/desktop/package.json` (added dependencies)

## Compliance

- ✅ Follows shadcn manual installation guide
- ✅ Maintains monorepo architectural boundaries
- ✅ Per-app component ownership as specified
- ✅ Path aliases work correctly in both TS and bundlers
- ✅ Definition of Done fully satisfied
- ✅ All project verification scripts pass
