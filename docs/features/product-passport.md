# Product Passport — "The Forge Ledger"

Every physical ANVL garment ships with a passport card carrying a unique QR code
(one QR per physical unit). Scanning it walks the customer through claim →
ceremony → a per-unit passport page; claimed pieces appear in the account
**Armory** tab with derived ranks/badges. Admin generates and tracks the codes
at `/admin/passports`.

## Flow

```
Scan QR → /p/<token>
  token unknown ............... branded "not of the forge" screen
  unclaimed + signed out ...... teaser → /auth/sign-in?redirect=/p/<token>
  unclaimed + signed in ....... onboarding (colorway + size self-reported,
                                name-on-plate) → claim_passport RPC (atomic)
                                → claim ceremony (GSAP; WebGL embers on capable
                                devices) → owner passport
  claimed + owner ............. full passport dossier
  claimed + anyone else ....... public authenticity view ("Forged by <name>")
```

State resolution is the pure `resolvePassportStage()`
(`src/features/passport/lib/passportStage.ts`).

## Data & security model

Table `public.product_passports`
(`supabase/migrations/20260713120000_product_passports.sql`): one row per unit —
`token` (uuid secret, the QR encodes `/p/<token>`), `batch_id`, `product_slug`
(Shopify handle), `product_name` snapshot, `serial_number` + `edition_total`
(the `#017 / 100` forge plate), `claimed_by/at/color/size/email/display_name`
snapshots.

- **No public SELECT** on the table — tokens would be enumerable via PostgREST.
  Anonymous/owner reads go through `get_passport_by_token(p_token)`
  (SECURITY DEFINER, safe projection; owner-only fields only when
  `claimed_by = auth.uid()`).
- **Atomic claim**: `claim_passport(p_token, p_color, p_size, p_display_name)`
  (SECURITY DEFINER, authenticated only) does
  `UPDATE ... WHERE token = $1 AND claimed_by IS NULL` — exactly one owner ever,
  even under concurrent scans. Returns `{ ok, passport | error }` jsonb.
- Owners read their rows via `passports_select_own` (Armory); CMS roles read
  all; editors/admins insert (generate), update (unassign), delete.

## Storefront

- `src/routes/p/$token.tsx` — SSR loader calls the RPC anonymously (REST helper
  `restRpc` in `src/features/cms/api/supabaseRest.ts`, no supabase-js in the
  loader path) + product/pdp-content/story fetches; `noIndex` SEO.
- `src/features/passport/` — schemas (Zod, snake→camel transforms), RPC client
  (`api/passportClient.ts`; authed calls lazy-import the storefront supabase-js
  client), hooks, ranks lib, and the components (teaser, onboarding, ceremony,
  passport page, origin map, serial plate).
- **Motion tiering (scans happen on phones):** every device gets a GSAP
  tween/timeline entrance (no pinning/scroll-jack on mobile); `≥768px` adds
  batched ScrollTrigger section reveals; the claim ceremony is a DOM GSAP
  timeline everywhere with a lazy `vendor-three` `DustField` ember layer gated
  by `isWebglAvailable()` + reduced-motion. Reduced motion skips the ceremony
  entirely.
- **Coming Soon exemption**: `/p` and `/auth` are in
  `COMING_SOON_EXEMPT_PREFIXES` (`src/features/comingSoon/lib/comingSoonGate.ts`)
  — QR cards ship with physical products, so a customer holding one must reach
  their passport (and its sign-in step) even while the site is in reveal mode.
- **Armory**: 5th account tab (`accountTabs.ts`) → `ArmoryPanel` — claimed
  pieces, drop completion, ranks (Initiate → Forged → Oathbound → Warlord) and
  badges derived client-side in `src/features/passport/lib/ranks.ts` (V1:
  not tamper-proof; server-side achievements are a future option).

## Admin (`/admin/passports`)

Story-editor pattern (direct table CRUD on the admin browser client, Result
unions, Zod at the write boundary): `src/features/admin/passports/`.

- Generate a batch: product from `useAdminProductCatalogQuery()` + manual
  quantity (real Shopify stock counts are NOT available via the Storefront
  API — `availableForSale` boolean only). Serials continue from the product's
  max; new rows get the new `edition_total`, old rows keep their historic
  denominator.
- Ledger with product/status filters, claimant email/name snapshots,
  unassign (frees the claim) and delete behind `AdminConfirmDialog`.
- **QR sheet** per batch: `PassportPrintSheet` (lazy) renders `qrcode`-generated
  data-URLs for `${BRAND.canonicalBaseUrl}/p/<token>` in a print-isolated
  overlay → browser print / Save as PDF.

## Phase 2 (2026-07-14)

- **Passport console** (`src/features/passport/components/console/` +
  `src/features/passport/webgl/`): owners on ≥1280px motion-capable screens get
  a no-scroll split — the piece forged out of ember particles on the left
  (particle-forge standard: `passportForgeShaders.ts`, `passportForgeTiming.ts`,
  `passportMotionState.ts`; silhouette from the CMS hero render, ANVL mark
  fallback), bento section cards on the right. Opening a section shatters the
  whole composition into a screen-filling particle cloud and re-forges it
  around the section content; the DOM choreography stands alone without WebGL.
  Mobile/tablet/reduced-motion keep the scrolling dossier — both surfaces
  render from the shared `PASSPORT_SECTIONS` registry.
- **Ownership transfer** (link + accept): the owner mints a one-time 7-day
  code (`initiate_passport_transfer`) baked into
  `/p/<token>?transfer=<code>`; the recipient signs in and accepts
  (`accept_passport_transfer` — atomic re-forge, keeps colorway/size, logs to
  `passport_transfers`). `get_passport_by_token(p_token, p_transfer_code)`
  reports `is_transfer_pending` (owner) and `transfer_valid` (recipient).
- **Passport content CMS**: `passport_content` jsonb on both singletons
  (`passportContent.zod.ts` / `.settings.ts`, synced via `adminCmsRemoteSync`
  + hydrated on admin load); authored in the `/admin/passports` →
  "Passport content" tab through a multi-step wizard (one step per section,
  each with its own assets). Storefront resolution:
  `resolvePassportContent()` layers passport_content → pdp_content → product
  fields → code defaults.
- **Armory everywhere**: account dropdown + mobile drawer card link to
  `/account?tab=armory`.

## Phase A rework (2026-07-15) — locked product decisions

Final decisions now enforced in code:
- **No serial numbers on any customer surface.** `AuthenticityPlate` (crest +
  "Authentic ANVL" + drop + "Limited to N pieces") replaced the serial plate
  everywhere — teaser, onboarding, ceremony seal, console, dossier, Armory,
  and the printed QR card. `serial_number` stays in the DB/admin ledger for
  operations only; no formatter is exported for UI.
- **Owner-controlled visibility.** `product_passports.is_public` (default
  false) + `set_passport_visibility` RPC; `get_passport_by_token` only reveals
  the engraved name/date to non-owners when the owner opted in (or when the
  caller holds a live transfer code — they were invited).
- No warranty, no claim codes, no crypto. Registration is QR-scan-direct.

Console/UX rework:
- **Particles moved to the bento cards.** `PassportForgeParticles` traces the
  MEASURED card rects (borders ~72% of points + sparse fill) instead of the
  product silhouette; the product render stays clean with a CSS champagne
  sweep (`.pp-sheen`). Accuracy rules: nothing in the panel animates with a
  transform (cards fade only), rects are read on the frame after commit, and
  a redundant measure never re-forges. Interrupts are seamless — `forgeTo`
  freezes the cloud's current interpolated position into `aFrom` via a CPU
  mirror of the shader's per-seed stagger (`freezeCurrent`).
- **Group tabs**: THE CRAFT (material, details) · THE RITUAL (care) · THE
  LEGACY (story, origin, authenticity). Cards carry champagne numerals, no
  icons. The mobile dossier renders the same groups as headings.
- **Story embedded in-page** (`PassportStoryChapter`) — the loader returns the
  full `StoryChapter`; no redirect to /story, no 3D book.
- **Origin = world map** (`WorldOriginMap` + `passportCountries.ts`):
  equirectangular projection, CMS-assigned **Designed in** (outline pin) and
  **Made in** (pulsing pin) joined by a champagne arc. Height-capped so it
  fits its panel; the detail panel scrolls only when content genuinely
  exceeds it.
- Footer is hidden on `/p/*`; the mobile hero image is deliberately small.
- **Ranks**: three levels each (Initiate I–III · Forged I–III · Oathbound
  I–III · Warlord I–III) with Higgsfield-generated emblems in
  `public/brand/ranks/*.png` (256px, transparent). The serial-based "Early
  Steel" badge is gone.

## Follow-ups

- RPC rate limiting (Phase-J family; 122-bit tokens make brute force
  impractical today).
- Shopify Admin API stock-driven batch sizes.
- Server-verified achievements if ranks must be tamper-proof.
