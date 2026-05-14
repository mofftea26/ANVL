# Changelog

Cursor agents must append every completed task here.

## Format
```md
## YYYY-MM-DD — Task title
- Summary:
- Files changed:
- Tests/manual checks:
- Notes/debt:
```

## 2026-05-14 — Core CMS/catalog Zod schemas and Drop 01 seed
- Summary: Added canonical Zod 4 schemas and inferred TypeScript types for drops, landing acts, catalog commerce products, SEO documents, money/media, navigation, and site settings; added validated seed for Drop 01 — The Oath and three catalog placeholders (Oversized Tee, Stringer, Compression Tee) using ANVL brand tokens.
- Files changed: `src/features/drops/**`, `src/features/landing/**`, `src/features/seo/**`, `src/features/products/schemas/commerce.schema.ts`, `src/features/products/types/commerce.types.ts`, `src/shared/schemas/**`, `src/shared/types/**`, `src/content/seed/drop-01-the-oath.seed.ts`, `docs/architecture.md`, `docs/changelog.md`, `docs/features/drops-cms.md`, `docs/features/acts-builder.md`, `docs/features/products-commerce.md`, `docs/features/seo.md`
- Tests/manual checks: `pnpm exec tsc --noEmit` (pass); `pnpm build` (pass). `pnpm test` reports no test files in the repository.
- Notes/debt: Storefront `Product` in `src/features/products/types/product.types.ts` remains the shop presentation model; canonical commerce document is `CatalogProduct` until adapters unify the two.

## 2026-05-14 — Add project documentation and agent prompts
- Summary: Added `AGENTS.md` at the repository root, populated `docs/` with core and feature documentation, and added the numbered Cursor prompt library under `docs/prompts/` per the documentation index.
- Files changed: `AGENTS.md`, `docs/README.md`, `docs/*.md` (core docs), `docs/features/*.md`, `docs/prompts/*.md`, `README.md`, `docs/changelog.md`
- Tests/manual checks: Verified file tree under `docs/` and `AGENTS.md` presence; no application code changes.
- Notes/debt: Brand PDF/DOCX assets were already present under `docs/`; new markdown files sit alongside them.
