# ANVL Docs Index

Start here, then open only the docs needed for the task. This index is rebuilt against the real contents of `docs/` — every `.md` file in the tree is listed below, grouped by purpose.

- `../AGENTS.md` — required global rules for every task.
- `../CLAUDE.md` — full project reference (stack, architecture, rules) for Claude Code.

## Architecture & conventions (maintained)

- `architecture.md` — target three-layer architecture (storefront/domain/data) and the client-abstraction pattern.
- `frontend-architecture.md` — three-layer feature-based architecture, module boundaries, dumb-UI/hooks/adapters split.
- `project-map.md` — annotated current folder/route map; update when structure changes.
- `project-overview.md` — original product/brand/UX vision brief (drop-based CMS goal).
- `cms-architecture.md` — current CMS surfaces, admin↔storefront data flow, Supabase schema, admin layout shell.
- `landing-pages.md` — code-owned landing page model (`TheOathLanding` + registry), replacement for the old drop-builder acts system.
- `design-system.md` — 15-token theme palette, typography, components, animation policy.
- `brand-guidelines.md` — brand identity, tagline, palette, fonts (Anton / Sora / Cinzel).
- `animation-guidelines.md` — GSAP / Framer / Lenis rules, motion philosophy, the particle-forge standard.
- `responsive-design-guidelines.md` — Tailwind v4 breakpoints and responsive rules.
- `backend-guidelines.md` — Supabase (DB/auth/storage) usage rules.
- `performance-guidelines.md` — performance philosophy and bundle/mobile targets.
- `performance-accessibility-security.md` — combined perf/WCAG/SSR/security checklist.
- `storefront-auth.md` — storefront customer auth (Supabase email/password + OAuth, mock fallback).
- `deployment.md` — Cloudflare Workers SSR deployment: `wrangler.jsonc`, Node ≥22.15, env split, custom domain.
- `cursor-workflow.md` — how Cursor/agent sessions should scope context and pick docs per task.
- `testing-checklist.md` — canonical manual CMS + storefront test checklist (batch 1 done; sections H–T await batch 2 — treat as in-progress, not historical).
- `technical-debt.md` — actively maintained list of known compromises and open follow-ups.
- `next-steps.md` — prioritized task list; update after completing tasks.
- `changelog.md` — append-only log; every task should add an entry.
- `audit-2026-05-17.md` — the original full-app audit (findings + phase tracker A–J); program status is **closed**, but finding IDs (`SEC-xx`, `PERF-xx`, …) are still referenced elsewhere as stable identifiers.

## Feature docs (`features/`)

- `features/admin-ui.md` — admin workspace shell (`AdminLayout`/`AdminWorkspace`/rail), sync indicator, sign-in flow. Its route table only covers the earliest 7 routes — see the root `README.md` for the current full admin route list.
- `features/products-commerce.md` — product model, variants/inventory/pricing, shop/PDP performance notes.
- `features/auth-accounts-orders.md` — sign in/up, forgot/reset password, profile, addresses, orders UX.
- `features/product-passport.md` — "The Forge Ledger": per-unit QR passport claim/ceremony flow, Armory ranks/badges, admin passport management.
- `features/techpacks.md` — supplier techpack PDF upload/parse/review, explicit import into passport/size-guide/PDP, disclosure redaction.
- `features/seo.md` — current SEO & analytics model, authored at `/admin/analytics` (not a `/admin/seo` route); notes the legacy `SeoDocument` schema as orphaned.
- `features/supabase-cms.md` — Supabase schema/RLS/sync/edge-functions backing the slim CMS.
- `features/shopify-commerce.md` — Shopify Storefront API as system of record for products/variants/inventory/cart/checkout, alongside Supabase CMS.
- `features/drops-cms.md` — **ARCHIVED.** Describes the removed multi-drop-builder CMS; kept only as historical context for old prompts/plans.
- `features/acts-builder.md` — **ARCHIVED.** Describes the removed configurable act/preset landing system; superseded by `landing-pages.md`.

## Backend & deployment

- `backend-shopify-roadmap.md` — current commerce plan: Shopify for products/cart/checkout, Supabase CMS for drops/theme/SEO. Supersedes the Medusa-first draft for commerce.
- `backend-medusa-roadmap.md` — earlier Medusa-first backend/API plan; superseded by `backend-shopify-roadmap.md` for commerce (CMS-domain notes may still apply).
- `contracts/README.md` — index for the typed HTTP contract modules under `src/shared/api/contracts/` (CMS, products, auth, checkout/orders) and their conventions.
- `tooling/router-repatch.md` — why/how `scripts/repatch-admin-route-tree.mjs` post-processes `routeTree.gen.ts` for admin lazy routes.

## Prompt library

See [`prompts/README.md`](./prompts/README.md) for the full active-vs-archived prompt table. Prompts 01–04, 12, 15–20, and the Supabase CMS handoff prompt are current; prompts 05–11, 13–14 are **archived** (describe the removed drop-builder CMS) and must not be run.

---

## Historical / archived — not maintained, do not treat as current truth

The following describe completed migrations, superseded plans, or point-in-time snapshots. Numbers, statuses, and "current state" claims inside them may be stale — cross-check against the maintained docs above before relying on anything here.

### Audits (`audits/`) — point-in-time snapshot, 2026-07-05/06

A 14-phase full-platform audit, verified live against code + the Supabase project on the dates above. Superseded going forward by `technical-debt.md` / `next-steps.md` for anything still open.

- `audits/anvl-audit-plan.md` — the audit methodology and phase-completion record (how the audit was run).
- `audits/anvl-system-map.md` — architecture/codebase map as verified against live code + Supabase on 2026-07-05.
- `audits/anvl-security-audit.md` — Supabase security-advisor findings (RLS, RPCs, secrets, CSP/CSRF grep) as of Phase 4.
- `audits/anvl-database-audit.md` — live Supabase schema/policy/index/constraint inspection, Phase 4.
- `audits/anvl-storage-and-glb-audit.md` — GLB/media upload investigation and hardening, Phase 5.
- `audits/anvl-performance-audit.md` — bundle/memory/GSAP-Three.js profiling, Phase 8 (cross-ref Phase 9).
- `audits/anvl-test-matrix.md` — test coverage baseline (107 files / 646 tests) and gaps, Phase 11, no E2E framework.
- `audits/anvl-cleanup-register.md` — dead-code/unused-asset findings, Phase 12, each traced through imports before being marked confirmed.
- `audits/anvl-issue-register.md` — the single findings index (ID/severity/priority/fix/rollback) referenced by the other audit docs.
- `audits/anvl-remediation-roadmap.md` — consolidated remediation tracker across two fix rounds, Phase 13 (resolved items struck through, not deleted).
- `audits/anvl-phase-j-security-plan.md` — pre-launch hardening plan (CSP/CSRF done 2026-07-06; rate limiting on hold pending an Upstash-vs-alternative decision).

### Plans (`plans/`)

- `plans/2026-05-19-cms-migration-shopify.md` — phase-by-phase implementation plan for moving commerce truth to Shopify while keeping campaign CMS on Supabase; describes work now largely implemented (see `features/shopify-commerce.md` for current state).

### Superpowers plans/specs (`superpowers/`)

- `superpowers/plans/2026-05-20-cms-supabase-site-platform.md` — implementation plan: Supabase as CMS source of truth + full Site-section redesign + drop act GSAP animations.
- `superpowers/plans/2026-06-02-premium-cinematic-redesign.md` — implementation plan for the cinematic landing hero preset + premium nav/storefront redesign (pre-dates the code-owned landing-page model).
- `superpowers/plans/2026-07-28-guides-cms-nav-particles-plan.md` — implementation plan for the admin-nav responsiveness, size/care guide redesign + CMS, and unified ember-forge engine work; this one has already shipped (merged to `main` 2026-07-29 — see `changelog.md`), so it documents recently-completed work rather than a stale plan.
- `superpowers/specs/2026-07-28-guides-cms-nav-particles-design.md` — the paired design spec for the plan above (four workstreams, approved for planning).

### Other historical docs

- `cms-teardown-plan.md` — drop-builder → code-owned-landing-page teardown tracker; every listed phase is checked off done.
- `handoff-phase2-phase3.md` — a one-time cross-session handoff prompt for finishing drop-builder deletion + applying Supabase migrations; work described is complete.

### Brand source files (not docs)

- `ANVL_Athletics_Professional_Brand_Document.pdf` / `.docx` — the source brand document `brand-guidelines.md` was implemented from.
- `ChatGPT Image *.png` — reference images (not referenced by any doc content).
