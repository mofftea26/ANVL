# AGENTS.md

## Cursor Cloud specific instructions

### Overview

ANVL Athletics Storefront — an SSR e-commerce app built with TanStack Start, TypeScript, and Vite. All commerce, CMS, analytics, and payment data is served by in-memory mock clients; no database or external services are required.

### Commands

See `package.json` scripts and `README.md` for full details. Quick reference:

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Dev server | `pnpm dev` (port 3000) |
| Typecheck | `pnpm typecheck` |
| Tests | `pnpm test` (vitest — no test files exist yet) |
| Build | `pnpm build` |

### Notes

- **pnpm version**: pinned to `10.28.0` via `packageManager` in `package.json`. Corepack handles this (`corepack enable` once).
- **sharp warning**: `pnpm install` warns about ignored build scripts for `sharp`. This only affects the `pnpm strip-brand-bg` utility script, not the dev server or build. If you need sharp, add it to `pnpm.onlyBuiltDependencies` in `package.json`.
- **No external services**: The app runs entirely on mock data. No database, Docker, or environment variables are needed.
- **No lint command**: There is no dedicated ESLint/lint script. Use `pnpm typecheck` for static analysis.
- **vitest exits 1 with no tests**: `pnpm test` exits with code 1 because no `.test.ts`/`.spec.ts` files exist yet. This is expected, not a failure.
