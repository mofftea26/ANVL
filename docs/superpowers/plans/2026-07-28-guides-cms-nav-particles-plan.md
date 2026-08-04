# Implementation plan — Admin nav, guide redesign + CMS, unified ember forge

**Spec:** `docs/superpowers/specs/2026-07-28-guides-cms-nav-particles-design.md`
**Branch:** `feat/guides-cms-nav-particles`
**Date:** 2026-07-28

Read the spec section referenced by each task. The spec is authoritative for
*what*; this plan is authoritative for *sequencing and scope boundaries*.

---

## Global Constraints

These bind every task. A reviewer should treat a violation as a defect.

1. **TypeScript strict.** No `any` without a one-line justification comment.
   No `as unknown as T`. `verbatimModuleSyntax` is on — type-only imports
   must use `import type`. `noUnusedLocals` / `noUnusedParameters` are on.
2. **Feature boundaries.** `src/shared/**` imports nothing from `features/`
   or `routes/`. Storefront code never imports `src/features/admin/**` at
   runtime. Only `src/routes/**` imports from both features and shared.
3. **SSR safety.** No `window`, `document`, `localStorage`, or `matchMedia`
   at module top level or during render. Gate in `useEffect` or behind
   `typeof window !== 'undefined'`. This codebase runs SSR on `workerd`.
4. **Zod is the single source of truth for types.** Never hand-write a type
   a schema already defines — always `z.infer`. Persistence schemas are
   `.strict()`.
5. **CMS blank means default.** Every new CMS field defaults to `''` / `[]`
   / `{}` in the persistence schema. The render-ready value comes from the
   resolver merging over full designed defaults. The site must render
   correctly against an empty database.
6. **Persisted keys are never renamed.** `SIZE_TABLE_ROW_KEYS` and
   `CareIconKey` values are stable. Display labels may change; keys may not.
   No data migration is permitted in this work.
7. **GSAP rules.** Import from `src/shared/lib/gsap.ts`, never from `gsap`
   directly. Always `useGSAP` from `@gsap/react`. Always `gsap.matchMedia`
   with both a min-width gate and
   `(prefers-reduced-motion: no-preference)`, plus a mirror branch that
   snaps via `gsap.set`. Always `mm.revert()` in cleanup. Animate
   `transform` and `opacity` only.
8. **Styling.** Tailwind v4 utilities plus CSS variable tokens from
   `src/styles.css`. No hardcoded hex. `cn()` for conditional classes.
   Mobile-first. Touch targets ≥44×44px. Inputs `text-base md:text-sm`.
9. **Accessibility.** Semantic HTML. Heading cascade unbroken. Decorative
   icons `aria-hidden="true"`. Every interactive storefront element gets
   `focus-ring`. Status never conveyed by colour alone. Dialogs wire
   `useDialogFocusTrap`.
10. **Performance.** Debounce text inputs driving expensive recomputes at
    ≥250ms. Scroll listeners `{ passive: true }`. No forced layout reads in
    scroll/resize handlers. Icons: named imports from `@/shared/icons` only.
11. **File size.** Soft limit 300 lines, hard limit 500. A file over 500
    lines needs a written reason in a header comment.
12. **No new dependencies.** No `console.log` in production code.
13. **Tests.** Co-locate in `__tests__/`. Use the `@/` alias. Do not import
    animation libraries in tests (mocked in `src/test/setup.ts`). Test
    behaviour, not CSS class names. No large DOM snapshots.
14. **Verification.** Every task ends with `pnpm typecheck` and the tests
    covering the changed code, both passing, with output quoted in the
    report. `pnpm build` is run by the final task only.

---

## Task 1 — Admin navigation responsiveness

**Spec:** section A. **Depends on:** nothing.

Implement A1 through A5 exactly as specified:

- `src/shared/components/layout/RouteProgressBar.tsx` (new) — driven by
  `useRouterState({ select: (s) => s.isLoading })`, `scaleX` transform on a
  `transform-origin: left` element, 120ms entry delay, 200ms fade-out,
  `aria-hidden="true"`, reduced-motion branch. Colour from
  `--color-highlight-bright` so `AdminThemeProvider` re-points it for free.
- Mount it in `src/routes/__root.tsx`.
- `src/router.tsx` — add `defaultPendingMs: 120`, `defaultPendingMinMs: 200`.
- `src/features/admin/auth/adminAuthCache.ts` (new) — exports
  `getCachedAdminSession(options?: { force?: boolean })` and
  `invalidateAdminSessionCache()`. Caches the in-flight promise as well as
  the resolved value. TTL 45s (a named constant, not a magic number).
  Caches only successful authenticated results.

  **Critical:** the cache must be bypassed entirely when running on the
  server. A Cloudflare Worker isolate is shared across requests and users,
  so a server-side cache is a cross-request auth leak. Gate on
  `typeof window === 'undefined'`.
- `src/routes/admin/route.tsx` — `beforeLoad` calls `getCachedAdminSession()`.
- `src/features/admin/auth/AdminAuthProvider.tsx` — mount effect uses the
  cache; the 10-minute heartbeat uses `{ force: true }`. Remove the
  duplicate cold-load fetch.
- Call `invalidateAdminSessionCache()` on logout and on any admin Supabase
  401.
- `preload={false}` on the admin nav `<Link>`s in `AdminSidebar.tsx` and
  `AdminTopbar.tsx`.

**Tests:** `adminAuthCache.test.ts` — concurrent callers share one promise;
TTL expiry refetches; failures are not cached; `invalidate()` clears;
**server context bypasses the cache**. `RouteProgressBar.test.tsx` — hidden
when idle, visible when loading, reduced-motion branch.

**Do not:** change what `validateAdminSessionFromCookie` itself does. The
cookie seal, the Supabase refresh, and the role check stay exactly as they
are. This task adds a cache in front, nothing more.

---

## Task 2 — Extract the shared ember forge engine

**Spec:** section B, items B1 and B2. **Depends on:** nothing.

Create `src/shared/lib/forge/emberForge.ts` and
`src/shared/components/ui/ForgeEmberCanvas.tsx` with the exact signatures
in the spec. Reduce `ModalForgeEffect.tsx` and `ToastForgeEffect.tsx` to
thin wrappers. Point `Modal.tsx` at the exported `FORGE_DURATION_MS`
instead of its own `FORGE_MS`.

**The hard requirement:** with `tint` unset, modal and toast output must be
**pixel-identical to today**. Preserve every existing constant exactly —
modal `COUNT = 520`, `EDGE_SHARE = 0.62`, `DURATION_MS = 950`; toast
`COUNT = 130`, `EDGE_SHARE = 0.68`, `DURATION_MS = 720`. Preserve the
existing motion maths verbatim: the `smoothstep(0.62, 0.98, t)` dissolve,
the `t * 1.55 - seed * 0.45` per-seed stagger, the
`0.7 + 0.3 * sin(now * 0.02 + seed * 40)` flicker, the `p > 0.85` hot-core
pass, and `globalCompositeOperation = 'lighter'`.

Preserve `ToastForgeEffect`'s live re-measurement (it re-reads the rect
every frame so embers track sonner restacking) — that is what the
`getRect` prop is for. `ModalForgeEffect` measures once via `targetRef`.

`resolveForgeRamp(tint?)`: unset returns the three theme vars unchanged
(`--color-heading`, `--color-highlight`, `--color-highlight-bright` via
`readThemeCssColor`). Set rebuilds the ramp around the tint using
`src/shared/lib/color.ts`. Keep a near-white hot core so it reads as
forged metal, not flat neon.

**Canvas-2D only.** This module is in the shared UI chunk that admin and
storefront both load. Importing three.js here is a hard failure — see the
rationale comment at `ModalForgeEffect.tsx:12-15` and preserve it.

**Tests:** `emberForge.test.ts` — `walkRectPerimeter` covers all four edges
and closes the loop; `resolveForgeRamp()` with no tint returns the theme
values unchanged; with a tint returns three distinct derived colours.
`ForgeEmberCanvas.test.tsx` — mounts, cancels rAF on unmount, renders
nothing under reduced motion, fires `onComplete`.

---

## Task 3 — About altar handoff

**Spec:** section B, items B3, B4, B5. **Depends on:** Task 2.

Create `src/features/about/altar/altarForgeTiming.ts` exporting the full
clock (strike, disintegration, handoff, formation, panel reveal, content
stagger, stat counters). `AboutAltar.tsx` and `AboutOrbModal.tsx` both
derive their GSAP delays from it — this removes the hardcoded
`1.6 / 1.68 / 1.7 / 1.92 / 2.1` in `AboutOrbModal.tsx` and the
`0.35 + 0.9 + 0.3 + 0.55` chain in `AboutAltar.tsx`.

`AltarModalForge.tsx`: keep `uScatter` and the disintegration **exactly as
it is** — it is the part the user likes. Remove `uForm` and `uFormFade`
and the formation targets they drive. Add a fade-out across the handoff
window.

`AboutAltar.tsx`: mount `ForgeEmberCanvas` at the handoff beat with
`tint = orb.color`, `targetRef` = the modal panel, and `origin` = the orb's
seat position projected from 3D to screen pixels. `AboutAltar.tsx:121-127`
already does rect → NDC with the scene camera; this is the inverse using
the same camera. The 3D fade-out and the DOM swarm must overlap so it reads
as one swarm crossing from canvas into DOM.

**Preserve:** reduced motion renders no forge canvas and the modal simply
fades (as today). The `AboutOrbModal.tsx:51-53` constraint stands — the
backdrop blur must animate `backdropFilter`, not opacity, because Chromium
keeps blurring the canvas at opacity 0.

---

## Task 4 — CMS schema, defaults, resolvers, label rename

**Spec:** section C, "Schema additions" through "Measurement label rename".
**Depends on:** nothing. **Blocks:** Tasks 5, 6, 7.

- `supportContent.zod.ts` — add `measurePointSchema`,
  `garmentTypeContentSchema`, `sizeMeasureSchema`, `careLegendEntrySchema`,
  `careLegendSchema`, and `GARMENT_TYPE_KEYS`. Wire them in as
  `sizeGuide.measure`, `careGuide.legend`, and an optional
  `sizeGuide.perProduct[slug].garmentType` defaulting to `tee`. Extend
  `parseSupportContent`'s deep-pick for all three.
- Update `SIZE_TABLE_ROW_LABELS` per the spec's rename table. Keys
  unchanged. This flows to `SizeTable.tsx:42` and the admin
  `SizeGuideTable.tsx:123,133` automatically — verify both still read
  correctly.
- `careSymbols.tsx` — add `CARE_SYMBOL_CATEGORIES` with the five ISO
  categories and their exact membership from the spec. 26 distinct symbols.
  The 14 legacy alias keys stay supported for stored data but are not
  legend members.
- `supportContent.defaults.ts` — add the full designed defaults: all 26
  `{ label, meaning }` pairs (seed from the existing `CARE_SYMBOL_META`,
  refining the copy where it reads thin) and the measurement-point sets for
  all five garment types, including the per-type `bottom` label override
  (Hem on tee/stringer/hoodie, Leg opening on joggers/shorts).
- `resolveSupportContent.ts` — add `resolveMeasurePoints(garmentTypeKey)`
  and `resolveCareLegend()`, following the existing blank-means-default
  `text()` convention. Unknown garment type falls back to `tee`. A
  `careGuide.legend.entries` key that is absent uses the code default;
  present-but-blank fields fall back per field.

**Tests:** extend `supportContent.zod.test.ts` (new blocks round-trip,
unknown keys stripped, malformed blobs degrade to defaults) and
`resolveSupportContent.test.ts` (blank override falls through, partial
`entries` merges per key, unknown garment type falls back to `tee`).

**Do not:** touch any storefront or admin component in this task beyond
what the label rename requires. Components come in Tasks 5-7.

---

## Task 5 — Shared support components

**Spec:** section D, items D1 and D2 (the components, not the pages).
**Depends on:** Task 4. **Blocks:** Tasks 6, 7.

- `src/features/support/components/garments/` — a code-owned registry, one
  SVG schematic per `GARMENT_TYPE_KEYS` entry, each exposing named hotspot
  anchors per measurement key so the figure can position dimension lines
  and letter badges from data rather than hardcoding them per type.
  Redesigned per the spec: stroke hierarchy, real dimension lines with tick
  caps, masked blueprint ghost grid, filled letter-badge discs, all colours
  from `--color-*` tokens.
- `MeasurementFigure.tsx` — figure plus list, bidirectional hover/focus
  highlight, keyboard-navigable via the list, figure `aria-hidden`, list
  rows `aria-describedby` their description. GSAP `strokeDashoffset`
  draw-in at ≥768px + no reduced motion, static below.
- Rewrite `SizeDiagram.tsx` on top of the registry. Namespace the
  `<marker>` id with `useId()` — the PDP renders this alongside the guide
  today and produces duplicate DOM ids.
- `CareSymbolGrid.tsx` — category-grouped grid of all 26 glyphs, hover or
  keyboard-focus popover with label and meaning, collision-aware
  positioning, dismiss on blur and Escape. Takes a
  `mode: 'view' | 'edit'` prop; in `edit` mode each cell renders an inline
  label + meaning editor slot supplied by the caller, so the admin tab
  reuses this component verbatim.
- `CareSymbolTable.tsx` — the <768px presentation: glyph, label, meaning,
  grouped with sticky category headers. No hover dependency.
- `useCareSymbolSearch.ts` — 250ms debounced search over label + meaning
  plus category filtering. Returns the filtered grouping and a result count
  for `aria-live` announcement.

**Do not:** modify the routes or the PDP in this task.

---

## Task 6 — Storefront guide pages

**Spec:** section D, items D1, D2, D3, D4. **Depends on:** Task 5.

- `src/routes/size-guide.tsx` — replace the hardcoded block at lines 88-117
  with the garment-type tab strip over `MeasurementFigure`. Tabs render for
  garment types that have at least one product, plus always `tee`.
- `src/routes/care-guide.tsx` — add the "Reading care symbols" section:
  `CareSymbolGrid` at ≥768px, `CareSymbolTable` below, with the search
  field, category filter chips, an explicit no-results empty state, and an
  `aria-live="polite"` result count.
- Symmetry fixes (D3): bring `care-guide.tsx` up to
  `buildSeoHeadForSiteStaticPath` with the `runtimeClients.seo` lookup to
  match `size-guide.tsx`; make both per-product lists accordions with the
  first item open; give the care guide an empty state matching the size
  guide's "coming soon" card; pass `updatedAt` to `DocHero` on both.
- `PdpSupportDetails.tsx` — update for the new signatures. The per-product
  garment type selects the right schematic; add a compact care-symbol
  legend linking to the full guide. **No PDP redesign** — keep it working,
  nothing more.
- Delete `public/brand/size-diagram.svg` (orphan; referenced only from a
  code comment at `SizeDiagram.tsx:64`).

**Tests:** extend `supportComponents.test.tsx` — search filters, category
filter, empty state, bidirectional highlight sets the expected ARIA state.

---

## Task 7 — Admin editors

**Spec:** section C, "Admin editors". **Depends on:** Tasks 4 and 5.

Add two tabs to `SUPPORT_TABS` in `SupportEditor.tsx` (currently six):

- **Measurements** — heading, intro, footnote; a garment-type sub-selector;
  per type a label field and a reorderable point list (letter, label,
  description) using the existing `useSortableList`; "reset to defaults"
  per garment type. New file `MeasurementsField.tsx`.
- **Care symbols** — reuse `CareSymbolGrid` in `mode="edit"`, supplying the
  inline label + meaning editor and a per-entry "reset to default". Search
  and category filter come from the same `useCareSymbolSearch` hook the
  storefront uses, so the editor previews exactly what ships. New file
  `CareLegendField.tsx`.
- `PerProductSizeField.tsx` — add a garment-type `AdminFieldSelect`.

Both tabs wire through the existing
`useSingletonCmsEditor({ id: 'support' })` and
`usePushPreviewDraft('supportContent', config)` — no preview-bridge changes
should be needed. Verify live preview still works.

**Tests:** follow the existing `SizeGuideTable.test.tsx` /
`CareSelector.test.tsx` patterns.

---

## Task 8 — Supabase seed, verification, documentation

**Depends on:** all previous tasks.

1. Run `pnpm verify` (typecheck + test + build). Fix anything that fails.
2. Compose the Supabase seed as a **JSON merge** into the existing `jsonb`
   columns `cms_settings.support_content` and
   `storefront_publication.support_content`, writing only the new
   `careGuide.legend` and `sizeGuide.measure` sub-objects and leaving every
   existing key intact. Bump `storefront_publication.revision` and
   `published_at` as `adminCmsRemoteSync` does.

   **Do not execute it.** Write the SQL to
   `supabase/seeds/2026-07-28-support-guides-seed.sql` and surface it for
   the user to approve. There is no schema change — both columns already
   exist.
3. Documentation: `docs/project-map.md` (new folders), `docs/cms-architecture.md`
   (the two new `support_content` blocks and the two new admin tabs),
   `docs/animation-guidelines.md` (the shared canvas-2D forge engine and
   the altar's now-compliant timing module), `docs/changelog.md` (append),
   and the folder structure in `CLAUDE.md`.

---

## Task 9 — Forge performance, and orb colour through the explosion and modal chrome

**Added 2026-07-28 from user feedback after Task 3.** **Depends on:** Task 3.

Three related changes. All are user-requested, and where they conflict with
an earlier task's constraint, this task governs — say so explicitly rather
than silently regressing the earlier guarantee.

### 9a. Make the ember animation smooth and cheap

The modal particle animation stutters. The engine currently issues, per
frame, one `beginPath()` + `arc()` + `fill()` per ember plus a `fillStyle`
and `globalAlpha` assignment each — 520 path fills and 1040 canvas state
changes at the modal's count, doubling to ~1040 fills once embers pass the
`p > 0.85` hot-core threshold. That is the bottleneck.

Required optimisations, in rough order of payoff:

1. **Pre-rendered sprites instead of path fills.** Build a small offscreen
   canvas per ramp colour once (a radial-gradient ember), then `drawImage`
   it per ember. Blitting is far cheaper than path construction plus fill.
2. **Batch by colour.** Group embers into their three ramp buckets and draw
   each bucket together, so `fillStyle` / sprite switches happen three times
   per frame instead of 520.
3. **Quantise alpha.** Per-ember `globalAlpha` assignment is a state change.
   Pre-render a small number of alpha tiers per colour and pick the nearest,
   or otherwise avoid a per-ember state write.
4. **Stop clearing and sizing the whole viewport.** The swarm occupies a
   known bounding box (launch ring around the origin, union the target rect).
   Size the canvas to that box, position it absolutely, and clear only it.
5. **Drop the per-ember `Math.sin` per frame.** Precompute a flicker lookup
   table, or derive per-ember flicker from one shared per-frame sin plus a
   cheap per-seed offset.
6. **Cap DPR lower for this effect** — it is a sub-second transient glow;
   full 2× on a full-viewport canvas is wasted fill rate. Justify whatever
   cap you pick in a comment.

On the About page specifically, the R3F altar scene's render loop runs
concurrently with this DOM canvas. Investigate whether that contention is
part of the stutter, and if so throttle or pause the 3D loop across the
handoff window. Measure before and after — report frame timings or draw-call
counts, not adjectives.

**Constraint change, stated deliberately:** Task 2 required modal and toast
output to be pixel-identical to the pre-refactor implementation. Sprite
blitting anti-aliases differently from path filling, so that guarantee is
**relaxed to "visually equivalent, and intentionally smoother"** for this
task only. What still binds: the two tuning presets keep their distinct
per-surface values, the regression test pinning those differences stays
green, and the modal and toast must not visibly diverge *from each other*
in feel. Do not use this relaxation as licence to retune motion.

### 9b. Orb colour through the 3D explosion

`AltarModalForge.tsx:269-270` deliberately reads the site ember palette and
comments that it is "never a per-orb neon". The user has now asked for the
opposite: the explosion itself should carry the struck orb's colour, as the
DOM swarm already does after Task 3.

Feed `orb.color` into the shader's `uColdColor` / `uEmberColor` / `uHotColor`
ramp, deriving the three stops the same way `resolveForgeRamp(tint)` derives
them for the DOM engine, so the in-canvas embers and the DOM swarm are the
same colour through the handoff. Keep a near-white hot stop so it still
reads as forged metal rather than flat neon. Update that stale comment.

### 9c. Orb colour on the modal's close button

The modal's X / close control should be tinted to match the orb and the rest
of the modal's accents. `AboutOrbModal.tsx` already derives orb-coloured
accents via `color-mix()` at lines 135, 147, 154 and 163-164 — follow that
existing pattern rather than inventing a second mechanism. Keep the
`focus-ring`, keep the ≥44×44px touch target, and keep contrast at WCAG AA
against the panel for every orb colour in the CMS-authored set, not just the
default one.

---

## Sequencing

```
Task 1  (admin nav)        independent
Task 2  (forge engine)     independent
Task 3  (altar)            after 2
Task 9  (forge perf, tint) after 3
Task 4  (CMS schema)       independent, blocks 5/6/7
Task 5  (components)       after 4
Task 6  (pages)            after 5
Task 7  (admin editors)    after 4 and 5
Task 8  (seed + docs)      last
```

Tasks are dispatched one at a time — never two implementers concurrently.
