# ANVL Website / CMS Project Overview

> Rewritten 2026-07-29 to describe the **current** architecture. The previous version of this
> file described a "drop-builder" CMS model (drops with lifecycle states, a Landing Page Act
> Builder, one active drop at a time) that was **torn down**. There is no `anvl_drops` table, no
> `/admin/drops` route, and no acts builder in the codebase today — see
> `docs/features/acts-builder.md` and `docs/features/drops-cms.md` for that removed system as
> historical record. This file was rewritten rather than banner-archived because the current
> architecture (below) can be stated accurately from `CLAUDE.md` and the real route tree.

## Goal

Build a premium, mobile-first ANVL Athletics website — a production-ready SSR storefront + admin
CMS on TanStack Start (React 19, Vite, TypeScript), deployed to Cloudflare Workers. The current
phase uses local/mock adapters where a real backend does not yet exist; the architecture is
designed so adapters can be swapped (to Supabase, Shopify, Medusa) without rewriting UI or route
code. The first drop is **Drop 01 — The Oath**.

The website must feel premium and cinematic on desktop/tablet, but fast and frictionless on
mobile.

## Main public pages (`src/routes/`)

1. Home (`/`) — renders the single active **code-owned landing page** (default: `the-oath`).
2. Shop (`/shop`) — product listing with filters/search, and product detail (`/shop/$slug`).
3. Size guide (`/size-guide`), care guide (`/care-guide`).
4. About (`/about`) — desktop "Forge Altar" 3D experience / normal mobile page.
5. Story (`/story`) — saga chapter shelf + book overlay.
6. Product passport (`/p/$token`) — QR scan target: claim flow / owner dossier / public
   authenticity view.
7. Public armory (`/armory/$handle`) — read-only shared Armory profile.
8. Auth: sign in, sign up, forgot/reset password, email verification, OAuth callback (`/auth/*`).
9. Account (`/account`): profile, addresses, settings, order history.
10. Cart (`/cart`) and checkout (`/checkout`, `/checkout/success`).
11. FAQ (`/faq`), contact (`/contact`), shipping (`/shipping`), returns (`/returns`).
12. Legal: privacy (`/privacy`), terms (`/terms`), cookie policy (`/cookie-policy`),
    accessibility (`/accessibility`).

## Admin CMS (`/admin/*`)

"ANVL Studio" — a categorized admin shell (8 categories: Dashboard, Design, Content, Commerce,
Passports, Gamification, Media, Settings) covering theme/fonts, landing content, About, Story,
Coming Soon, Legal, Support (FAQ/contact/shipping/returns/care/size), Shop Experience, per-product
PDP content, techpack ingestion, product passports (QR + editorial content), gamification rules,
media/assets, analytics & SEO tags, and settings. See `docs/features/admin-ui.md` for the full
route table and `docs/cms-architecture.md` for the data-flow architecture.

The CMS does **not** compose landing-page sections. Landing pages are static, code-owned React
components registered in `src/features/landingPages/registry.ts`; the CMS only picks which coded
page is active (`storefront_publication.active_landing_page_key`, fallback `the-oath`), assigns
media to code-defined asset slots, and supplies per-scene copy overrides that fall back to
designed defaults when blank.

## Core business behavior

- There is **one** landing page active at a time, chosen from the code registry (not a drop
  lifecycle) — see `docs/landing-pages.md`.
- The official ANVL logo in header/footer stays constant and never changes per landing page or
  campaign; drop-section visuals (e.g. campaign emblems) are scoped to that page's own sections.
- Products are managed via the commerce adapter (`CommerceClient`) — local/seed by default, or
  Shopify Storefront API when `VITE_SHOPIFY_*` env vars are set. Editorial PDP content
  (`pdp_content`) is authored separately in `/admin/products` and merged with commerce data at
  render time.
- Each physical unit can carry a **product passport** — a per-unit QR code registered and claimed
  through `/p/$token`, giving the owner an authenticity dossier, wear journal, and Armory
  progression (ranks, badges, Forge XP, challenges).
- Lebanon-first checkout: Lebanon supports cash on delivery and Whish Money. Outside Lebanon, card
  payment only when enabled.

## Backend

Supabase (auth, Postgres with RLS, storage) is the CMS + passport + gamification backend; commerce
data comes from local/seed adapters or Shopify depending on env configuration. See `CLAUDE.md`
("Current Stack", "Architecture Map", "Supabase Rules") for the authoritative, actively-maintained
description of the stack and schema, and `docs/backend-medusa-roadmap.md` for the forward-looking
commerce-backend plan.
