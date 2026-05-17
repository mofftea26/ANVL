# AGENTS.md — ANVL Website / CMS Cursor Rules

This is the first file every Cursor agent must read before touching the ANVL codebase.

## Project identity
ANVL Athletics is a Lebanon-first premium bodybuilding gymwear brand. The brand direction is dark, premium, disciplined, forged, industrial, and warrior-inspired without becoming costume-like. Tagline: **Forged Under Pressure**. Drop 01 is **The Oath**.

Core brand tokens to preserve unless the CMS drop theme overrides them:
- black: `#0B0B0C`
- darkSteelGrey: `#1D1F21`
- washedCharcoal: `#34373A`
- graphite: `#5B5E61`
- bone: `#E7E4DF`
- heading font direction: bold condensed uppercase, e.g. Bebas Neue-style
- body font direction: clean modern sans, e.g. Manrope-style

The global brand logo in the header/footer must remain the official ANVL logo and must not be replaced per drop. Drop logos/emblems are campaign visuals only.

## Tech stack
- React + TypeScript
- TanStack Start with SSR
- TanStack Router
- TanStack Query for server state
- Zustand for local/client UI state
- GSAP for desktop/tablet animation only
- Future commerce backend: likely MedusaJS v2
- Current phase may use local/mock CMS adapters, but code must be written so a real backend can replace the adapter later.

## Non-negotiable engineering rules
1. Feature-based architecture.
2. Components stay presentational whenever possible.
3. Side effects live in hooks, route loaders, server functions, or data clients — not directly inside large UI components.
4. Keep React hooks rules strict: no conditional hooks, no hooks in loops, no hooks after early returns.
5. Use TypeScript strictly. Avoid `any` unless documented with a reason.
6. Use schema validation for external/CMS data.
7. Use TanStack Query for async server state and caching.
8. Use Zustand only for local UI state such as preview panel state, modals, drawer state, filters, and draft builder state.
9. Preserve SSR safety. Do not access `window`, `document`, `localStorage`, or GSAP during SSR. Gate client-only code.
10. Mobile-first. Mobile must be fast, clean, and low-animation. Desktop/tablet can have advanced GSAP storytelling.
11. Respect accessibility: keyboard navigation, focus states, semantic HTML, alt text, reduced motion, aria where useful, contrast, form labels.
12. Respect security: no secrets in frontend, sanitize rich text, validate uploads, protect admin routes later, do not trust client input.
13. Do not remove existing ANVL visual identity, GSAP direction, product/cart behavior, or SEO features without replacing them with a better equivalent.
14. Every task must update the affected docs in `/docs` and add an entry to `/docs/changelog.md`.

## Required docs to read by task type
- **Every task:** read `/docs/audit-2026-05-17.md` (active Phase A–J task list with stable finding IDs) and the matching `.cursor/rules/*.mdc` rule files. Reference the finding IDs (`SEC-04`, `PERF-02`, etc.) in commit messages and PR titles.
- Architecture or folder work: read `/docs/architecture.md`, `/docs/cursor-workflow.md`
- Landing page/drop work: read `/docs/features/drops-cms.md`, `/docs/features/acts-builder.md`, `/docs/design-system.md`
- Product/shop work: read `/docs/features/products-commerce.md`
- SEO work: read `/docs/features/seo.md`
- Auth/account/orders work: read `/docs/features/auth-accounts-orders.md`
- Backend/API work: read `/docs/backend-medusa-roadmap.md`
- Performance/security/a11y: read `/docs/performance-accessibility-security.md` plus `/docs/audit-2026-05-17.md` §2–§5

## Admin auth — locked
The admin gate (`src/features/admin/auth/**`) is a **temporary static `VITE_ANVL_ADMIN_*` env-file gate**, intentionally retained until a real auth provider lands (Phase J1). Do **not** refactor its auth model, change its storage strategy, or expand the surface in this phase. UI polish (focus trap, copy, error messages) is fine; semantics must not change. Hosted-demo blockers `SEC-01` / `SEC-02` / `SEC-03` / `SEC-11` live in `/docs/technical-debt.md`.

## Definition of done
A task is done only when:
- `pnpm verify` passes (`typecheck` + `test` + `build`).
- New behavior is covered by Vitest tests (unit and/or integration). See `/docs/audit-2026-05-17.md` Phase A1 and `.cursor/rules/50-testing.mdc`.
- It does not break SSR.
- It preserves mobile performance and accessibility (see `.cursor/rules/30-responsiveness-a11y.mdc`).
- It has clear data types and Zod schemas where external/CMS data is involved.
- It follows feature boundaries (`.cursor/rules/40-solid-maintainability.mdc`).
- `/docs/changelog.md` is updated.
- `/docs/audit-2026-05-17.md` task statuses are updated where applicable.
- For UI changes, a manual test note + screenshot/video is included in the PR.
