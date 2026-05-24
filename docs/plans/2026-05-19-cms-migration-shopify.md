# CMS → Shopify commerce migration — implementation plan

> **For agentic workers:** Implement on branch `cms-migration` (from `cms`). Work phase-by-phase; each phase ends with `pnpm verify` and a commit. Reference finding IDs in commits where applicable (`MAINT-*`, `PERF-*`, `SEC-*`).

**Goal:** Move all **commerce truth** (products, variants, inventory, cart, checkout, orders) to **Shopify**, keep **campaign CMS** (drops, acts, landing, header/footer, active-drop theme) in **Supabase + ANVL Admin**, and wire the **storefront** to read published CMS from Supabase and catalog/cart from Shopify.

**Architecture:** Two domains unchanged in spirit (see `docs/backend-medusa-roadmap.md`), but commerce owner becomes **Shopify** instead of Medusa placeholders. `CommerceClient` / `PaymentClient` / `AccountClient` interfaces stay stable; adapters swap. Storefront theme (`:root` palette, loading emblem) and landing/drop pages resolve **active drop** from `storefront_publication.published_drop_snapshot` (Supabase), not localStorage.

**Tech stack:** TanStack Start, Supabase (Auth + CMS tables), Shopify Storefront API (public), Shopify Admin API (server/Edge only), existing Zod + Vitest safety net.

**Note:** Medusa was never fully integrated — migration is primarily **CMS-owned catalog + mocks → Shopify**, plus **tightening Supabase read paths** already started on `cms`.

---

## 1. Domain split (final state)

### Stays in ANVL CMS (Supabase)

| Concern | Storage | Admin UI |
|--------|---------|----------|
| Drops, acts, landing composition | `anvl_drops.draft_body` / publish snapshot | `/admin/drops` |
| Active drop / campaign status | `anvl_drops` + `cms_publish_drop` | Drops list → Activate |
| Header, footer, nav, announcement | `storefront_publication.website_layout` | `/admin/website-layout` |
| Site SEO defaults | `storefront_publication.site_seo` | `/admin/seo` |
| Global brand fallbacks | `storefront_publication.global_brand` | `/admin/theme` |
| Campaigns / lookbook (homepage) | `storefront_publication.campaigns`, `lookbook` | TBD or drops |
| Media for campaigns | `cms-media` bucket | Drop editor / media |
| Admin auth | Supabase Auth + `cms_profiles` | `/admin/login` |

### Moves to Shopify

| Concern | Shopify surface |
|--------|-----------------|
| Product title, description, media | Products |
| Variants, SKU, barcode | Variants |
| Price, compare-at, currency | Variant pricing |
| Inventory | Inventory levels / locations |
| Collections (shop filters) | Collections + metafields |
| Cart | Storefront Cart API |
| Checkout | Shopify Checkout (hosted or embedded) |
| Orders, refunds, fulfillment | Shopify Admin |
| Discounts, shipping, tax | Shopify Admin |
| Customer accounts (later) | Customer Account API / classic accounts |

### Linking layer (Supabase, thin)

Replace `cms_admin_products` as source of truth with a **link table** (or metafields-only on Shopify):

```sql
-- Proposed: public.shopify_product_links
slug text PRIMARY KEY,           -- ANVL storefront slug (stable URL)
shopify_product_gid text NOT NULL,
shopify_handle text NOT NULL,
drop_client_ids text[] DEFAULT '{}',  -- mirrors metafield for filters
updated_at timestamptz
```

Drop JSON keeps `productIds` as **slugs** or **Shopify GIDs** (pick one; recommend **handles** for readability, resolve at runtime).

---

## 2. Active drop & theme (storefront + CMS)

**Requirement:** Storefront theme and CMS preview both reflect the **published active drop**.

### Already implemented (verify, do not regress)

- `cms_publish_drop` writes `published_drop_snapshot`
- Root loader: `fetchPublishedStorefrontProjection`
- `ActiveDropThemeProvider` + `serializeDropPaletteForRootStyle`
- `/drop/$slug` redirects to `active.slug`
- `useLandingCms` + offline fallback chain

### To complete in this migration

| Task | Files |
|------|-------|
| Single source hook `useActiveDrop()` | New: `src/features/drops/hooks/useActiveDrop.ts` — reads from publication query, fallback `storefrontReadFallback` |
| CMS drop editor preview | Ensure `DropEditorLivePreview` uses same compose path as storefront (already uses `composeLandingPageFromDrop`) |
| Remove localStorage override when Supabase on | `useLandingCms` / theme: prefer publication; local only as offline fallback (done) |
| Invalidate publication query after publish | `adminCmsPublish.ts` → `queryClient.invalidateQueries(STOREFRONT_PUBLICATION_QUERY_KEY)` |
| Document active-drop contract | `docs/features/drops-cms.md`, `docs/features/supabase-cms.md` |

**Acceptance:** Change active drop in admin → publish/activate → hard refresh storefront → homepage acts, `:root` colors, `/drop/the-oath`, and header emblem match without clearing localStorage.

---

## 3. Supabase schema changes

### Phase S1 — Migrations (new files under `supabase/migrations/`)

1. **`shopify_product_links`** table + RLS (admin read/write; anon no access).
2. **Rename** `cms_admin_products.medusa_product_id` → `shopify_product_gid` **OR** drop table after link migration (preferred: deprecate table in app first, drop in S4).
3. **`storefront_publication`:** mark `products_snapshot` deprecated; optional `shopify_catalog_revision` / `shopify_synced_at` for cache metadata (do not use as source of truth).
4. **Update `cms_publish_drop`:** stop `jsonb_agg` from `cms_admin_products`; keep drop snapshot + layout + SEO + catalog_drop_index from **link table + Shopify** (or drop index from drop bodies only).
5. **Edge function:** replace `medusa-webhook-stub` → `shopify-webhook` (HMAC verify `X-Shopify-Hmac-Sha256`); handle `products/update`, `inventory_levels/update` → invalidate cache / optional Edge cache table.
6. **Revoke** anon execute on any new SECURITY DEFINER RPCs (pattern from `20260519120000_revoke_anon_cms_publish_drop.sql`).

### Phase S2 — Env (`.env.example`)

```bash
# Shopify Storefront (safe in browser)
VITE_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_API_VERSION=2025-01
VITE_SHOPIFY_STOREFRONT_PUBLIC_TOKEN=

# Server / Edge only — NEVER VITE_*
SHOPIFY_ADMIN_API_ACCESS_TOKEN=
SHOPIFY_API_SECRET_KEY=          # webhook HMAC
```

---

## 4. Application layers (folder structure)

Follow `docs/architecture.md` — no new top-level buckets.

```
src/features/shopify/
  api/
    shopifyStorefrontClient.ts      # createStorefrontApiClient (singleton)
    shopifyAdminClient.ts           # server-only factory
  mappers/
    shopifyProductToStorefront.ts   # → features/products/types/product.types
  webhooks/
    verifyShopifyHmac.ts
  config/
    shopifyPublicEnv.ts             # Zod via publicEnv pattern
  __tests__/

src/features/products/api/
  commerceClient.shopify.ts         # implements CommerceClient
  commerceClient.ts                 # barrel: pick shopify | supabase-snapshot | local

src/features/cart/
  shopify/
    useShopifyCart.ts
    cartLinesToShopify.ts

src/features/checkout/
  shopify/
    redirectToShopifyCheckout.ts
```

**SOLID:** UI → `CommerceClient` interface only; no route imports `@shopify/*` directly except cart/checkout feature modules.

**Boundary:** `features/admin/**` must not be imported by storefront tests; Shopify mappers live in `features/shopify` or `features/products`, not `features/admin`.

---

## 5. Phased implementation

### Phase 0 — Branch & baseline

- [ ] `git checkout cms && git pull && git checkout -b cms-migration`
- [ ] Merge or rebase `cursor/supabase-cms-auth-publish-63fd` if not already in `cms`
- [ ] `pnpm verify` green on `cms-migration`
- [ ] Read: `AGENTS.md`, `docs/audit-2026-05-17.md`, `.cursor/rules/*.mdc`

### Phase 1 — Docs & contracts (no behavior change)

- [ ] Add `docs/features/shopify-commerce.md`
- [ ] Rewrite `docs/backend-medusa-roadmap.md` → `docs/backend-shopify-roadmap.md` (keep redirect note in old file)
- [ ] Update `src/shared/api/contracts/*.contract.ts` comments: Medusa → Shopify
- [ ] Update `AGENTS.md` commerce line
- [ ] Changelog entry

### Phase 2 — Shopify adapter skeleton (feature-flagged)

- [ ] `shopifyPublicEnv.ts` + `publicEnv.ts` Zod keys
- [ ] `commerceClient.shopify.ts` implementing `CommerceClient` with Storefront API `products` query
- [ ] Mapper tests: fixture JSON → `Product` (happy + missing metafields)
- [ ] `createRuntimeClients`: if Shopify env set → `commerceClient.shopify`; else if Supabase → existing; else local/seed
- [ ] **No account without Shopify** — keep mocks until Phase 7

**Storefront API queries (minimum):**

- `getProducts` / `getShopListingCatalog` — `products(first: N)` + metafields `anvl.drop_ids`, `anvl.badge`
- `getProductBySlug` — `productByHandle`
- `getHomeProducts` — filter by active drop metafield OR collection handle from published drop slug
- `getRelatedProducts` — same collection or tag

### Phase 3 — Drop ↔ product linking

- [ ] Define metafield namespace `anvl` in docs (Shopify Admin steps)
- [ ] Drop `productIds` → store **Shopify handles** (migration script in `tools/migrate-product-ids-to-handles.mjs`)
- [ ] `shopify_product_links` sync on admin save (optional) or webhook-only
- [ ] Homepage pieces: `getHomeProducts` uses active drop’s linked handles

### Phase 4 — Remove CMS catalog ownership

- [ ] Admin nav: remove or gate **Products** → “Manage in Shopify” external link
- [ ] Delete or lazy-deprecate routes: `src/routes/admin/products/**` (keep redirects + message)
- [ ] Remove product sync from `adminCmsRemoteSync.ts` (drops + layout + SEO only)
- [ ] Remove hydration of products in `adminCmsHydration.ts`
- [ ] Update `cms_publish_drop` SQL (migration)
- [ ] Remove `storefrontPublicationCommerce.ts` dependency on `adminProducts` **or** keep as legacy fallback until Shopify flag on

### Phase 5 — Storefront read consolidation (Supabase CMS)

- [ ] `useStorefrontPublication()` hook — shared query for landing, activeDrop, layout, globalBrand, SEO context
- [ ] Refactor `useLandingCms`, `ActiveDropThemeProvider`, `__root.tsx` loader to use shared hook/cache
- [ ] `features/cms/read/activeDrop.ts` — thin facade for routes
- [ ] Tests: publication null → offline fallback; publication present → active drop slug

### Phase 6 — Cart & checkout

- [ ] `useShopifyCart` — create cart, add lines, update quantities (Storefront API)
- [ ] Replace `useCart` internals or bridge behind feature flag
- [ ] Checkout route: build cart → `checkoutUrl` redirect
- [ ] `paymentClient` → deprecated stub that redirects (or remove direct `placeOrder` mock usage)
- [ ] Analytics: `trackBeginCheckout`, `trackOrderPlaced` — Shopify pixel optional later
- [ ] Tests: mock Storefront API cart create/add

### Phase 7 — Accounts (deferred minimal)

- [ ] Keep mock `AccountClient` with banner “Shopify accounts coming soon”
- [ ] **OR** Shopify Customer Account API if account ready (separate sub-phase)
- [ ] Do not block Phases 2–6 on accounts

### Phase 8 — Webhooks & cache

- [ ] Deploy `shopify-webhook` Edge function
- [ ] On product/inventory update: bump `storefront_publication.revision` optional or rely on TanStack `staleTime` + manual invalidation
- [ ] Delete `supabase/functions/medusa-webhook-stub`

### Phase 9 — Cleanup

- [ ] Remove unused: `cms_admin_products` service/storage/routes/tests (if fully replaced)
- [ ] Remove `commerceClient.supabase` catalog paths that duplicated products (keep Supabase for CMS only)
- [ ] Remove `products.commerce.ts` storefront exports if nothing imports
- [ ] Grep: `medusa`, `Medusa`, `ANVL_MEDUSA`, dead TODOs
- [ ] `eslint` / `tsc` unused imports
- [ ] Remove `console.log` / `console.debug` in `src/` (keep `console.error` in boundaries if needed)
- [ ] Delete empty files, unused test mocks
- [ ] **Do not delete** `/public` assets or seed files used by fallbacks

### Phase 10 — Verification & PR

- [ ] `pnpm verify` (typecheck + 300+ tests + build)
- [ ] New tests: shopify mapper, commerceClient.shopify, cart checkout redirect, active drop hook
- [ ] Manual test matrix (see §7)
- [ ] Update `docs/audit-2026-05-17.md` deferred work + `docs/changelog.md`
- [ ] PR: `feat(commerce): Shopify + Supabase CMS split — cms-migration`

---

## 6. Code splitting & performance

| Area | Rule |
|------|------|
| Admin products removal | Removes large admin chunk — good |
| Shopify SDK | Use `@shopify/storefront-api-client` or raw `fetch` to `graphql.json` — **no** heavy Admin SDK in client bundle |
| `commerceClient.shopify` | Dynamic import in `runtime.ts` when env set: `import('@/features/products/api/commerceClient.shopify')` |
| Route loaders | Keep parallel `Promise.all`; coalesce Shopify GraphQL in one query per page where possible |
| Images | Use Shopify CDN URLs from Storefront API; keep `loading="lazy"` on shop grids |
| Publication | Keep existing `publicationFetchCoalesce` |
| GSAP | Unchanged — gate desktop + reduced motion per `30-responsiveness-a11y.mdc` |

---

## 7. Security

| Rule | Implementation |
|------|----------------|
| Never bundle Admin API token | `SHOPIFY_ADMIN_*` only in Edge / server functions |
| Storefront token is public | OK under `VITE_*` — scoped to `unauthenticated_read_product_listings` etc. |
| Webhook HMAC | Verify every POST in Edge before processing |
| RLS | `shopify_product_links` admin-only; `storefront_publication` anon read-only |
| CSP | Checkout redirect to Shopify domain — no iframe unless documented |
| SEC-* sanitizers | Unchanged for CMS rich text / hrefs |

---

## 8. Testing strategy

| Module | Tests |
|--------|-------|
| `shopifyProductToStorefront` | Variants, sold out, metafields, missing image |
| `commerceClient.shopify` | Mock `fetch` GraphQL responses |
| `useLandingCms` / `useActiveDrop` | Supabase on/off, fallback |
| `redirectToShopifyCheckout` | URL shape |
| `cms_publish_drop` | SQL migration test via integration or RPC mock |
| Sanitizers | No regression |

Run: `pnpm verify` before every phase commit.

---

## 8. Manual acceptance matrix

1. Supabase env set, Shopify env **unset** → storefront uses offline/seed fallback (degraded but up).
2. Shopify env set → `/shop` lists products from Shopify.
3. PDP `/shop/:slug` loads variant selectors from Shopify inventory.
4. Active drop change + publish → homepage + theme + `/drop/:slug` update.
5. Add to cart → redirect checkout → Shopify checkout page.
6. Admin: no product matrix editor; link opens Shopify Admin.
7. Webhook test with Shopify CLI (`shopify app webhook trigger`) when store exists.

---

## 9. Shopify setup checklist (when account is ready)

Do these in order after creating a **Shopify store** (Basic or trial):

### Store & access

1. Create store at [https://www.shopify.com](https://www.shopify.com) (note store name → `your-store.myshopify.com`).
2. Complete business address, currency (**USD** or **LBP** strategy — decide pricing currency).
3. **Settings → Domains** — connect production domain later; use `.myshopify.com` for dev.

### Storefront API (headless storefront)

4. **Settings → Apps and sales channels → Develop apps** → Allow custom app development.
5. **Create an app** (e.g. `ANVL Headless Storefront`).
6. **Configuration → Storefront API** — enable scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_read_product_tags`
   - `unauthenticated_read_collections`
   - `unauthenticated_write_checkouts` (carts/checkout)
   - `unauthenticated_read_checkouts`
7. Install app → copy **Storefront API access token** → `VITE_SHOPIFY_STOREFRONT_PUBLIC_TOKEN` in `.env`.
8. Copy **API key** and **API secret** for webhooks.

### Admin API (server sync — optional for Phase 8)

9. Same app → **Admin API** scopes:
   - `read_products`, `write_products` (if syncing metafields from script)
   - `read_inventory`, `read_orders`
10. Copy **Admin API access token** → `SHOPIFY_ADMIN_API_ACCESS_TOKEN` (server/Edge only, **not** Vite).

### Metafields (drop linking)

11. **Settings → Custom data → Products** → add metafield definition:
    - Namespace: `anvl`
    - Key: `drop_ids`
    - Type: JSON or list of single line text (IDs matching ANVL `Drop.id`)
12. Optional: `anvl.badge`, `anvl.source_type` for shop filters.

### Products & collections

13. Create products matching ANVL slugs (handles must match URLs e.g. `oversized-tee-oath`).
14. Add variants (size/color) with SKUs and inventory.
15. Create collection **Drop 01 — The Oath** (handle `drop-01-the-oath`) and assign products.
16. Upload product media (PDP gallery).

### Webhooks (after Edge function deployed)

17. **Settings → Notifications → Webhooks** (or via app):
    - `products/update` → `https://<project>.supabase.co/functions/v1/shopify-webhook`
    - `inventory_levels/update` → same URL
18. Set **API secret** in Supabase Edge secrets as `SHOPIFY_API_SECRET_KEY`.

### Checkout

19. **Settings → Checkout** — configure branding (dark colors to match ANVL).
20. Enable payment providers available in Lebanon (research: Shopify Payments availability vs PayPal vs third-party).
21. **Settings → Shipping** — create zones/rates for Lebanon (+ international if needed).

### Test orders

22. Enable **test mode** or use Bogus Gateway for test checkout.
23. Place test order; confirm Admin → Orders shows it.

### Env file handoff to dev

24. Send securely (not in git):

```bash
VITE_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_API_VERSION=2025-01
VITE_SHOPIFY_STOREFRONT_PUBLIC_TOKEN=...
SHOPIFY_ADMIN_API_ACCESS_TOKEN=...
SHOPIFY_API_SECRET_KEY=...
```

25. Re-run `pnpm dev` → verify `/shop` and checkout redirect.

### Payments & legal (production)

26. Upgrade from trial, enable live payments, privacy policy, refund policy pages (can stay on ANVL CMS routes).

---

## 10. Risk register

| Risk | Mitigation |
|------|------------|
| Lebanon payment/shipping limits | Research before committing; keep mock checkout flag until PSP works |
| Slug/handle mismatch | One-time migration script + CI test comparing handles |
| Dual cart state | Single `useShopifyCart`; remove localStorage cart when Shopify on |
| SEO for PDPs | Keep `getSeoByPath`; merge Shopify product SEO into meta or CMS override |
| Large PR | Phased commits per §5; merge behind feature flags |

---

## 11. Out of scope (this migration)

- Replacing Supabase CMS with Shopify Online Store theme editor
- Rebuilding act builder in Shopify
- Full Customer Account API (unless Phase 7 expanded)
- Removing offline localStorage fallback (keep per product requirement)

---

## 12. Definition of done

- [ ] Branch `cms-migration` merged to `cms` via PR
- [ ] `pnpm verify` passes
- [ ] Commerce reads from Shopify when `VITE_SHOPIFY_*` set
- [ ] CMS reads/writes drops + layout + SEO to Supabase only
- [ ] Active drop drives landing, theme, drop page
- [ ] Admin products CMS removed or redirect-only
- [ ] Medusa references removed from code/docs (or archived doc)
- [ ] Cleanup complete (§ Phase 9)
- [ ] Shopify setup doc delivered (§9)
- [ ] `docs/changelog.md` updated

---

*Plan version: 2026-05-19 — branch `cms-migration`*
