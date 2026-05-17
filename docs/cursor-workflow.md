# Cursor Workflow

## How to use Cursor without burning context
1. Start every task with:
   - Read `AGENTS.md`.
   - Read the docs listed for this task.
   - Do not read unrelated docs unless necessary.
2. Ask Cursor to inspect the current code first.
3. Give one small implementation goal per chat.
4. Ask for complete files only for the files it touches.
5. End every task by updating docs/changelog.

## Verification
- For a full pre-merge gate locally, run **`pnpm verify`** (`typecheck` + `build`).

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

## Best order
1. Audit and architecture map.
2. Types/schemas.
3. Runtime client adapters.
4. Drop CMS list.
5. Drop editor shell.
6. Acts builder.
7. Live preview.
8. Theme activation.
9. Products CMS.
10. Shop/drop pages.
11. SEO CMS.
12. Header/footer settings.
13. Auth/account pages.
14. Checkout region/payment logic.
15. Performance pass.
16. Accessibility pass.
17. Security pass.
