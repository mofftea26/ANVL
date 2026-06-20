# ANVL Docs Index

Start here, then open only the docs needed for the task.

## Core docs
- `../AGENTS.md` — required global rules for every task.
- `audit-2026-05-17.md` — full-app audit findings, phase tracker (A–J), and **closure status** for the 2026-05-17 hardening program.
- `project-overview.md` — product, brand, and UX vision.
- `architecture.md` / `frontend-architecture.md` — target architecture and folder structure.
- `project-map.md` — current folder/route map (post-cleanup source of truth).
- `cms-architecture.md` — current CMS surfaces, data flow, Supabase schema, admin layout shell.
- `landing-pages.md` — code-owned landing pages (`TheOathLanding`) + registry model.
- `design-system.md` — 15-token theme palette, typography, components, animation policy.
- `brand-guidelines.md` — brand identity, palette, fonts (Anton / Sora / Cinzel).
- `animation-guidelines.md` — GSAP / Framer / Lenis rules + The Oath cinematic motion.
- `backend-guidelines.md` / `performance-guidelines.md` — Supabase + performance/bundle rules.
- `cursor-workflow.md` — how Cursor agents should work without burning context.
- `changelog.md` — every task must append changes here.
- `next-steps.md` — prioritized task list. `technical-debt.md` — known issues and future work.

## Feature docs
- `features/drops-cms.md` — **DEPRECATED**: drop-builder CMS was removed (historical context only).
- `features/acts-builder.md` — **DEPRECATED**: configurable act/preset landing system was removed (historical context only).
- `features/products-commerce.md` — products, variants, inventory, pricing, discounts, shop pages.
- `features/seo.md` — CMS-managed SEO, structured data, metadata, redirects.
- `features/auth-accounts-orders.md` — sign in/up, profile, addresses, orders, Lebanon payment logic.
- `backend-medusa-roadmap.md` — future database/API/Medusa integration plan.
- `contracts/README.md` — index for typed HTTP contracts (`src/shared/api/contracts/`).
- `performance-accessibility-security.md` — performance, WCAG, SSR, security checklist.

## Tooling
- `tooling/router-repatch.md` — TanStack admin route tree post-process (`repatch-admin-route-tree.mjs`).

## Prompt library
Use the files in `/docs/prompts` one by one in separate Cursor chats/agents. Never give all prompts to the same agent unless the task is tiny.
