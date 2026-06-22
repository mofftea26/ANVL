# Cursor Workflow

## How to use Cursor without burning context
1. Start every task with:
   - Read `AGENTS.md`.
   - Read the docs listed for this task (see `docs/README.md`).
   - Do not read unrelated docs unless necessary.
2. Ask Cursor to inspect the current code first.
3. Give one small implementation goal per chat.
4. Ask for complete files only for the files it touches.
5. End every task by updating `docs/changelog.md` and affected feature docs.

## Verification
- For a full pre-merge gate locally, run **`pnpm verify`** (`typecheck` + `test` + `build`).

## Standard task instruction block
Copy this into every Cursor chat before the specific task:

```txt
Before coding, read AGENTS.md and only the relevant docs for this task.
Respect the ANVL architecture, mobile-first behavior, SSR safety, feature-based structure, SOLID principles, strict TypeScript, and docs update rules.
Do not remove existing brand identity or animations unless replacing them with a better equivalent.
After finishing, update docs/changelog.md and any affected feature docs.
Provide a short summary of changed files and manual test steps.
```

## Agent sizing rule
If a task touches more than 8 files or more than 2 features, split it.

## Suggested task order (current architecture)

1. Audit and architecture map (`docs/project-map.md`, `docs/cms-architecture.md`).
2. Types/schemas (Zod for CMS, landing content, story).
3. Runtime client adapters (`loadStorefrontProjection`, commerce).
4. Landing page / The Oath work (`docs/landing-pages.md`, `oathBreakpoints.ts`).
5. Admin CMS surfaces (theme, fonts, assets, content, story).
6. Supabase sync / migrations (`docs/features/supabase-cms.md`).
7. Shop / PDP / cart / checkout.
8. Story saga (`/story`).
9. Auth / account (stubs → real backend).
10. Shopify commerce wiring (optional `VITE_SHOPIFY_*`).
11. Performance pass (`pnpm analyze`).
12. Accessibility pass.
13. Security / Phase J (production blockers).

> **Do not run archived prompts** in `docs/prompts/05–11`, `13–14` — they describe the removed drop-builder CMS.
