# Feature — Drops CMS

> **ARCHIVED — do not implement (2026-06).** The multi-drop builder described below has been **removed**. The CMS no longer authors drops; landing pages are code-owned (`src/features/landingPages/`, registry-driven), the storefront renders one active landing-page key, and theming is one global 15-token palette. This file is retained only as historical context for the prompts/plans that reference it.
>
> **Current docs:** `docs/landing-pages.md` (code-owned landing pages), `docs/cms-architecture.md` (current CMS surfaces + admin layout), `docs/design-system.md` (15-token theme palette), `docs/project-map.md` (current folder/route map).

## Purpose
Drops are the central content unit for ANVL campaigns. Each drop controls the landing page content, campaign theme, release date, drop page, and linked products.

## Drop statuses
- `draft`: being created, not public.
- `inactive`: ready but not active.
- `scheduled`: will activate on `scheduledActivationAt`.
- `active`: powers landing page and active drop route/nav label.
- `archived`: hidden from active selection but kept for history.

Only one drop can be active.

## Public landing performance
- `PublicLandingActs` lazy-loads act sections (including `HeroForgeSequence`) with `React.lazy` and per-act `Suspense` fallbacks so heavy marketing chunks are not all required for the first interactive paint.

## Admin editor bundles
- `/admin/drops/$dropId` is a thin `lazyRouteComponent` shell (`-dropEditorPage.tsx`); the drop editor / acts builder / previews split into their own async chunks at build time.
- **`DropEditorRoute`** wraps **`DropActsBuilderPanel`** in **`React.lazy`** + **`Suspense`** so the large builder module is fetched as a separate chunk (see audit `PERF-02`). Legacy per-section **`landingContent`** Act I–VI forms were removed from the admin UI; persisted **`Drop.landingContent`** remains for storefront/default compose and optional **Reset acts from landing copy** in the builder.

## Drop fields
```ts
type Drop = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  status: 'draft' | 'inactive' | 'scheduled' | 'active' | 'archived';
  releaseDate?: string;
  scheduledActivationAt?: string;
  theme: DropTheme;
  brand: DropBranding;
  heroMedia?: MediaAsset;
  dropPage: DropPageContent;
  acts: LandingAct[];
  productIds: string[];
  seo: SeoDocument;
  createdAt: string;
  updatedAt: string;
};
```

Canonical fields for the current codebase live in `src/features/admin/drops/drops.types.ts` — notably `visuals.heroImageUrl` for the public drop hero backdrop, `landingActSequence` / composed `landingActs` for the homepage pipeline, and `seo.ogTitle` / `seo.ogDescription` for social overrides on `/drop/:slug`.

## Drop theme
```ts
type DropTheme = {
  paletteName: string;
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    text: string;
    textMuted: string;
    accent: string;
    border: string;
    glow?: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
};
```

### Drop editor tab highlights
- **Theme:** `DropThemePaletteCard` surfaces presets, a token swatch strip, debounced color controls, **Revert palette** (diff vs last saved snapshot), and **Copy JSON** for stash/share — **Save drop** still persists `Drop.theme` to storage.
- **Visuals / media:** The **Visuals** tab groups **emblem → wordmark → hero**, then **additional lockups** (campaign logo, loading emblem). **`MediaPickerField`** supports **`fallback="crest" | "wordmark" | "none"`**, **`fallbackPreviewSrc`** chaining (e.g. wordmark tries logo, then emblem, then global emblem fallback), **`onError`** recovery to inline SVG marks (no broken preview icons), and **`AdminSpinner`** during FileReader embeds.
- **Products:** Card roster with primary thumbnail + **Quick create product** modal — **`MediaPickerField`** primary asset, **`AdminSelect`** for currency / status / listing origin, comma-separated sizes → variant rows, **Quantity** → persisted **`stockQuantity`** per variant (`buildQuickCreateAdminProduct`), optional **Link this drop** (`dropIds` / `productIds` sync via **`upsertAdminProduct`** + **`persistProductDropLinks`**). **Color hex** uses **`DebouncedColorField`** with **`density="compact"`** ( **`h-10`** bordered row + inset chip, aligned with **`AdminInput`**; popover UX unchanged). Roster layout uses **named Tailwind container queries** (`@container/drop-products`, `@container/drop-product-card`) so the **`xl`** ~**460px** editor rail stays **single-column** with stacked thumb + metadata (no misleading viewport **`sm:`** two-up), while wider stacked layouts can still show two cards across; titles **`line-clamp-2`**, status / listing pills, and **`min-w-0`** guard overflow. Full PDP SEO + advanced matrix edits remain on **`ProductEditorRoute`**.
- **SEO:** Split **Core metadata** vs **Open Graph** panels for faster scanning on long campaigns.

## CMS UX
The Drops section should be simple:
1. Drop list with search, status tabs, release date, scheduled activation, product count, and last edited date.
2. Clear actions: Create, Edit, Preview, Duplicate, Set Active, Schedule, Archive, Delete.
3. The admin list (`DropsAdminList` at `/admin/drops`) uses the runtime `CmsClient` for reads and mutations, TanStack Query for server state, and a small Zustand store for search and tab UI only.
4. **Empty states:** when the CMS returns zero drops, the list shows a “No drops yet” card with a link to `/admin/drops/new`; when filters exclude every row, a “Nothing matches” card offers one tap to clear search + status tab.
5. Create Drop flow:
   - **`/admin/drops/new`** is a bootstrap route: it calls **`createDraftDropAsync`**, which persists a draft via **`createDraftDrop`** / **`saveDrop`**, and when Supabase is configured immediately **`insert`s** into **`public.anvl_drops`** (so login hydration cannot wipe a local-only draft). On success it **`replace`‑navigates** to **`/admin/drops/:id`**. While that runs, **`AdminSpinner`** + copy replace a transient “Missing drop” flash. Failures (e.g. slug collision) surface an alert + back link.
   - Step 1: Basic info.
   - Step 2: Theme/branding.
   - Step 3: Acts builder.
   - Step 4: Products assignment.
   - Step 5: SEO.
   - Step 6: Save options.
6. Save options:
   - Save as draft.
   - Save and set inactive.
   - Save and make active.
   - Save and schedule.

## Live preview
The CMS must show a live preview while editing:
- Theme changes update instantly via `DropPreviewThemeScope` (draft palette as CSS variables inside the preview frame).
- **Drop editor** preview calls `composeLandingPageFromDrop(drop, layout, { editorActsPreview: true, editorPreviewHeroFallback: true })` so `landingActs` are built **only** from `Drop.acts` when there is at least one **enabled** row. If `acts` is empty or **every** row is disabled, `editorPreviewHeroFallback` supplies a **single hero** public act via `publicLandingActsHeroSlotOnly()` (canonical homepage slot wiring + Drop 01 presets — same as filtering `landingActSequence` to hero only; copy still comes from the draft’s composed `landing.hero` so it tracks `landingContent` / Oath defaults). There is **no** full `landingActSequence` merge in editor mode.
- The storefront / non-decode path still uses `landingActSequence` via `composeLandingPageFromDrop` without `editorActsPreview` when `acts` is empty (homepage-style merge).
- **Act row overlay:** in the drop editor, `DropEditorLivePreview` passes `draftActs` into `PublicLandingActs`, which merges each act’s eyebrow/title/subtitle/body and nature-specific `content` (e.g. hero CTAs) over the composed landing section defaults so builder edits reflect immediately in the preview.
- Desktop / tablet / mobile viewport toggles on `DropEditorLivePreview`.
- Unknown act natures show an explicit CMS-only warning in preview (`cmsPreview`); unexpected render errors are caught by `DropEditorPreviewErrorBoundary` with a retry control.
- Preview must not mutate published data until Save (draft state only until `saveDrop`).

### Supabase publish path (MVP)

When **`VITE_SUPABASE_URL`** and an anon key are configured, the **live storefront** reads **`storefront_publication`** (singleton `id = 1`) so SSR and anonymous clients match:

- **`published_drop_snapshot`** — full **`persistedDropSchema`** drop (theme, visuals, landing, acts, SEO, product ids, etc.).
- **`website_layout`** — **`persistedWebsiteLayoutSchema`** (includes **`header.announcement`**; **`getAnnouncementBar`** in the Supabase read slice prefers this so nav chrome is a single source).
- **`site_seo`** — same shape as **`parseSiteSeoUnknown`** / `SiteSeoContent`.
- **`products_snapshot`** — jsonb array of **`persistedProductSchema`** rows copied from **`cms_admin_products`** on publish (shop + PDP use **`CommerceClient`** backed by this snapshot when Supabase is on).
- **`catalog_drop_index`** — `{ id, slug, name, dropNumber }[]` for drops referenced by catalog products (filters / PDP “drop” label meta).
- **`global_brand`** — optional **`persistedGlobalBrandSchema`** (emblem fallbacks); merged with app defaults when null/invalid.
- **`campaigns`**, **`lookbook`** — public homepage cards / tiles; when non-empty, Supabase readers stop returning CMS mocks for these slices.
- **`legacy_landing_cms`** — optional blob reserved for migrating off **`anvl.landingCms.v1`**.

**Publishing** (demote other actives, copy winning draft → snapshot, refresh catalog snapshots) is **`cms_publish_drop(uuid)`** (`SECURITY DEFINER`, **`cms_profiles`** roles **`editor` / `admin`**) or the **`publish-storefront`** Edge Function forwarding the user JWT. Product edits in **`cms_admin_products`** appear on the storefront after the next publish (or a future trigger). Editor persistence from the React admin to Supabase tables and Auth replacing **`VITE_ANVL_ADMIN_*`** are tracked in **`docs/features/supabase-cms.md`**.

### Preview-centric editor layout
- `DropEditorRoute` uses a **two-column flex row** from the **`xl` breakpoint** so tablet-width viewports stay **single-column** (no cramped split). Below `xl`, **Hide / Show live preview** on the **Live preview** card header (**`AdminCard` actions**, `xl:hidden`) collapses the preview chrome; **`xl`+** has no collapse control.
- **Resizable split (`xl`+):** a vertical **sash** (separator) between **Live preview** and the form column supports **pointer-drag** with capture; preview width is clamped between **320px** and **70%** of the split container. The last width is persisted in **`localStorage`** (`ANVL_DROP_EDITOR_PREVIEW_SPLIT_PX`) when the drag ends (or when using **←/→** with the sash focused). The wrapper uses **`overflow-x-hidden`**, **`min-w-0`**, and **`overscroll-x-contain`** so dragging does not introduce horizontal **page** scroll; column width does not animate (compatible with **prefers-reduced-motion** expectations).
- On **`xl+`**, the split row uses **`items-stretch`** and **`DROP_EDITOR_SPLIT_XL_MIN_H_CLASS`** (same `min-h` calc as the preview column) so the row has a **viewport-based floor** while the **live preview** column and **builder** column ( **tabs + forms** ) share the same **row height** (the taller of the two). The preview column sets **`min-h-[calc(100dvh-var(--admin-topbar-height)-var(--admin-main-block-gutter)-…)]`** (`DROP_EDITOR_PREVIEW_PANE_MIN_H_CLASS` in `dropEditorRoute.shared.ts`) using **`--admin-topbar-height`** and **`--admin-main-block-gutter`** (**`3rem`**, ~**`main`** vertical padding) from **`src/styles.css`**; **`xl:h-full`** + **`xl:self-stretch`** preserve row-driven height when the builder rail is taller than that minimum. Long compositions scroll **inside** the preview card; the **form column** scrolls with **`AdminLayout` `main`** only (**`overflow-visible`**, no nested column scroll). Tab **`AdminCard`**s use **`h-auto`** so short tabs (e.g. **Basics**) do not leave a full-height empty card.
- The tab strip lights up with a small red dot when a section has unresolved validation errors. Save attempts auto-jump to the first errored tab and toast the issue count.
- Inline error hints render directly below each invalid field (color, slug, alt text, URLs, SEO length).
- After a confirmed save, the primary “Save drop” control briefly shows a checkmark “Saved” state (`useSaveSuccessFlash`).

### Responsive iframe preview
- **Outer shell:** The preview column (`data-testid="drop-editor-preview-column"`) uses the viewport **`min-h`** above plus an inner **`min-h-0`** flex chain into **`AdminCard`** / **`DropEditorLivePreview`**; overflow scrolls in the **`DropEditorLivePreview`** chrome (**`overflow-y-auto`**) so the **viewport pills** stay above the scroll region (`shrink-0`) and the page layout does not grow from the iframe subtree.
- `DropEditorLivePreview` exposes four viewport pills: **Fit** (default, iframe **`width: 100%`** / **`max-width: 100%`** in the preview pane), **Mobile 390**, **Tablet 820**, **Desktop 1280**.
- **Fit** uses the same **portal-into-iframe** path as other modes (at **100%** iframe width) so breakpoints still follow the iframe’s width.
- Mobile / Tablet / Desktop share one **`ViewportIframe`** instance (no **`key`** remount per breakpoint) so the portal target stays mounted while widths tween — avoids the blank-frame / layout-collapse flash when switching devices.
- Mobile / Tablet / Desktop render the preview inside a **portal-into-iframe** so every Tailwind `sm:` / `md:` / `lg:` variant evaluates against the *simulated* viewport width — the same way a real device would render the public route. The iframe scaffold copies the parent's stylesheets, fonts, and inline `<style>` blocks into its `<head>`, plus a `MutationObserver` mirrors HMR / active-drop theme updates from the parent in real time. Mounting treats the document as ready when `head`/`body` exist and either `readyState` is `interactive`/`complete`, **or** (for `srcDoc` engines that lag `readyState`) the stub’s `data-anvl-drop-editor-live-preview` marker is already on `<html>` while still on `loading` — plus microtask + **`requestAnimationFrame`** retries, native **`load`**, and React **`onLoad`**. **If the iframe navigates or `contentDocument` swaps** (another `load`), bootstrap must follow the **new** `Document`: rebind `readystatechange` per document and rerun head/portal wiring (tracked `Document` identity vs a one-shot listener on the first doc). Unmount clears the portal target (`setBody(null)`) so a detached iframe never leaves a stale React portal.
- Simulated modes use a **flex `flex-1 min-h-0`** viewport shell; the iframe fills **`height: 100%`** (no separate fixed **`62vh`** frame in the chrome).
- A `<base href="$origin/">` is injected so `/brand/...` and other public-path media in the preview resolve correctly. Anchor clicks inside the iframe are disabled via CSS so previews never trigger navigation.
- A `PREVIEW_RESET_CSS` block neutralizes GSAP intro states (`[data-hero-*]`, `[data-drop-*]`, `[data-oath-*]`, `[data-pieces-*]`, `[data-mm-*]`, `[data-join-*]`) so the layout always renders in its final, post-animation state. Live animations remain available on the actual `/drop/$slug` route — the preview prioritizes accurate, jank-free layout QA over playing intro timelines that were tuned for the live scroll context.
  - **Maintenance note:** when a new act renderer introduces a `data-*` attribute on elements whose initial GSAP state would otherwise be invisible (`opacity:0`, transform offsets, etc.), append the new selector to `PREVIEW_RESET_CSS` in `DropEditorLivePreview.tsx`. A longer-term refactor would have every act intro-start element share a single `data-anvl-anim-start` token so the reset CSS is a one-liner rather than an enumeration that drifts.
- Iframe width transitions use `cubic-bezier(0.16, 1, 0.3, 1)` over 380 ms (**width only**) so switching between viewports stays smooth without height interpolation jank; the iframe sits inside a subtle device-frame card (rounded panel + dot row + `/drop/preview` caption) on non-Fit modes.

### Color + media editing
- Theme tab uses `ColorField` (full hex / RGB / opacity picker with native color wheel) for every palette token. Tokens that historically use rgba (e.g. `line`, `accentSoft`, `heroGlow`) keep alpha through round-trips. **Save as preset** stores named rows in `localStorage` under **`ANVL_DROP_THEME_PALETTE_PRESETS`** (Zod: `{ id, label, tokens, createdAt }[]`, user ids prefixed `user-…`); the preset combobox merges built-ins from `DROP_THEME_PRESETS` with saved rows.
- Visuals tab uses `MediaPickerField` for emblem, wordmark, hero, and optional campaign/loading slots. **Emblem / logo-like** rows default to the inline **`AnvlCrest`** preview when empty or when a raster URL fails; **wordmark** defaults to **`AnvlWordmark`**; **hero** uses **`fallback="none"`** (no crest in the backdrop slot). Each field can expose **Hide fallback preview** (editor-only). Drag-and-drop and the OS file picker embed small files as data URLs (≤ 2.5 MB image / 8 MB video); larger assets live under `/public` or a CDN URL.
- The same components are reused by the Acts builder (act image + video, plus nature-specific media inputs: hero background + watermark, drop-reveal visual, final-CTA backdrop, lookbook gallery), Website Layout (header/footer logos), the Theme & Brand route (crest fallbacks), and Product Editor swatches.

#### Persisted `leaveEmpty` (planned follow-up)
The **Hide fallback preview** toggle is currently a per-mount UI preference and **does not persist** — re-opening the drop editor resets every toggle. The storefront also still applies its own crest fallback when a visual field is empty. When this is properly supported, the plan is to add an optional `visualsLeaveEmpty?: Partial<Record<keyof DropVisuals, boolean>>` on `Drop` and teach the storefront resolver to honour it (skip rendering when the slot is flagged empty). Until then, the copy calls out that the toggle is editor-only.
## Active drop behavior
When a drop becomes active:
- **Storefront resolution**: `getResolvedStorefrontLandingCmsSync` (`src/features/cms/runtime/storefrontCmsSync.ts`) is the single sync entry for composed landing CMS: **SSR** uses the same `SEED_DROP` + `SEED_WEBSITE_LAYOUT` pairing as `seedCmsClient`; **browser** uses the persisted active drop + website layout (`localStorage`). Homepage products (`getStorefrontProductsForHome`), root theme, and seed SEO use this resolver (or the async `runtimeClients.cms` wrappers that delegate to it) so navigation cannot drift from the CMS “Set Active” selection.
- Landing page uses that drop's acts.
- Drop nav item changes label and link to active drop.
- Header/footer/mobile links whose `href` starts with `/drop/` are rewritten to `/drop/{activeSlug}` and their **label** is set to the active drop **title** (e.g. “The Oath”) so the top bar always matches the campaign name.
- Site theme variables update to the active drop palette (`:root` via **`ActiveDropThemeProvider`** on public routes — SSR-first `<style id="anvl-active-drop-theme">`, then client updates when drop storage changes).
- The public `/drop/:slug` route resolves only the active drop: wrong slug redirects to the active slug; there is no standalone archived drop URL in this phase.

- Header/footer/mobile links whose `href` starts with `/drop/` are rewritten to `/drop/{activeSlug}` and their **label** is set to the active drop **title** (for example “The Oath”).
- Site theme variables update to the active drop palette (`:root` via **`ActiveDropThemeProvider`** on public routes — SSR-first `<style id="anvl-active-drop-theme">`, then client updates when drop storage changes).
- The public `/drop/:slug` route resolves only the active drop: a mismatched slug redirects to the active slug.- Drop page shows title, subtitle, optional hero backdrop (`visuals.heroImageUrl`), emblem, description, optional **release** block (`releaseDate` with client-side countdown after hydration), and assigned product cards linking to `/shop/$slug`.

- Drop page shows title, subtitle, optional hero backdrop (`visuals.heroImageUrl`), emblem, description, optional **release** block (`releaseDate` with client-side countdown after hydration), and assigned product cards linking to `/shop/$slug`. Plain-text hero fields run through `stripAngleBracketTags` so pasted markup does not pollute assistive-tech output.
- Persisted drop rows loaded from `localStorage` must satisfy `persistedDropSchema` before merge; invalid rows are dropped and the hydrator can re-seed defaults when storage is empty.- Products assigned to the drop become visible in the global shop if their product status allows it.

## Public homepage act pipeline
- `landingActSequence` on each drop is the ordered list of six canonical slots (`hero`, `manifesto`, `dropReveal`, `pieces`, `materials`, `waitlist`) with an `enabled` flag per slot.
- `composeLandingPageFromDrop` adds `landingActs` to `LandingPageCmsContent`: public descriptors with `nature` (e.g. `productShowcase`), `preset`, `sortOrder`, `slotKey` (legacy homepage section id), `enabled`, and `animation` defaults for future GSAP gating.
- The Drop Editor **Landing acts** tab includes `DropActsBuilderPanel` (add/remove/reorder, nature and preset selectors, eyebrow/title/subtitle/body) plus the legacy per-section forms. `Drop.acts` is persisted with the drop; `landingActSequence` toggles are synced when mapped slots have at least one enabled act.
- The public `/` route renders `PublicLandingActs`, which resolves `act.nature` + `act.preset` through the act preset registry (lazy chunks), respects `enabled === false`, and degrades unknown types to a small on-page notice. **PR-9** adds storefront renderers for **`lookbook`**, **`specialEvent`**, and **`finalCTA`** (builder fields in `DropActsBuilderPanel`; presets under `src/features/marketing/act-presets/`).
- Optional homepage **`campaigns`** and **`lookbook`** strips render below landing acts when **`storefront_publication`** (or local **Home extras** in Website layout) has non-empty arrays — see **`CampaignCardsSection`** / **`LookbookStripSection`** on `src/routes/index.tsx`.
- Hero GSAP runs only at `min-width: 768px` with `prefers-reduced-motion: no-preference`; mobile and reduced-motion users see a static hero layout for speed and accessibility.

## Website layout (global chrome)

- **Admin route**: `/admin/website-layout` edits `WebsiteLayoutContent` (`src/features/admin/website-layout/websiteLayout.types.ts`), persisted via `websiteLayout.storage` (local storage in the no-backend phase).
- **Logos**: Optional `header.logoStackedSrc` / `footer.logoStackedSrc`. When unset or blank after trim, the public shell uses the bundled `AnvlLogoImage` (official mark). The global brand logo does not switch with the active drop; campaign artwork stays on drop surfaces. `logoMediaAssetId` on header/footer is reserved for a future media library (merged in `websiteLayout.service.ts`, not yet used in UI).
- **Active campaign slots**: Admin treats links whose URL starts with `/drop/` (trimmed) as system-managed placeholders; the storefront still receives the active drop **title** and `/drop/<slug>` from `composeLandingPageFromDrop` / `patchDropNavLinks`. Saves require at least one such link in desktop `headerLinks` (`getWebsiteLayoutSaveError` in `websiteLayout.service.ts`).
- **Footer**: Grouped links, newsletter copy, `socialLinks` (shown in `SiteFooter`), copyright line.
