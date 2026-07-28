# Design — Admin nav responsiveness, Size/Care guide redesign + CMS, unified ember forge

**Date:** 2026-07-28
**Status:** Approved for planning
**Scope:** Four independent workstreams, delivered together.

---

## Table of contents

- [A. Admin navigation responsiveness](#a-admin-navigation-responsiveness)
- [B. Unified ember forge + About altar handoff](#b-unified-ember-forge--about-altar-handoff)
- [C. CMS schema + admin editors for the guides](#c-cms-schema--admin-editors-for-the-guides)
- [D. Storefront redesign of the two guide pages](#d-storefront-redesign-of-the-two-guide-pages)
- [Cross-cutting decisions](#cross-cutting-decisions)
- [Execution order and parallelism](#execution-order-and-parallelism)
- [Risks](#risks)
- [Definition of done](#definition-of-done)

---

## A. Admin navigation responsiveness

### Current state

Every `/admin/*` navigation blocks on the layout route's `beforeLoad`:

`src/routes/admin/route.tsx:32-43`

```tsx
beforeLoad: async ({ location }) => {
  const result = await getAdminSessionServerFn()
  ...
}
```

`getAdminSessionServerFn` → `validateAdminSessionFromCookie` (`src/features/admin/auth/adminAuth.ts:160-216`) performs, strictly sequentially:

1. Unseal the HttpOnly session cookie.
2. `client.auth.refreshSession()` — network call to Supabase GoTrue, **rotates the refresh token**.
3. `fetchCmsProfileRoleWithAccessToken()` — network call to PostgREST `/rest/v1/cms_profiles`.
4. `writeAdminSessionData()` — re-seal + `Set-Cookie`.

On client navigation the whole thing is additionally wrapped in a `/_serverFn/*` HTTP round-trip.

Two compounding facts:

- **TanStack does not gate `beforeLoad` on staleness.** Loaders are gated (`load-matches.js:430-436` checks `staleAge` + `cause`), `beforeLoad` is not — `shouldSkipLoader` only checks for a missing or dehydrated match. The `/admin` layout match is present for every `/admin/*` URL, so its `beforeLoad` re-runs unconditionally on every navigation.
- **`defaultPendingMs` is unset**, so the library default of `1000` applies (`@tanstack/router-core` v1.169.2, `router.js:798-801`). For the first full second the old page stays rendered with zero feedback. That is the reported freeze.

`defaultPreload: 'intent'` (`src/router.tsx:9`) makes it worse: hovering a sidebar item for 50ms fires the same chain via `preloadRoute`. No admin `<Link>` overrides it.

There is **no global loading indicator anywhere in the app** — `useRouterState({ select: s => s.isLoading })` appears nowhere in `src/`.

Secondary: `AdminAuthProvider.tsx:137-156` fires its own `callGetSession()` on mount *in addition to* `beforeLoad`, so a cold `/admin` load runs the two-hop chain twice, and concurrent invocations race on refresh-token rotation.

### Target state

Navigation between admin pages feels instant. Any navigation that does take time shows a progress indicator within ~120ms, everywhere in the app.

### Changes

**A1. Global route progress bar.**
New `src/shared/components/layout/RouteProgressBar.tsx`. A 2px bar fixed at the top of the viewport, driven by `useRouterState({ select: (s) => s.isLoading })`. Mounted once in the root layout (`src/routes/__root.tsx`) so it covers storefront and admin alike.

- Indeterminate easing-out width animation (transform-only: `scaleX` on a full-width element with `transform-origin: left`), not a fake percentage.
- Colour: `--color-highlight-bright` on the storefront, molten copper in the admin — both resolve from the same var because `AdminThemeProvider` re-points it.
- Fades out over 200ms after `isLoading` goes false, with a 120ms entry delay so instant navigations never flash it.
- `aria-hidden="true"`; announcement is handled by the existing route pending components. Respects `prefers-reduced-motion` by rendering a static bar with an opacity transition instead of the sweep.

**A2. Router pending thresholds.**
`src/router.tsx` — add `defaultPendingMs: 120` and `defaultPendingMinMs: 200`. The existing per-route `pendingComponent`s (`AdminEditorLoading`, `AdminRoutePending`) then appear promptly instead of after a full second, and the 500ms default minimum no longer pins a spinner on screen longer than needed.

**A3. TTL-cached admin session guard.**
New module-level cache in `src/features/admin/auth/adminAuthCache.ts`:

```ts
getCachedAdminSession(): Promise<AdminSessionResult>
invalidateAdminSessionCache(): void
```

- Caches the **in-flight promise** as well as the resolved value, so concurrent callers (hover preload + click nav + provider mount + heartbeat) share one round-trip. This alone removes the refresh-token rotation race.
- TTL **45s**. On expiry the next call does the real round-trip.
- Only successful, authenticated results are cached. Any unauthenticated or errored result is never cached and clears the entry.
- `invalidateAdminSessionCache()` is called on logout and whenever an admin Supabase call returns 401.
- Client-side only. On the server (SSR) the cache is bypassed entirely — a Worker isolate is shared across requests and users, so caching there would be a cross-request auth leak. This is the single most important constraint in this workstream.

`src/routes/admin/route.tsx` `beforeLoad` calls `getCachedAdminSession()` instead of `getAdminSessionServerFn()` directly.

**Security note.** Role revocation now takes effect within 45s on client-side navigation rather than immediately. Accepted: the cookie remains HttpOnly and sealed, SSR and cold loads still validate every time, the 10-minute heartbeat still rotates, and every privileged operation is enforced by Supabase RLS on the server regardless of what the client UI shows. The guard is a UX gate, not the security boundary.

**A4. Disable preload on admin nav links.**
`preload={false}` on the `<Link>`s in `AdminSidebar.tsx` (~line 164-176) and `AdminTopbar.tsx` (~line 141). Cheap now, but sweeping the sidebar should not fan out network calls.

**A5. Remove the duplicate mount fetch.**
`AdminAuthProvider.tsx:137-156` uses `getCachedAdminSession()`, so it shares the entry `beforeLoad` already populated. The 10-minute heartbeat calls a `{ force: true }` variant that bypasses and refreshes the cache.

### Tests

- `adminAuthCache.test.ts` — concurrent callers share one promise; TTL expiry triggers a refetch; failures are not cached; `invalidate()` clears; server context bypasses the cache.
- `RouteProgressBar.test.tsx` — hidden when idle, visible when `isLoading`, respects reduced motion.

### Files

| File | Change |
|---|---|
| `src/shared/components/layout/RouteProgressBar.tsx` | new |
| `src/routes/__root.tsx` | mount the bar |
| `src/router.tsx` | pending thresholds |
| `src/features/admin/auth/adminAuthCache.ts` | new |
| `src/routes/admin/route.tsx` | use the cache |
| `src/features/admin/auth/AdminAuthProvider.tsx` | use the cache, drop the duplicate fetch |
| `src/features/admin/components/AdminSidebar.tsx` | `preload={false}` |
| `src/features/admin/components/AdminTopbar.tsx` | `preload={false}` |

---

## B. Unified ember forge + About altar handoff

### Current state — premise correction

There is no single shared particle system. There are **three independent implementations** sharing a design vocabulary but zero code:

| Family | Tech | Files | Surfaces |
|---|---|---|---|
| Shared UI forge | **canvas-2D** | `ModalForgeEffect.tsx`, `ToastForgeEffect.tsx` | every `<Modal>` (20 call sites), every sonner toast |
| Particle-forge standard | three.js / R3F | `emberForgeShaders.ts`, `heroForgeShaders.ts`, `passportForgeShaders.ts` | Coming Soon, Oath hero, passport |
| Altar one-off | three.js | `AltarModalForge.tsx` | About page only |

The particles that visibly *form modals and alerts* — the ones this work is about — are the **canvas-2D family**. Its renderer choice is deliberate (`ModalForgeEffect.tsx:12-15`): the Modal lives in the shared UI chunk both admin and storefront load, so pulling `vendor-three` into that path is not acceptable. **We keep the canvas-2D renderer and unify the maths and timing, not the renderer.**

Known duplication and drift:

- The rect-perimeter walk is implemented three times: `ModalForgeEffect.tsx:69-95`, `ToastForgeEffect.tsx:90-104`, `AltarModalForge.tsx:204-239` (a near-verbatim GLSL port).
- Constant drift: `Modal.tsx:16` `FORGE_MS = 1000` vs `ModalForgeEffect.tsx:18` `DURATION_MS = 950`.
- The altar has no timing module, violating animation-guidelines rule 5. `AboutOrbModal.tsx` hardcodes `1.6 / 1.68 / 1.7 / 1.92 / 2.1` that must be manually kept in sync with `AboutAltar`'s `0.35 + 0.9 + 0.3 + 0.55` chain.
- The orb colour never reaches the altar particles. `AltarModalForge.tsx:269-270` deliberately uses the site ember palette. `orb.color` currently only reaches the 3D stone's `uColor`, the picker chip, and four `color-mix()` sites in the modal.

The altar's effect is a **disintegration, not an explosion** (`AltarModalForge.tsx:47-51`) — per-seed staggered release along surface normals into a hovering shroud. This reads well and is being kept.

### Target state

One ember engine. Modals, toasts, and the About altar all draw from it. The altar's post-strike swarm is tinted with the orb's colour and forms the modal panel with the identical motion as every other dialog in the app.

### Changes

**B1. Extract the engine.**

New `src/shared/lib/forge/emberForge.ts` — framework-agnostic, no React, no DOM mounting:

```ts
export interface ForgeRect { left: number; top: number; width: number; height: number }

export interface ForgeRamp { cold: string; ember: string; hot: string }

/** Even-paced walk of a rect's perimeter. The single source for all three call sites. */
export function walkRectPerimeter(index: number, count: number, rect: ForgeRect): { x: number; y: number }

/** Resolve the ember colour ramp — theme default, or rebuilt around a tint. */
export function resolveForgeRamp(tint?: string): ForgeRamp

export function buildEmbers(options: {
  rect: ForgeRect
  origin?: { x: number; y: number }   // default: rect centre
  ramp: ForgeRamp
  count: number
  edgeShare: number
  spreadScale?: number
}): Ember[]

/** One animation frame. Caller owns the rAF loop and the rect (which may move). */
export function drawForgeFrame(
  ctx: CanvasRenderingContext2D,
  embers: Ember[],
  state: { t: number; now: number; ramp: ForgeRamp },
): void

export const FORGE_DURATION_MS: number   // one exported constant, kills the 950/1000 drift
```

New `src/shared/components/ui/ForgeEmberCanvas.tsx` — the React shell owning the canvas element, DPR scaling, the rAF loop, and teardown:

```tsx
interface ForgeEmberCanvasProps {
  /** Measured once on mount. */
  targetRef?: React.RefObject<HTMLElement | null>
  /** Or a live getter, re-measured each frame (toasts restack). */
  getRect?: () => ForgeRect | null
  origin?: { x: number; y: number }
  tint?: string
  durationMs?: number
  count?: number
  edgeShare?: number
  zIndex?: number
  onComplete?: () => void
}
```

`ModalForgeEffect` and `ToastForgeEffect` become thin wrappers over it, preserving their current constants (`520 / 0.62 / 950ms` and `130 / 0.68 / 720ms`). `Modal.tsx` imports `FORGE_DURATION_MS` instead of declaring its own.

**Non-negotiable:** with `tint` unset the output must be pixel-identical to today. Modals and toasts are not being redesigned.

**B2. Tint.**

`resolveForgeRamp(tint)`:

- Unset → today's exact ramp: `readThemeCssColor('--color-heading' | '--color-highlight' | '--color-highlight-bright')`.
- Set → the ramp is rebuilt around the tint using `src/shared/lib/color.ts`: a desaturated-light stop, the tint itself, and a brightened stop. The landing hot-core pass (`ModalForgeEffect.tsx:130-136`) keeps a near-white ember so it still reads as forged metal rather than flat neon.

**B3. Altar handoff.**

`AltarModalForge.tsx` keeps `uScatter` (the disintegration — unchanged, it already reads well) and **loses `uForm` / `uFormFade`**. It no longer attempts to form the panel; instead it fades its embers out across the handoff window.

`AboutAltar.tsx` mounts a `ForgeEmberCanvas` at the handoff beat with:

- `tint = orb.color`
- `origin` = the orb's seat position projected from 3D to screen pixels. `AboutAltar.tsx:121-127` already converts the modal rect to NDC; this is the inverse of the same maths, using the same camera.
- `targetRef` = the modal panel, which `AboutOrbModal.tsx:43` already measures pre-transform.

The 3D fade-out and the DOM swarm's arrival overlap so it reads as one continuous swarm crossing from the canvas into the DOM, not two effects in sequence.

**B4. Altar timing module.**

New `src/features/about/altar/altarForgeTiming.ts` exporting the whole clock — strike, disintegration, handoff, formation, panel reveal, content stagger, stat counters. `AboutAltar.tsx` and `AboutOrbModal.tsx` both derive their GSAP delays from it. This resolves the animation-guidelines rule 5 violation and removes the five magic numbers in `AboutOrbModal`.

**B5. Preserved behaviours.**

- Reduced motion: no forge canvas at all, modal fades in. Same as today.
- The `AboutOrbModal.tsx:51-53` gotcha stands — the backdrop blur must animate `backdropFilter`, not opacity, because Chromium keeps blurring the canvas at opacity 0.
- No `vendor-three` enters the shared UI chunk. `ForgeEmberCanvas` is canvas-2D only.

### Tests

- `emberForge.test.ts` — `walkRectPerimeter` covers all four edges and closes the loop; `resolveForgeRamp()` with no tint returns the three theme vars unchanged; with a tint returns three distinct colours derived from it.
- `ForgeEmberCanvas.test.tsx` — mounts, cancels its rAF on unmount, renders nothing under reduced motion, fires `onComplete`.
- Visual parity for modals/toasts is verified by review, not snapshot.

### Files

| File | Change |
|---|---|
| `src/shared/lib/forge/emberForge.ts` | new |
| `src/shared/components/ui/ForgeEmberCanvas.tsx` | new |
| `src/shared/components/ui/ModalForgeEffect.tsx` | reduce to wrapper |
| `src/shared/components/ui/ToastForgeEffect.tsx` | reduce to wrapper |
| `src/shared/components/ui/Modal.tsx` | import shared duration |
| `src/features/about/altar/altarForgeTiming.ts` | new |
| `src/features/about/altar/AltarModalForge.tsx` | drop formation phase, add fade-out |
| `src/features/about/altar/AboutAltar.tsx` | mount `ForgeEmberCanvas`, project orb origin, use timing module |
| `src/features/about/altar/AboutOrbModal.tsx` | derive delays from the timing module |

---

## C. CMS schema + admin editors for the guides

### Current state

`support_content` has, for these two pages:

- `careGuide = { intro, sections[], perProduct[slug] = { note, lines[], items[] } }`
- `sizeGuide = { intro, note, perProduct[slug] = { note, columns[], rows[], table? } }`

Not editable anywhere: the "Where we measure" heading, the A–G measurement points, the diagram, the half-measurement footnote, and the entire care-symbol vocabulary.

`CARE_SYMBOL_META` (`careSymbols.tsx:339-366`) already holds `{ label, meaning }` for 26 standard symbols and **is not rendered on the storefront at all** — only consumed by `careIconMeaning()`.

`CARE_SYMBOL_COMPONENTS` maps 40 keys, but only **26 are distinct glyphs**; the other 14 are legacy aliases pointing at the same components (e.g. `droplet → WashSymbol`). The legend shows the 26 distinct symbols; legacy keys stay supported for stored data but never appear as legend rows.

### Target state

Both pages are fully editable from `/admin/support`, including the measurement points and every care-symbol explanation.

### Schema additions

All new fields default blank/empty so the resolver falls through to code defaults — **nothing changes visually until edited**. This is the established `support_content` pattern (`supportContent.zod.ts:10-14`).

```ts
// Code-owned registry — CMS edits copy, never geometry.
export const GARMENT_TYPE_KEYS = ['tee', 'stringer', 'hoodie', 'joggers', 'shorts'] as const

export const measurePointSchema = z.object({
  key: z.enum(SIZE_TABLE_ROW_KEYS),   // unchanged persisted keys
  letter: z.string().catch(''),
  label: z.string().catch(''),
  description: z.string().catch(''),
}).strict()

export const garmentTypeContentSchema = z.object({
  key: z.enum(GARMENT_TYPE_KEYS),
  label: z.string().catch(''),
  points: z.array(measurePointSchema).catch([]),
}).strict()

export const sizeMeasureSchema = z.object({
  heading: z.string().catch(''),
  intro: z.string().catch(''),
  footnote: z.string().catch(''),
  garmentTypes: z.array(garmentTypeContentSchema).catch([]),
}).strict()

export const careLegendEntrySchema = z.object({
  label: z.string().catch(''),
  meaning: z.string().catch(''),
}).strict()

export const careLegendSchema = z.object({
  heading: z.string().catch(''),
  intro: z.string().catch(''),
  /** Overrides only, keyed by CareIconKey. Absent key = use the code default. */
  entries: z.record(z.string(), careLegendEntrySchema).catch({}),
}).strict()
```

Wired in as `sizeGuide.measure`, `careGuide.legend`, and `sizeGuide.perProduct[slug].garmentType` (optional enum, defaults to `tee`).

`parseSupportContent`'s deep-pick must be extended for all three, and `resolveSupportContent` gains `resolveMeasurePoints(garmentTypeKey)` and `resolveCareLegend()` following the existing blank-means-default `text()` convention.

### Care symbol categories

Code-owned, ISO grouping. 26 distinct symbols:

| Category | Count | Keys |
|---|---|---|
| Washing | 10 | `wash`, `wash-30`, `wash-40`, `wash-50`, `wash-60`, `wash-cold`, `wash-gentle`, `wash-hand`, `wash-inside-out`, `do-not-wash` |
| Bleaching | 2 | `bleach`, `do-not-bleach` |
| Drying | 7 | `tumble-dry`, `tumble-dry-low`, `tumble-dry-high`, `do-not-tumble-dry`, `line-dry`, `dry-flat`, `drip-dry` |
| Ironing | 5 | `iron`, `iron-low`, `iron-medium`, `iron-high`, `do-not-iron` |
| Professional care | 2 | `dry-clean`, `do-not-dry-clean` |

Lives in a new `CARE_SYMBOL_CATEGORIES` export alongside `CARE_SYMBOL_META`. Category membership is not editable; labels and meanings are.

### Measurement label rename

`SIZE_TABLE_ROW_KEYS` are **unchanged** — pure display-label change, no data migration. `SIZE_TABLE_ROW_LABELS` (`supportContent.zod.ts:201`) is updated, which flows to both `SizeTable.tsx:42` and the admin `SizeGuideTable.tsx:123,133`.

| key | today | new |
|---|---|---|
| `length` | Length | Body length |
| `chest` | Chest width | Chest |
| `waist` | Waist width | Waist |
| `bottom` | Bottom width | Hem |
| `collar` | Collar width | Neck opening |
| `sleeve` | **Sleeve width** | **Sleeve length** |
| `cuff` | Cuff width | Cuff opening |

Rationale: `sleeve` was genuinely mislabelled — the table said "width" while the diagram said "length" for the same row, on the same page. "Opening" beats "width" for collar and cuff because it is what a customer pictures, and it removes the width/length collision. The bare "width" suffix is dropped elsewhere because the *how* now lives in each point's `description` plus the half-measurement footnote.

Per-garment-type override: `bottom` reads **Hem** on `tee` / `stringer` / `hoodie` and **Leg opening** on `joggers` / `shorts`. These are defaults; all seven are CMS-editable.

### Admin editors

Two new tabs in `SupportEditor.tsx` (`SUPPORT_TABS`, currently six):

**Measurements** — garment-type sub-selector; per type: label field and a reorderable point list (letter, label, description) using the existing `useSortableList`. Plus heading, intro, footnote. A "reset to defaults" per garment type.

**Care symbols** — the same searchable, category-grouped grid the storefront renders, reusing the storefront component in an editing mode. Each cell opens an inline label + meaning editor with a per-entry "reset to default". Search and category filter mirror the storefront exactly so the editor previews what ships.

`PerProductSizeField` gains a garment-type `AdminFieldSelect`.

Both wire through the existing `useSingletonCmsEditor({ id: 'support' })` + `usePushPreviewDraft('supportContent', config)` path, so live preview works with no bridge changes.

### Seeding

The 26 `{ label, meaning }` pairs and the full measurement-point set are written as **code defaults** in `supportContent.defaults.ts` — authoritative, always render, work offline and on a fresh database.

Additionally, the same values are written into `cms_settings.support_content` and `storefront_publication.support_content` via the Supabase MCP so the editor opens pre-populated rather than showing empty fields. This is a data seed, not a migration — it is a JSON merge into two existing `jsonb` columns, touching only the new `careGuide.legend` and `sizeGuide.measure` sub-objects and leaving all existing keys intact. **The exact SQL is shown to the user for approval before it is run.**

### Tests

- `supportContent.zod.test.ts` — new blocks round-trip; unknown keys are stripped; malformed blobs degrade to defaults.
- `resolveSupportContent.test.ts` — blank override falls back to the code default; partial `entries` override merges per key; unknown garment type falls back to `tee`.
- Editor tests for the two new tabs following the existing `SizeGuideTable` / `CareSelector` patterns.

### Files

| File | Change |
|---|---|
| `src/features/cms/support/supportContent.zod.ts` | schemas, labels, categories, deep-pick |
| `src/features/cms/support/supportContent.defaults.ts` | 26 meanings + measurement points |
| `src/features/cms/support/resolveSupportContent.ts` | two new resolvers |
| `src/features/support/components/careSymbols.tsx` | `CARE_SYMBOL_CATEGORIES` |
| `src/features/admin/support/SupportEditor.tsx` | two new tabs |
| `src/features/admin/support/MeasurementsField.tsx` | new |
| `src/features/admin/support/CareLegendField.tsx` | new |
| `src/features/admin/support/PerProductSizeField.tsx` | garment-type select |

No Supabase **schema** change — `support_content` is already `jsonb` on both tables.

---

## D. Storefront redesign of the two guide pages

### D1. Size guide — "Where we measure"

Replaces the hardcoded block at `src/routes/size-guide.tsx:88-117`.

**Layout.** A garment-type tab strip above a two-column figure/list split (stacked on mobile). Tabs render only for garment types that have at least one product, plus always `tee`.

**Interaction.** Bidirectional highlight — hovering or focusing a measurement row highlights its dimension line and letter badge on the figure; hovering a figure hotspot highlights the list row. Keyboard-navigable via the list (the figure is `aria-hidden`, the list is the accessible source of truth, `aria-describedby` linking row to description). Touch: tapping a row highlights, no hover dependency.

**The figure.** Redesigned from scratch as a proper technical drawing, one SVG per garment type in a code-owned registry (`src/features/support/components/garments/`):

- Stroke hierarchy: garment outline heavier than dimension lines, dimension lines heavier than the ghost grid.
- Real dimension lines with tick caps, not bare arrows.
- A faint blueprint grid behind the garment, masked to the figure bounds.
- Letter badges as filled discs, legible at any theme.
- All colours from `--color-*` tokens; no hardcoded hex.
- GSAP `strokeDashoffset` draw-in on scroll at ≥768px + no reduced motion, static below. Registered through `src/shared/lib/gsap.ts`, `gsap.matchMedia` with both gates and `mm.revert()` on cleanup.

**Bug fixes.** The `<marker id="anvl-size-arrow">` is namespaced per instance via `useId()` — the PDP renders `SizeDiagram` alongside the guide, producing duplicate DOM ids today. `public/brand/size-diagram.svg` is deleted: an orphan twin referenced only from a code comment (`SizeDiagram.tsx:64`), free to drift.

### D2. Care guide — "Reading care symbols"

A new section on `src/routes/care-guide.tsx`, which is currently the thinner of the two pages (three blocks, no legend, no empty state).

**≥768px** — category-grouped grid of all 26 glyphs. Hover or keyboard focus opens a forged popover with label and meaning. The popover is the existing UI language, positioned with collision detection, dismissed on blur/Escape.

**<768px** — a table: glyph, label, meaning, grouped by category with sticky category headers. No hover dependency.

**Both** — a search field (debounced 250ms per the performance rules, matching label + meaning) and category filter chips. Pure client-side over the resolved list. An explicit empty state when a search matches nothing. Result count announced via `aria-live="polite"`.

The grid is a single component with a `mode: 'view' | 'edit'` prop so the admin Care-symbols tab reuses it directly and the editor previews exactly what ships.

### D3. Symmetry fixes

The two pages are currently asymmetric in ways that read as unfinished:

- `care-guide.tsx` uses `buildSeoMeta` while `size-guide.tsx` uses the fuller `buildSeoHeadForSiteStaticPath` with a `runtimeClients.seo` lookup. Care guide is brought up to match.
- Care per-product uses collapsed `AccordionDisclosure`; size uses always-open sections. Both become accordions, first item open.
- Care has no empty state where size has "Per-piece measurements coming soon". Care gains an equivalent.
- `DocHero` on the size guide is not passed `updatedAt`, so it shows no "Last updated" stamp. Both pages get one.

### D4. PDP

`PdpSupportDetails.tsx` consumes `SizeTable`, `SizeDiagram`, `SIZE_MEASUREMENT_POINTS`, and `CareLines` from the same data. It is updated for the new signatures: the per-product garment type selects the right schematic, and a compact care-symbol legend links through to the full guide. No visual redesign of the PDP in this work.

### Accessibility

- The figure is decorative (`aria-hidden`); the measurement list is the accessible source of truth.
- Symbol popovers are reachable by keyboard and dismissible with Escape.
- Status is never conveyed by colour alone — highlighted rows get a weight and border change, not just a tint.
- Heading cascade preserved; new sections are `<h2>` with `<h3>` category headings.
- All interactive elements get `focus-ring`.

### Files

| File | Change |
|---|---|
| `src/features/support/components/garments/*` | new registry + per-type SVGs |
| `src/features/support/components/SizeDiagram.tsx` | rewritten |
| `src/features/support/components/MeasurementFigure.tsx` | new (figure + list + linking) |
| `src/features/support/components/CareSymbolGrid.tsx` | new (view/edit modes) |
| `src/features/support/components/CareSymbolTable.tsx` | new (mobile) |
| `src/features/support/hooks/useCareSymbolSearch.ts` | new |
| `src/routes/size-guide.tsx` | new section, SEO parity |
| `src/routes/care-guide.tsx` | new section, SEO parity, empty state |
| `src/features/products/pdp/PdpSupportDetails.tsx` | new signatures |
| `public/brand/size-diagram.svg` | delete |

---

## Cross-cutting decisions

1. **Renderer split is preserved.** Canvas-2D for shared-chunk surfaces, three.js for cinematic ones. Unify maths and timing, never force one renderer.
2. **Code defaults are authoritative.** Every new CMS field defaults blank and resolves to a designed code default. The site renders correctly against an empty database.
3. **Persisted keys are never renamed.** `SIZE_TABLE_ROW_KEYS` and `CareIconKey` are stable. Only display labels change, so no migration is needed.
4. **No new Supabase schema.** Both blobs are existing `jsonb` columns.
5. **No new dependencies.**
6. **Legacy care keys stay supported forever** for stored data, but never appear as legend rows.

## Execution order and parallelism

```
A (admin nav)          ─── independent ──────────────┐
B (forge + altar)      ─── independent ──────────────┤
C (CMS schema+editors) ─── foundation ──┐            ├── verify
D (storefront pages)   ─────────────────┴─ needs C ──┘
```

A and B share no files with C or D and can run fully in parallel. C and D both touch `src/features/support/components/`, so C's schema and resolver land first; the admin editors in C and the storefront work in D can then proceed together, with `CareSymbolGrid` owned by D and consumed by C.

The Supabase seed runs last, after the schema is settled, and is shown for approval first.

## Risks

| Risk | Mitigation |
|---|---|
| Session cache leaks across users on the Worker | Cache is client-only and bypassed on the server. Explicitly tested. |
| Role revocation delayed up to 45s | Accepted. RLS is the real boundary; SSR and cold loads still validate every time. |
| Modal/toast visual regression from the extraction | `tint` unset must be pixel-identical; constants preserved exactly; reviewed side by side. |
| 3D → DOM handoff visibly seams | Overlapping fade window and a shared timing module; tuned against the real page. |
| Label rename confuses existing size data | Keys unchanged, values untouched. Display-only. |
| `SizeDiagram` rewrite breaks the PDP | PDP is updated in the same workstream; it is a known second consumer. |
| Supabase seed clobbers existing support content | Merge only the two new sub-objects; show the SQL before running; existing keys untouched. |

## Definition of done

- `pnpm verify` passes (typecheck + test + build).
- Admin page-to-page navigation shows feedback within ~120ms and no longer freezes.
- Both guide pages redesigned, interactive, and fully editable from `/admin/support`.
- All 26 care symbols documented, searchable, filterable, grouped — pre-seeded in Supabase.
- About orb modal forms from orb-tinted embers using the same engine as every other modal.
- Modals and toasts visually unchanged.
- Docs updated: `docs/project-map.md`, `docs/cms-architecture.md`, `docs/animation-guidelines.md`, `docs/changelog.md`, and the folder structure in `CLAUDE.md`.
