# Prompt 01 — Audit current ANVL app and create architecture map

Use this in a fresh Cursor chat.

```txt
Before coding, read AGENTS.md, docs/README.md, docs/architecture.md, docs/project-overview.md, and docs/cursor-workflow.md.

Task: Audit the current ANVL React + TanStack Start codebase.

I want you to inspect the existing routes, components, data fetching, CMS logic, product/cart logic, animations, SEO setup, top bar, footer, drop page, shop page, about page, size guide, and admin/CMS code.

Do not rewrite yet. Produce:
1. Current folder map.
2. Current public routes and admin routes.
3. What is hard-coded vs CMS-driven.
4. Where SSR risks exist.
5. Where browser-only code is used.
6. Existing animation files and how they load.
7. Existing product/cart flow.
8. Suggested refactor sequence with small tasks.
9. Files that should not be touched without caution.

Then update docs/technical-debt.md and docs/changelog.md with the audit summary.
Do not make big code changes in this task unless they are needed to add docs only.
```
