# Next Steps

Prioritized recommended tasks for ANVL Athletics development. Update this file after completing tasks.

---

## Priority 1: Production Blockers (Phase J)

These are **required before any public launch**. Do not launch without them.

| Task | Effort | Risk if skipped |
|---|---|---|
| Real server auth with HttpOnly cookies | High | Admin accounts vulnerable to XSS-based token theft |
| CSP (Content Security Policy) headers | Medium | XSS attack surface remains open |
| HSTS headers | Low | SSL stripping attacks possible |
| Rate limiting on auth endpoints | Medium | Brute-force admin login possible |
| Rate limiting on forms (waitlist, contact) | Medium | Spam/abuse |
| Server-side upload validation (type, size, MIME) | Medium | Malicious file upload possible |
| CSRF protection on state-mutating endpoints | Medium | Cross-site request forgery |

Tracked under finding IDs `SEC-01`, `SEC-02`, `SEC-03`, `SEC-11` in `docs/audit-2026-05-17.md`.

---

## Priority 2: Commerce Wiring

These turn the storefront from a demo into a functional store.

| Task | Effort | Notes |
|---|---|---|
| Connect Shopify Storefront API | Medium | Set `VITE_SHOPIFY_*` env vars + test `createCommerceClient` Shopify adapter |
| Real product images | Low | Replace `placeholder-product.svg` with AVIF/WebP product photography |
| Add-to-cart → checkout end-to-end | High | Needs Shopify cart API or Medusa cart; mock gateway only for dev |
| Payment gateway integration | High | Tap Payments or NetCommerce for Lebanon market |
| Order confirmation email | Medium | Triggered on order placement |
| Inventory/sold-out handling | Medium | Show sold-out state on PDP and product cards |

---

## Priority 3: Feature Boundary Cleanup (Phase D)

Move CMS read surfaces out of `features/admin/**` into `features/cms/**` and `features/drops/**` so the storefront bundle does not depend on admin modules. Currently a known risk (MAINT-02, PERF-03).

Steps:
1. Grep for storefront imports of `src/features/admin/**`
2. Extract shared types and read facades to `src/features/cms/**`
3. Update imports
4. Run `pnpm analyze` to confirm storefront bundle no longer contains admin code
5. Run `pnpm verify`

---

## Priority 4: Supabase Media Library

| Task | Notes |
|---|---|
| Wire `cms_media_assets` to Supabase Storage bucket | Migration exists; need storage bucket policies + upload flow |
| Connect media picker in admin to real Supabase URLs | Currently picks from local/manual URLs |
| Image optimization pipeline | Resize + AVIF/WebP conversion on upload (Edge Function or Supabase transforms) |

---

## Priority 5: Product + PDP Polish

| Task | Notes |
|---|---|
| Product photography (real images) | Brand-consistent shots on dark industrial backgrounds |
| PDP size guide integration | Link from PDP to `/size-guide` with size chart per product |
| Video embeds for products | `videoEmbed.ts` exists; wire to CMS product editor |
| Related products | `getRelatedProducts()` is stubbed; implement logic |
| Product variants (color/size) | Matrix exists in `products.matrix.ts`; needs full PDP integration |

---

## Priority 6: Drop 01 Launch Readiness

| Task | Notes |
|---|---|
| Finalize The Oath drop content | Verify all acts, copy, and product assignments in admin |
| Test full publish flow (local → Supabase) | Verify `cms_publish_drop()` RPC → storefront reads correctly |
| OG image for The Oath | `og-default.svg` exists; make a drop-specific one |
| Countdown timer for release date | `CountdownTrioReveal` preset exists; configure release date |
| Waitlist email collection | `MinimalWaitlistForm` / `OathFullWidthForm` exist; wire to email service |

---

## Priority 7: Account / Auth UX

| Task | Notes |
|---|---|
| Sign in / sign up polish | Auth routes exist; test Supabase auth flow end-to-end |
| Customer account page | Route exists; needs real data from commerce backend |
| Order history | Needs commerce backend (Shopify or Medusa) |
| Saved addresses | Needs commerce backend |

---

## Priority 8: SEO and Marketing

| Task | Notes |
|---|---|
| Sitemap generation | `public/sitemap.xml` is static; generate dynamically from active products/drops |
| Product structured data | JSON-LD exists; verify all PDP routes emit correct `Product` schema |
| OG images for all routes | Products, drop, about, shop |
| Analytics wiring | Replace `mockAnalyticsClient` with PostHog or Plausible |

---

## Priority 9: Phase E (Large File Splits)

Split oversized admin editor files (600+ lines) for maintainability. Tracked as MAINT-01.

Top candidates:
- `DropActsBuilderPanel.tsx` — split by tab into separate lazy components
- `DropEditorRoute.tsx` — extract subcomponents
- `ProductEditorRoute.tsx` — extract subcomponents

---

## Priority 10: DX / Reuse (Phase F)

- Add ESLint with `no-restricted-imports` to enforce feature boundaries at lint time
- Query key factories for all TanStack Query usages (currently some use bare string arrays — REU-14)
- Remove genuinely unused dependencies confirmed by `pnpm analyze` (PERF-11)
- Document reusable admin datetime helpers and centralize duplicates (REU-03)

---

## Deferred (No Active Timeline)

| Task | Notes |
|---|---|
| Bone-light editorial theme | CSS variables exist; needs design direction and act presets |
| `@tanstack/react-table` for admin tables | Installed, not yet used in admin drops/products list |
| Medusa backend | See `docs/backend-medusa-roadmap.md` |
| Real-time CMS sync | Supabase Realtime could push drop changes to storefront without page reload |
| Phase I (router repatch fix) | Waiting for upstream TanStack Start fix for admin lazy routes |

---

## How to Use This File

1. Pick a task from the highest-priority section.
2. Read the relevant feature doc in `docs/features/`.
3. Read `docs/audit-2026-05-17.md` for related finding IDs.
4. Follow the workflow in `CLAUDE.md` → "How To Plan Features".
5. After completing: move the task to a "Done" section here, update `docs/audit-2026-05-17.md`, and append to `docs/changelog.md`.
