# ANVL Docs Index

Start here, then open only the docs needed for the task.

## Core docs
- `../AGENTS.md` — required global rules for every task.
- `project-overview.md` — product, brand, and UX vision.
- `architecture.md` — target frontend/backend architecture and folder structure.
- `design-system.md` — drop theme tokens, typography, components, and animation policy.
- `cursor-workflow.md` — how Cursor agents should work without burning context.
- `changelog.md` — every task must append changes here.
- `technical-debt.md` — known issues, compromises, and future work.

## Feature docs
- `features/drops-cms.md` — drop list, active/scheduled drops, theme activation, live preview.
- `features/acts-builder.md` — configurable landing-page acts and nature/preset/content rules.
- `features/products-commerce.md` — products, variants, inventory, pricing, discounts, shop/drop pages.
- `features/seo.md` — CMS-managed SEO, structured data, metadata, redirects.
- `features/auth-accounts-orders.md` — sign in/up, profile, addresses, orders, Lebanon payment logic.
- `backend-medusa-roadmap.md` — future database/API/Medusa integration plan.
- `performance-accessibility-security.md` — performance, WCAG, SSR, security checklist.

## Prompt library
Use the files in `/docs/prompts` one by one in separate Cursor chats/agents. Never give all prompts to the same agent unless the task is tiny.
