# ANVL System Map

**Audit phase:** 1 (Architecture & codebase mapping)
**Status:** Verified against live code (`src/**`) and the live Supabase project `ANVL` (`cptebkgyrfmokklwtrgp`) on 2026-07-05. Not a design doc — every box below is backed by a real file or table.

---

## 1. Client abstraction layer (dependency inversion)

All cross-cutting data access goes through interfaces in [clients.ts](../../src/app/config/clients.ts), wired by [runtime.ts](../../src/app/config/runtime.ts)'s `createRuntimeClients({ isServer })`:

| Interface | Methods (verified) | Server adapter (no Supabase env) | Server adapter (Supabase env) | Browser adapter (no Supabase env) | Browser adapter (Supabase env) |
|---|---|---|---|---|---|
| `CmsClient` | `getAnnouncementBar`, `getNavigation`, `getCampaigns`, `getLookbook`, `getSiteHomepage` | `seedCmsClient` | `seedCmsClient` spread + `createSupabaseCmsPublicReadSlice` | `localStorageCmsClient` | `localStorageCmsClient` spread + Supabase slice |
| `CommerceClient` | `getProducts`, `getHomeProducts`, `getProductBySlug`, `getRelatedProducts`, `getShopListingCatalog`, `startCheckout` | `createCommerceClient(options)` picks seed/local/Shopify/Supabase per env | same | same | same |
| `SeoClient` | `getSeoByPath`, `getSiteSeo` | `seedSeoClient` | + Supabase slice | `localStorageSeoClient` | + Supabase slice |
| `SiteSettingsClient` | `getWebsiteLayout` | `seedSiteSettingsClient` | + Supabase slice | `localStorageSiteSettingsClient` | + Supabase slice |
| `StoryClient` | `getPublishedChapters`, `getChapterBySlug`, `getChapterByProductSlug` | `seedStoryClient` | `createSupabaseStoryReadSlice` | same | same |
| `AnalyticsClient` | `trackPageView`, `trackProductView`, `trackAddToCart`, `trackBeginCheckout`, `trackOrderPlaced`, `trackWaitlistSignup` | `mockAnalyticsClient` (always — no real analytics backend wired yet) | | | |
| `PaymentClient` | `placeOrder` | `mockPaymentClient` (always — no real payment gateway wired yet) | | | |
| `AccountClient` | `getCustomerProfile`, `updateCustomerProfile`, `listOrders`, `getOrderById` | `supabase ? supabaseAccountClient : mockAccountClient` | | | |

Every adapter swap is a straight ternary/spread on `getSupabasePublicEnv()` — no scattered `if (env)` checks elsewhere in route/component code. This is the one architectural seam the whole app depends on, and it matches `CLAUDE.md`'s description exactly (verified, no drift).

---

## 2. CMS publish flow

```
Admin editor UI (/admin/theme, /fonts, /assets, /shop, /products, /content, /about, /story, /settings)
   │  (local working copy, instant preview — localStorage-backed via createJsonStore)
   ▼
adminCmsRemoteSync.ts  (debounced, batches multiple field changes)
   │  UPDATE cms_settings SET ... WHERE id = 1        [admin-authenticated Supabase client]
   │  UPDATE storefront_publication SET ... WHERE id = 1
   ▼
Supabase Postgres (RLS: cms_settings write = editor/admin; storefront_publication write = admin only)
   │
   ▼ (anon SELECT, RLS: cms_settings_select_cms now CMS-role-gated — SEC-21 fixed 2026-07-05;
   │  storefront_publication_select_all stays public — this is the intended anon-safe mirror)
Storefront SSR loader (routes/__root.tsx) → loadStorefrontProjection()
   │  reads storefront_publication (theme_config, font_config, asset_config, landing_content,
   │  shop_config, pdp_content, active_landing_page_key, media_index)
   ▼
SiteThemeProvider (CSS vars) + resolvePublishedAssets() → LandingPageRenderer / ShopExperience / PDP
```

`adminCmsHydration.ts` is the reverse direction: on admin load, it reads `cms_settings` (the draft, via the authenticated admin client) to seed the local working copy — this is the one legitimate reader of the now-locked-down draft table.

**Landing pages are code-owned**, not CMS-composed: `storefront_publication.active_landing_page_key` only picks which registered page component renders (`src/features/landingPages/registry.ts`); `landing_content` supplies per-scene copy overrides with code defaults filling gaps.

---

## 3. Asset upload flow (two paths — see also `anvl-storage-and-glb-audit.md`)

```
Path A — Drop-scoped (asset-slot picker, e.g. About page anvil/hammer GLB slots)
  MediaPickerField (shared/components/ui — imports admin code, MAINT-02 violation)
    → uploadCmsMediaFile() [features/admin/cmsRemote/uploadCmsMedia.ts]
    → contentType: resolveUploadMimeType(file)   [fixed 2026-07-05, was raw file.type]
    → Supabase Storage .upload(objectPath, file, {cacheControl, upsert:false, contentType})
    → optional registerUploadedCmsMedia() → INSERT cms_media_assets (mime now also resolved)

Path B — Media library (browse/upload page in admin)
  MediaUploadZone → uploadLibraryMediaFile() [features/admin/media/mediaAssets.service.ts]
    → contentType: resolveUploadMimeType(file)   [already correct]
    → Supabase Storage .upload(...)
    → insertMediaAssetRecord() → INSERT cms_media_assets

Both → adminCmsRemoteSync schedules a storefront_publication.media_index sync
Both → publicCmsMediaUrl() builds the public CDN URL: {SUPABASE_URL}/storage/v1/object/public/cms-media/{path}
```

Bucket `cms-media`: public, 50MB limit, `allowed_mime_types` includes standard image/video/font types **plus `model/gltf-binary` and `model/gltf+json`** (added by migration `cms_media_mime_types`, 2026-06-08 — already correct before this audit). Bucket `story-media`: public, 500MB limit, image/video only (no 3D models — Story doesn't use GLBs, only the About Forge Altar does).

Deletion (`deleteMediaAsset`) removes both the Storage object and the `cms_media_assets` row — no orphan on library-path delete. Drop-scoped **replace** does not clean up the previously-assigned object (MAINT-31, open).

---

## 4. Order history flow

```
Shopify Admin (order placed/updated) 
   → webhook POST → Edge Function `shopify-webhook` (HMAC-verified via SHOPIFY_API_SECRET_KEY, verify_jwt: false — correct, webhooks aren't user-authenticated)
   → maps order → UPSERT public.orders (service-role client, bypasses RLS by design)
   → best-effort email→storefront_profiles.id lookup to link customer_id

Customer account page (/account)
   → AccountClient.listOrders() → supabaseAccountClient (browser, anon/authenticated key)
   → SELECT * FROM orders WHERE customer_id = auth.uid() OR email = jwt.email   (RLS: orders_select_own)
```

No customer-facing write path to `orders` exists (verified: only `SELECT` policy present) — correct, since Shopify is the source of truth and the webhook is the only writer.

---

## 5. Shopify commerce flow (optional, env-gated)

```
VITE_SHOPIFY_STORE_DOMAIN / _STOREFRONT_API_VERSION / _STOREFRONT_PUBLIC_TOKEN set
   → createCommerceClient(options) selects the Shopify adapter (features/shopify/**)
   → Storefront API (public token, safe in browser) — products, cart, checkout URL creation
   → shopifyProductToStorefront.ts maps Shopify Product → internal Product type
       (option names "Size"/"Color" matched case-insensitively; slug = Shopify handle;
        variantIdByColorAndSize built for checkout)
   → CommerceClient.startCheckout(lines) → shopifyCart.ts cartCreate mutation → hosted checkoutUrl
   → routes/cart.tsx redirects to hosted checkout when Shopify is set; falls back to internal
     mock /checkout when startCheckout() returns null (seed/local adapters)
```

Without Shopify env vars, `createCommerceClient` falls back to seed/localStorage adapters — verified this is the current default state (no `VITE_SHOPIFY_*` found set in this environment during the audit).

---

## 6. Auth flow (admin)

```
POST credentials → loginAdminServerFn (createServerFn, TanStack Start)
   → Supabase signInWithPassword (anon key only — no service role)
   → fetchCmsProfileRoleWithAccessToken() — SELECT role FROM cms_profiles WHERE user_id = auth.uid()
   → reject unless role = 'admin' (viewer/editor rejected at the /admin gate, even though DB RLS
     allows editor/admin writes on some CMS tables — the UI gate is stricter than the DB policy)
   → adminAuthSession.server.ts seals {userId, email, refreshToken, rememberMe} into an HttpOnly,
     signed cookie (ANVL_ADMIN_SESSION_SECRET), Max-Age 30d if "remember me" else session-only
   → src/routes/admin/route.tsx beforeLoad calls getAdminSessionServerFn() on every SSR + client
     navigation; refresh token rotated + role re-checked on every validation call
```

Browser admin Supabase client (`adminSupabaseBrowserClient.ts`, CMS reads/writes only — not the auth gate) has `autoRefreshToken: false` so the server cookie is the sole refresh-token rotator (avoids a dual-rotation race against GoTrue's own auto-refresh). Verified compliant (SEC-11) — see `anvl-security-audit.md`.

---

## 7. Storefront customer auth flow

`supabaseAccountClient.ts` handles customer sign-in/sign-up directly against Supabase Auth (no server-validated session layer — this is intentionally lighter-weight than the admin gate since customer accounts aren't a privileged surface). `handle_new_storefront_user()` trigger (SECURITY DEFINER, `search_path` pinned to `public`) auto-creates a `storefront_profiles` row on signup.

---

## 8. Deployment / build architecture (verified against `vite.config.ts`, `package.json`)

- TanStack Start SSR on Vite 8; `scripts/repatch-admin-route-tree.mjs` runs before `dev`/`build`/`typecheck` to patch `routeTree.gen.ts` for two admin lazy routes the codegen misses natively (`/admin/media`, `/admin/settings`) — a documented, still-open upstream workaround (Phase I).
- `manualChunks` splits `vendor-gsap`, `vendor-lenis`, `vendor-framer-motion`, `vendor-three` (incl. `@react-three/fiber`, `three`, troika/maath) — verified present and populated in the actual build output (Phase 0's `pnpm build` run showed `OathCanvas`, `AboutAltar`, `Book`, `TheOathLanding` etc. as separate chunks).
- All admin routes confirmed on `lazyRouteComponent` (re-verified 2026-07-05, no drift).
- Two Supabase Edge Functions in production: `shopify-webhook` (active, sound) — `tm-asset-ingest` (dead, deleted 2026-07-05, see changelog).

---

## 9. What this map deliberately does not cover

Per the phased audit plan, this document is architecture-only. Functional bugs, security severities, performance numbers, and cleanup candidates live in the sibling `anvl-*-audit.md` / `anvl-issue-register.md` / `anvl-cleanup-register.md` documents, not here — this map should stay accurate as a reference even as those other documents' findings get resolved over time.
