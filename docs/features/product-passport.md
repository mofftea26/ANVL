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

## Phase B (2026-07-15) — passport content depth

Nine sections now, still one registry (`PASSPORT_SECTIONS`), still three tabs:

| Group | Sections |
|---|---|
| THE CRAFT | Material dossier · **Specifications** · Forged details |
| THE RITUAL | **Care ritual** (interactive) · **Fit & sizing** |
| THE LEGACY | The story · **Forge notes** · Origin · Authenticity |

- **Specifications** (`specs`): construction, fit type, compression, stretch,
  breathability, intended use. Unauthored rows hide themselves.
- **Interactive care guide** (`CareGuide` + `careSymbols.tsx`): 13 standard
  care marks drawn as inline SVG in brand tokens — tap one for its plain
  meaning; numbered steps expand to the "why" note the CMS authored.
- **Fit & sizing** (`fit`): intended fit, measurements (`Label|Value` lines),
  stretch range, model height + size worn, sizing advice.
- **Personal size recommendation** (approved 2026-07-15). Each product maps
  ITS sizes to a **canonical body size** (`fit.sizeEquivalence`, e.g. an
  oversized cut's `M → S`). The viewer's registered size translates:
  this size → canonical → the other product's size for that canonical.
  `buildPassportSizeGuide()` runs in the SSR loader (user-independent);
  `recommendSizes()` applies the viewer's own size client-side (SSR is anon —
  only the owner ever learns their size). **It stays silent rather than
  guessing**: no map, unmapped size, or no matching canonical → no advice.
  Maintained per product in the wizard, so a cut that runs big is mapped
  honestly.
- **Forge notes** (`forgeNotes`): `Title|Body` development fact cards,
  expandable.

`passport_content` is jsonb, so **no migration was needed** — every new
section has `.catch()` defaults and `deepMergeDefaults` back-fills blobs
authored before the section existed.

## Phase C (2026-07-15) — design-detail hotspots

Approved concept: **pulse markers + side reveal**, authored by **click-to-place**.

- **Storefront** (`PassportHotspots.tsx`): champagne markers pulse on the
  product render (the pulse stops while a detail is open, so the composition
  goes quiet while you read; unselected markers dim to 30%). Selecting one
  reveals its copy — in the console that takes the panel beside the piece (and
  the embers re-trace around the new card shape, because the measure effect
  follows the layout); on mobile it's a sheet directly under the render.
  Markers are pointer-enabled islands over a pointer-transparent overlay, so
  the render keeps its sheen and never steals clicks.
- **Authoring** (`HotspotPlacer.tsx`, wizard step "Design details"): click the
  hero render to drop a numbered marker, then write its title + story.
  Positions are stored as **percent of the image box** (`x`/`y` 0–100), so a
  marker holds its spot at every display size; the resolver clamps defensively
  so a bad number can never park a marker off-image. Hotspots without a title
  are dropped. The step explains itself when no hero render is assigned yet.

## Phase D (2026-07-15) — Armory views

Approved: **Vault, Collection, Timeline, Loadout** (Grid stays the default).
Declined/deferred: Hall of Honor (needs a `featured` flag → deferred to the
personalization family so its storage is designed once), Mannequin (needs a
rigged 3D garment per product — we only have the anvil/hammer GLBs), Archive
(meaningless until lifecycle/retirement exists).

Shaping lives in `src/features/passport/lib/armory.ts` (pure, 10 tests); the
views in `storefront-account/account/panels/armory/ArmoryViews.tsx` are
presentational and CSS-only.

- **Vault** — your STARTED drops as a lit slot wall: registered pieces are
  champagne-washed plates, the rest of the drop sits as dashed empty sockets,
  so the gap is visible. Never lists untouched drops (an armory is a record of
  what you own, not a shop shelf).
- **Collection** — every drop in the catalog with a completion bar, owned
  pieces as champagne chips and missing ones as dashed chips.
- **Timeline** — every registered *unit* (duplicates included) newest-first on
  a champagne spine, with drop + colorway/size + date.
- **Loadout** — grouped by the product's commerce `category`; anything without
  one lands in an `Other` catch-all (last), never invented into a slot.

Duplicate units collapse to one Vault/Collection slot (the newest fills it)
but each keeps its own Timeline row — a slot is a product, a timeline row is a
unit.

## Phase E (2026-07-15) — the registration ceremony, "The Authentication"

Approved concept + approved that the verification lines carry **real record
data**. Plays only AFTER the atomic claim has succeeded — it never gates
registration, and skipping it loses nothing.

Beat sheet, on the shared clock (`webgl/ceremonyTiming.ts` — the DOM timeline
and the particle forge never call each other, they schedule against the same
constants):

| t | Beat |
|---|---|
| 0.35s | A champagne beam sweeps down the piece; a lit copy wipes in behind it (`clip-path`), so the beam *reveals* the product out of the dark |
| 1.35s | Verification lines tick in — Piece · Drop · Material · Origin · Colorway · Size · Registered |
| 2.35s | Embers gather into the ANVL crest (WebGL) |
| 3.25s | The seal locks: the solid crest resolves as the embers **fuse into it** (`uReveal`), with a champagne flash |
| 3.85s | "Registered to <name>" settles onto the plate |
| 4.5s | "Added to your Armory" → hand-off |

- **The crest is real** (`webgl/CeremonyCrestParticles.tsx`): the embers sample
  `/brand/mark.svg` via `sampleImageSilhouette` and reuse the passport forge
  shaders, so the cloud IS the mark rather than an approximation — and the DOM
  seal resolves out of it instead of crossfading over it.
- **Honesty rule** (`lib/ceremonyLines.ts`, tested): every line is a true
  statement from the record just written; a value that doesn't exist is
  omitted, never faked. No "AUTHENTICATING…" theater, and **no serial
  engraving** (final product decision).
- Mobile-first: DOM/CSS/GSAP core; the crest forge + ember field layer in only
  on capable devices behind `isWebglAvailable()` + the canvas teardown guard.
  Reduced motion skips straight to the passport.

## Phase F (2026-07-15) — related products ("Complete the Loadout")

Approved: **two** LEGACY-tab sections, both owner-only, both deliberately
un-salesy (they mirror the collection gap the owner already sees in the Armory
and link to the shop PDP — never a popup or checkout push).

- **Complete the drop** — the rest of THIS piece's drop the owner hasn't
  registered. When they hold the whole drop it becomes a quiet **completion
  seal** (crest + "<drop> — complete") instead of an empty strip.
- **Matching pieces** — other pieces in the same commerce category still to
  collect; a one-line acknowledgement when they already hold them all.

`lib/relatedProducts.ts` (pure, tested) builds the candidate lists in the SSR
loader (user-independent); the strip filters by the owner's registrations
client-side via `useOwnedPassportsQuery` (SSR is anon), the same split as the
size recommendation. Never shown on the public authenticity view — the
`available` predicate gates on `view.isOwner`.

## Phase G (2026-07-16) — the Armory comes alive

Approved from the Phase G menu: wear journal, Feats, Hall of Honor, public
armory (both directions), verified-owner reviews, and the full gamification
family. Declined/deferred: lifecycle (care reminders, repair log, retirement),
owner perks (early access, exclusives). Built as G1–G7, one commit each.

**G1 — DB foundation** (`supabase/migrations/20260716120000_armory_life.sql`).
`product_passports` gains `wear_count`/`last_worn_at` + `featured_slot` (1-3,
unique per owner). New `armory_feats` (per-entry public flag), `product_reviews`
(one per owner per product), and `storefront_profiles.armory_public` +
`armory_handle` (minted once, 72 bits). Every anon read is a SECURITY DEFINER
RPC projecting only safe fields — never tokens, serials, ids or emails.

**G2 — wear journal + Feats.** "Wore it" is a one-tap optimistic counter on each
Grid piece (stokes a flame + count, muted undo). Feats are the owner's
achievement log — add/edit/delete "Deadlift PR — 240 kg" with a date and a
per-entry public/private switch.

**G3 — Hall of Honor.** A star pin on each piece fills the next of three shrine
slots (disabled when full — unpin first, never silent eviction). `ArmoryHonor`
is the pedestal strip, shown once anything is pinned. `honorSlots.ts` is pure +
tested.

**G4 — public armory (two states).** `ArmoryShareCard` (owner, read+write) mints
a shareable link; `/armory/$handle` (`PublicArmoryView`, read-only) shows the
owner name, rank, Hall of Honor, shared pieces and public feats — no controls,
pieces aren't links (tokens never exposed). noindex + Coming-Soon-exempt.

**G5 — verified-owner reviews.** `PdpReviews` on the product page: everyone
reads (with a "Verified owner" badge + average); only a signed-in holder of a
registered passport for that product sees the write form. Ownership is proven by
`submit_product_review`, not claimed. One review per owner, editable + deletable.

**G6 — gamification.** All client-derived (same tamper posture as ranks):
- **Forge XP / Level** (`forgeXp.ts`): registrations + wears + feats + full drops
  on a quadratic curve; `ForgeProgress` shows the level, a live XP bar, and the
  nearest goal (next rank if close, else next level). Ranks stay the identity.
- **Collection Crest** (`CollectionCrest.tsx`): an SVG that grows — rivets count
  pieces, laurel at three, crown at a full drop, star at a full shrine, glow
  ramps with level.
- **Challenges** (`challenges.ts` + `ArmoryChallenges`): a quest log with live
  progress bars, nearest-to-done first.

**G7 — particle polish.** The bento ember tracing now walks a TRUE rounded-rect
outline (four edges + four quarter-circle corners via `pointOnRoundedRect`), so
corners curve like `rounded-2xl`; edge jitter tightened ±3px→±1.4px. The passport
product render now forges from embers sampled from the real image on first load
only (`ProductForgeImage` → lazy `ProductForgeCanvas`/`ProductForgeParticles`),
then the canvas unmounts; reduced motion / no WebGL shows the image immediately.

## Phase H (2026-07-29) — the Blueprint section

A new `craft` section, fed by the techpack pipeline (`docs/features/techpacks.md`):
the manufacturer's construction callouts.

- **New `passport_content.blueprint`** — `{ heading, intro, features[] }` where a
  feature is `{ code, title, body }`. The existing hero-render `hotspots` are
  untouched.
- **`deepMergeDefaults` is the real schema.** Adding or removing a section field
  on `passportProductContentSchema` without changing that hand-written literal
  typechecks (it returns through an `as` cast) and then silently drops the data
  on every save, because `writePassportContentToStorage` parses through it.
  Schema + `DEFAULT_PASSPORT_PRODUCT_CONTENT` + `deepMergeDefaults` change
  together; the round-trip regression test guards it.
- Authored in an 11th wizard tab; techpack import fills it.

### 2026-07-30 — the flat is gone; the render becomes the schematic

The section originally pinned lettered markers to the manufacturer's technical
flat, extracted from the supplier PDF. The extraction was a page crop with
residual artefacts and the operator's verdict was "not accurate at all" — and
coordinates measured against a crop can only ever be as good as that crop. So:

- **The callouts are CARDS.** `PassportBlueprint.tsx` is a static card grid —
  code chip, title, body — with no image, no markers and no coordinates. Being
  static markup it is identical for a mouse, a screen reader and a phone.
- **`blueprint.flatAsset` and `features[].positions` are removed** from
  `passportContent.zod.ts`, `DEFAULT_PASSPORT_PRODUCT_CONTENT`,
  `deepMergeDefaults`, the resolver and `PASSPORT_MEDIA_FIELDS`
  (`collectAssignedMediaIds.ts`). Blobs authored before this drop both on the
  next parse — the schema is non-strict, so unknown keys are stripped.
- **The passport's OWN render becomes the schematic** while the section is open:
  `.pp-holo` in `styles.css`, armed by `data-holo="on"` on the image box in
  `PassportConsole` (desktop) and `PassportMobile` (phone). CSS only — a filter
  chain flattening the render to a luminance mask plus alpha-following
  `drop-shadow` bloom, a technical grid + scanline comb, and one slow sweep.
  Champagne and bone tokens only; motion lives entirely inside a
  `prefers-reduced-motion: no-preference` block, so reduced motion keeps the
  static readout, and any unsupported declaration simply drops back to the
  plain photograph.

## Armory discovery (2026-07-31)

Two consented paths into a shared armory
(`supabase/migrations/20260731090000_armory_discovery.sql`):

- **`get_passport_by_token` also returns `owner_armory_handle`** — non-null
  ONLY when both switches agree: the passport shows its owner (you own it, or
  it's public) AND the owner's armory is public with a minted handle. A live
  transfer code deliberately does NOT unlock it — the code proves a hand-over
  in progress, not a decision to publicise the armory. Parsed as
  `PassportView.ownerArmoryHandle` (null default, so older payloads keep
  parsing); when present, the public authenticity view gains a second,
  ghost-prominence action — "View the owner's Armory" → `/armory/$handle`
  (`PassportOwnerArmoryLink`, overlaid from `PassportPage`) — while "View this
  product" stays the primary action. The UI never derives the handle from any
  other source.
- **New anon RPC `search_public_armories(p_query, p_limit)`** (SECURITY
  DEFINER): searches ONLY `armory_public` profiles by handle/name and returns
  ONLY `{ handle, display_name }` — exactly the fields `/armory/$handle`
  already shows. ILIKE wildcards are escaped, queries under 2 chars return
  `[]`, results cap at 12. The storefront global search surfaces it as the
  live "Warriors" group: `useArmorySearch` (React Query over the anon REST
  path, silent `[]` without Supabase env) feeds `useGlobalSearch`, which merges
  the hits into the same grouped results as the Fuse corpus — so the dropdown,
  the overlay, and keyboard navigation are the existing shared machinery.

## 2026-08-03 — sharing, rebuilt (`src/features/share/`)

The old share studio (`armoryShare.ts` + `ArmoryShareModal.tsx`, both over the
500-line limit) is deleted. Sharing is now one feature with one entry point.

**What was wrong.** Picking a gallery/camera photo left the preview unchanged;
the "what to share" dropdown did nothing once a photo was picked, because the
HUD templates rendered only name/rank/stats and ignored the subject entirely;
the Instagram, TikTok and Discord tiles resolved to `href: () => null` and
silently did nothing; and the sheet asked the user to pick "a piece" while they
were standing inside that piece's passport.

**The platform constraint that shapes all of this.** No web page can hand an
image to an Instagram Story, a Facebook Story or a WhatsApp status via a deep
link — `instagram-stories://share` requires a native app registered with a
Facebook App ID, and WhatsApp's scheme carries text only. The one route that
really delivers pixels is `navigator.share({ files })` (iOS Safari 15+, Chrome
Android, Chrome/Edge on Windows). So `resolveShareRoute()` resolves each tile at
tap time — OS sheet with the PNG → the platform's web intent → the app deep link
on a phone or the web composer on a desktop — and every non-sheet route saves
the image and copies the caption FIRST, then says so. A tile can never appear to
do nothing; the route matrix is unit-tested for exactly that.

**The photo path.** `useImagePick` replaces `FileReader`-to-data-URL with
`createObjectURL` → `decode()` → a one-time downscale (2160px long edge) into an
offscreen canvas held in a ref, so only a version counter crosses React. Two
consequences: no `data:` URL is ever handed to an `<img crossOrigin>` (a
CORS-mode fetch of a `data:` URL fails in several engines — the identified cause
of the silent drop), and an undecodable file, HEIC on desktop being the usual
one, reports an error instead of leaving the preview looking unchanged.
`drawKit.loadImage` now sets `crossOrigin` only for `http(s)` sources.

**Content model.** The piece is *context*, set by whatever opened the sheet, and
the only content choice is which feat rides along — `No feat`, or one of the
feats logged in that piece. The armory entry point is the sole place a piece can
be chosen, because it is the only one where no piece is implied.

**Three tabs.** *Image* — live preview, format, preset, photo, feat, send-to,
download. *Link* — armory URL and derived caption, each copyable. *QR* — the
branded code.

**Seven presets, one family.** There used to be two families — three "backdrop"
looks for when the athlete had no photo and seven HUD looks for when they did,
with the sheet swapping families under the user the moment a photo was added or
removed. Five of the ten were therefore unreachable at any given moment, and
picking one could silently turn it into another.

A look now describes ARRANGEMENT only. What it composes over is THE STAGE
(`image/presets/stage.ts`), which resolves itself: the athlete's photo when there
is one, the piece's own product render over brand atmosphere when there is not.
Adding a photo swaps the hero and nothing else. The seven are `bottom-rail` (the
default: one rail across the base carrying thumbnail, piece, feat and headline
stat, clear of Instagram's own furniture), `modern`, `minimal`, `premium`,
`luxe`, `game`, `jarvis`. All seven carry the piece thumbnail and the selected
feat, each in its own language, in both stage states — `__tests__/presets.test.ts`
walks all 7 × 3 formats × 2 stages and asserts it. `SHARE_PRESETS` is typed
`Record<SharePresetKey, SharePreset>`, so a missing look is a compile error
rather than a blank canvas. Presets are synchronous and take a `ShareCanvas`
— the narrow slice of `CanvasRenderingContext2D` they may touch — so tests hand
them a recording surface and assert the thumbnail and feat actually landed.

**The QR encodes the public armory URL, never `/p/<token>`.** The token is the
claim secret and the transfer surface; it has no business on a public post.
`qr/anvlQr.ts` takes the module matrix from `QRCode.create(url, {
errorCorrectionLevel: 'H' })` and draws it: neighbour-aware rounded modules that
fuse into continuous strokes, champagne rounded finder eyes, and a centre
knockout (~24% of the width, ≈5.8% of module area — a fraction of level H's 30%
budget) carrying `AnvlCrest`. The crest path data moved to
`shared/assets/brand/anvlCrestPath.ts` so the SVG component and the canvas
renderer cannot drift.

**The finder eyes are dark, not champagne, and that is a scannability
decision.** Decoders binarize before hunting the finder's 1:1:3:1:1 run-length
signature. Champagne `#C5A56A` is luminance ~168/255 against bone at ~228 and
the modules at ~11, so any threshold lands near 120 and the accent would
binarize as *light* — the three locator patterns would disappear and the code
would not be found at all. The brand lives in the module shapes and the crest;
the locators stay legible to a camera. Verified against real rendered pixels in
a browser: 1413 data modules binarized outside the finders and knockout with
**zero mismatches** against the source matrix at 256 / 512 / 1024 px, and each
eye reading `D1 L1 D3 L1 D1`.

**Feats.** Every feat row has a share icon, and `createArmoryFeat` now returns
the new row's `id` (`.select('id').single()`) so a successful add opens the
sheet on the feat just logged. Setting a PR is the moment worth posting.

**Entry points.** Passport Armory tab, the account Armory panel, and any feat
row — one share icon each. `ShareModal` mounts only while open, because
`PieceFeats` renders once per armory card and the sheet pulls the catalog and
profile behind it.

## Follow-ups

- Scan-verify the branded QR on a physical phone camera at print size before
  it goes on anything printed.
- RPC rate limiting (Phase-J family; 122-bit tokens make brute force
  impractical today).
- Shopify Admin API stock-driven batch sizes.
- Server-verified achievements if ranks must be tamper-proof.
