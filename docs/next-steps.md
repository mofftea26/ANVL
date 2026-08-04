# Next Steps

Prioritized recommended tasks for ANVL Athletics development. Update this file after completing tasks.

---

## Priority 1: Production Blockers (Phase J)

These are **required before any public launch**. Do not launch without them.

| Task | Status | Effort | Risk if skipped |
|---|---|---|---|
| Real server auth with HttpOnly cookies | ✅ Done (SEC-11, 2026-07-04) | High | Admin accounts vulnerable to XSS-based token theft |
| CSP (Content Security Policy) headers | ⚠️ Report-only — **must be flipped to enforcing** | Medium | XSS attack surface remains open |
| HSTS headers | ✅ Done (`src/start.ts`) | Low | SSL stripping attacks possible |
| CSRF protection on state-mutating endpoints | ✅ Done — double-submit cookie (`src/start.ts`) | Medium | Cross-site request forgery |
| Rate limiting on auth endpoints | ❌ Open | Medium | Brute-force admin login possible |
| Rate limiting on forms (waitlist, contact) | ❌ Open | Medium | Spam/abuse |
| Server-side upload validation (type, size, MIME) | ❌ Open | Medium | Malicious file upload possible |
| DNS cutover to the custom domain | ❌ Open | Low | Site only reachable on the `workers.dev` URL |
| Backfill the 7 file-less production migrations (MIG-01) | ❌ Open | Medium | `supabase db push` cannot rebuild production RLS/schema state |

Tracked under finding IDs `SEC-01`, `SEC-02`, `SEC-03`, `SEC-11` in `docs/audit-2026-05-17.md`.

> Hosting is **live**, not pending: Worker `anvl` was created 2026-07-11 and last deployed 2026-07-28 (verified against the Cloudflare account 2026-07-29).

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

Move CMS read surfaces out of `features/admin/**` into `features/cms/**` so the storefront bundle does not depend on admin modules (MAINT-02, PERF-03).

**Scope as of 2026-07-29:** almost done. `features/drops/**` no longer exists (torn down with the drop-builder), and the 2026-07-05 pass moved the media types/helpers. Exactly **one** violation remains: `src/features/cms/api/cmsPersistenceMode.ts:1` imports `type CmsProfileRole` from `@/features/admin/auth/adminCmsProfileRole`. Moving that one type into `features/cms/**` closes this item.

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
| Test full publish flow (local → Supabase) | Verify `adminCmsRemoteSync` → `cms_settings` + `storefront_publication` mirror → storefront SSR read. (The old `cms_publish_drop()` RPC was dropped with the drop-builder; admin now writes directly, scoped per changed column.) |
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
| Sitemap generation | `public/sitemap.xml` is static; generate dynamically from the active landing page + products. Note `site_seo.technical.sitemapEnabled` is persisted in the CMS but not yet wired to the static file |
| Product structured data | JSON-LD exists; verify all PDP routes emit correct `Product` schema |
| OG images for all routes | Products, drop, about, shop |
| Analytics wiring | Replace `mockAnalyticsClient` with PostHog or Plausible |

---

## Priority 9: Phase E (Large File Splits)

Keep admin editor files under the 500-line hard limit. Tracked as MAINT-01.

The former 600+ line offenders (`DropActsBuilderPanel`, `DropEditorRoute`, `ProductEditorRoute`) were removed with the drop/acts/products CMS surfaces — but new ones have accumulated since. **Measured 2026-07-29, seven files are over the 500-line hard limit:**

| File | Lines |
|---|---|
| `admin/about/sections/AboutOrbsFields.tsx` | 713 |
| `admin/setup/wizards/GamificationSetupWizard.tsx` | 712 |
| `admin/setup/wizards/StorySetupWizard.tsx` | 582 |
| `admin/banner/BannerCustomizeModal.tsx` | 571 |
| `admin/preview/AdminPreviewPanel.tsx` | 566 |
| `admin/media/MediaAssetGrid.tsx` | 561 |
| `admin/setup/wizards/AboutSetupWizard.tsx` | 522 |

(The previous watch-list here claimed "none currently over 500" and named `AdminDateTimeField.tsx`, which no longer exists — it was deleted with `react-day-picker` under PERF-11.)

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
| Bone-light editorial theme | CSS variables exist; needs design direction |
| Medusa backend | See `docs/backend-medusa-roadmap.md` |
| Real-time CMS sync | Supabase Realtime could push CMS changes to the storefront without a page reload |
| Phase I (router repatch fix) | Waiting for upstream TanStack Start fix for admin lazy routes |

---

## How to Use This File

1. Pick a task from the highest-priority section.
2. Read the relevant feature doc in `docs/features/`.
3. Read `docs/audit-2026-05-17.md` for related finding IDs.
4. Follow the workflow in `CLAUDE.md` → "How To Plan Features".
5. After completing: move the task to a "Done" section here, update `docs/audit-2026-05-17.md`, and append to `docs/changelog.md`.
