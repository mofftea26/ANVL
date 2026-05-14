# Prompt 02 — Create core CMS/product types and schemas

```txt
Before coding, read AGENTS.md, docs/architecture.md, docs/features/drops-cms.md, docs/features/acts-builder.md, docs/features/products-commerce.md, docs/features/seo.md.

Task: Create the core TypeScript types and runtime schemas for ANVL CMS.

Implement types and schemas for:
- Drop
- DropTheme
- DropBranding
- LandingAct
- ActNature
- ActAnimationConfig
- MediaAsset
- Product
- ProductVariant
- ProductOption
- Money
- SeoDocument
- NavigationItem
- SiteSettings

Use strict TypeScript. Use a schema validation library already in the project if present; otherwise add Zod only if it is not already installed and explain why.

Place code inside feature-based folders, for example:
- src/features/drops/types
- src/features/drops/schemas
- src/features/landing/types
- src/features/products/types
- src/features/seo/types
- src/shared/types

Add seed examples for Drop 01 — The Oath using ANVL brand colors and three product placeholders: Oversized Tee, Stringer, Compression Tee.

Do not build UI in this task.
Update docs/changelog.md and any affected docs.
```
