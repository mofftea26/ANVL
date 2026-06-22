# Prompt library index

Use prompts **one at a time** in separate Cursor chats unless the task is tiny. Read `AGENTS.md` first.

## Active prompts (current architecture)

| Prompt | Use when |
|---|---|
| [01-audit-current-app.md](./01-audit-current-app.md) | Codebase audit / inventory |
| [02-create-core-types-schemas.md](./02-create-core-types-schemas.md) | New Zod schemas / types |
| [03-runtime-clients-adapters.md](./03-runtime-clients-adapters.md) | Adapter / runtime client work |
| [04-refactor-public-layout-theme.md](./04-refactor-public-layout-theme.md) | Storefront layout / theme (global 15-token palette) |
| [12-shop-and-product-pages.md](./12-shop-and-product-pages.md) | Shop listing / PDP |
| [15-auth-account-orders-ui.md](./15-auth-account-orders-ui.md) | Customer auth / account UI |
| [16-checkout-region-payments.md](./16-checkout-region-payments.md) | Checkout / Lebanon payments |
| [17-admin-ux-declutter.md](./17-admin-ux-declutter.md) | Admin workspace shell / UX |
| [18-performance-pass.md](./18-performance-pass.md) | Bundle / performance pass |
| [19-accessibility-security-pass.md](./19-accessibility-security-pass.md) | A11y / security pass |
| [20-backend-plan-and-contracts.md](./20-backend-plan-and-contracts.md) | Backend contracts / roadmap |
| [supabase-cms-handoff.prompt.md](./supabase-cms-handoff.prompt.md) | Supabase CMS integration (verify against current `docs/features/supabase-cms.md`) |

## Archived prompts (drop-builder era — do not run)

These describe removed systems (`anvl_drops`, act presets, products CMS, SEO CMS). Kept for audit history only.

| Prompt | Was for |
|---|---|
| [05-drops-list-cms.md](./05-drops-list-cms.md) | Drops list CMS |
| [06-drop-editor-shell.md](./06-drop-editor-shell.md) | Drop editor shell |
| [07-acts-builder.md](./07-acts-builder.md) | Acts builder |
| [08-live-preview.md](./08-live-preview.md) | Drop live preview |
| [09-public-landing-renderers.md](./09-public-landing-renderers.md) | Public landing renderers |
| [10-active-drop-page.md](./10-active-drop-page.md) | Active drop page |
| [11-products-cms.md](./11-products-cms.md) | Products CMS |
| [13-seo-cms.md](./13-seo-cms.md) | SEO CMS |
| [14-header-footer-settings.md](./14-header-footer-settings.md) | Header/footer CMS |

**Current replacements:** `docs/landing-pages.md`, `docs/cms-architecture.md`, `docs/features/supabase-cms.md`.
