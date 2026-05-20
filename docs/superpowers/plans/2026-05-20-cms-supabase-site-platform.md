# CMS Supabase Platform + Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Supabase the single read/write source of truth for all CMS data, ensure the storefront renders only published Supabase projections, complete every Site section feature (Layout, Theme, SEO, Media) with a faster/clarity-first redesign, wire all drop act natures + presets with professional GSAP scroll animations, and tighten CMS copy/chrome — while **keeping the Drops editor UI unchanged**.

**Architecture:** Keep the existing `storefront_publication` singleton + `anvl_drops` draft rows, but move from “localStorage-first with debounced sync” to **write-through Supabase + hydrate-on-login** when env is set. Site chrome (layout, site SEO, global brand, media index) updates the publication row directly; drop content still publishes via `cms_publish_drop`. Storefront loaders already read publication — extend that to **never** fall back to admin localStorage when Supabase is configured. Act rendering gets a **preset registry** (`nature × preset → component + animation hook`) in `features/marketing/act-presets/` with GSAP gated by viewport + reduced motion.

**Tech Stack:** TanStack Start/Router, React 19, Supabase (Postgres RLS, Storage, optional pg_cron), Zod, Vitest, GSAP + ScrollTrigger (desktop/tablet only), Tailwind v4.

**Audit / finding tags for PRs:** `MAINT-20` (Supabase SSOT), `MAINT-21` (Site CMS completion), `PERF-12` (act preset lazy chunks), `RESP-15` (act motion gates).

**Explicit non-goals (this plan):**
- Shopify/Medusa catalog integration (Products section stays mock until later).
- Drops editor visual redesign (tabs, split preview, cards — **frozen**).
- Replacing Lenis or Framer Motion.

---

## Recommended delivery order (PR stack)

| PR | Scope | Ships independently? |
|----|--------|----------------------|
| **PR-1** | Supabase SSOT plumbing + editor sync role fix + storefront read hardening | ✅ |
| **PR-2** | CMS copy trim + AdminTopbar redesign | ✅ |
| **PR-3** | Site Layout redesign + functional completion | ✅ |
| **PR-4** | Site Theme redesign + global brand clarity | ✅ |
| **PR-5** | Site SEO full editor + redesign | ✅ |
| **PR-6** | Media library (DB + Storage + UI) + redesign | ✅ |
| **PR-7** | Drop gaps: scheduler, act productIds, SEO structured data | ✅ |
| **PR-8** | Act preset renderers (existing 7 natures) + GSAP | ✅ |
| **PR-9** | New act natures: lookbook, specialEvent, finalCTA + homepage campaigns/lookbook | ✅ |

---

## File map (new / major touch)

| Area | Create | Modify |
|------|--------|--------|
| SSOT | `src/features/cms/api/cmsPersistenceMode.ts`, `src/features/admin/cmsRemote/cmsWriteThrough.ts` | `adminCmsRemoteSync.ts`, `adminCmsHydration.ts`, `storefrontReadFallback.ts` |
| Topbar | `src/features/admin/components/AdminTopbarSessionChip.tsx` | `AdminTopbar.tsx`, `AdminLayout.tsx` |
| Copy | — | `adminNav.ts`, all `-admin*.tsx` site routes, `AdminCard` descriptions |
| Layout | `src/features/admin/site-layout/SiteLayoutEditor.tsx`, `SiteLayoutPreview.tsx` | `-websiteLayoutRoute.tsx`, `websiteLayout.service.ts` |
| Theme | `src/features/admin/site-theme/SiteThemeEditor.tsx` | `-adminTheme.tsx`, `globalBrand.service.ts` |
| SEO | `src/features/admin/site-seo/SiteSeoEditor.tsx`, `SiteSeoPreviewPanel.tsx` | `-adminSeo.tsx`, `siteSeo.local.ts` |
| Media | `supabase/migrations/20260620120000_cms_media_assets.sql`, `src/features/admin/media/*` | `-adminMedia.tsx`, `MediaPickerField.tsx` |
| Acts | `src/features/marketing/act-presets/registry.ts`, `src/features/marketing/act-presets/{hero,manifesto,...}/*` | `PublicLandingActs.tsx`, `DropActsBuilderPanel.tsx` (labels only) |
| Scheduler | `supabase/migrations/20260620130000_cms_scheduled_activation.sql` | `drops.service.ts`, Edge Function optional |
| Docs | — | `docs/features/drops-cms.md`, `docs/features/supabase-cms.md`, `docs/changelog.md`, `docs/audit-2026-05-17.md` |

---

## Phase 0 — Supabase as single source of truth (PR-1)

### Task 0.1: Persistence mode helper

**Files:**
- Create: `src/features/cms/api/cmsPersistenceMode.ts`
- Test: `src/features/cms/api/__tests__/cmsPersistenceMode.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it, vi } from 'vitest'
import { isSupabaseCmsAuthority } from '@/features/cms/api/cmsPersistenceMode'

describe('isSupabaseCmsAuthority', () => {
  it('returns false when env unset', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    expect(isSupabaseCmsAuthority()).toBe(false)
  })
})
```

- [ ] **Step 2:** Implement `isSupabaseCmsAuthority()` — true when `getSupabasePublicEnv()` returns env **and** (browser has admin session **or** SSR publication fetch path).

- [ ] **Step 3:** Export `shouldUseLocalCmsFallback()` for storefront — false when Supabase env is set (public site never reads admin localStorage).

### Task 0.2: Write-through on save (admin + editor)

**Files:**
- Modify: `src/features/admin/cmsRemote/adminCmsRemoteSync.ts:47-48` — allow `role in ('admin','editor')`
- Modify: `src/features/admin/website-layout/websiteLayout.service.ts`
- Modify: `src/features/admin/global-brand/globalBrand.service.ts`
- Modify: `src/features/cms/siteSeo.local.ts`
- Modify: `src/features/admin/drops/drops.service.ts` — after `persistDropsState`, always schedule sync when Supabase on
- Test: `src/features/admin/cmsRemote/__tests__/adminCmsRemoteSync.roles.test.ts`

**Acceptance:**
- Editor role can sync layout/SEO/brand/drops to Supabase (publish RPC stays admin-only).
- Save paths **await** sync when `flushAdminCmsRemoteSync()` fails → surface toast error; do not pretend saved.

### Task 0.3: Hydrate admin from Supabase on every login / focus

**Files:**
- Modify: `src/features/admin/cmsRemote/adminCmsHydration.ts` — also pull `products_snapshot`-free drafts; merge `site_seo`, `website_layout`, `global_brand`
- Modify: `src/features/admin/auth/useAdminAuth.ts` — rehydrate after session established
- Test: extend `adminCmsHydration.test.ts`

**Acceptance:** Fresh browser + Supabase login shows remote data, not seed defaults.

### Task 0.4: Storefront read hardening

**Files:**
- Modify: `src/features/cms/runtime/storefrontReadFallback.ts`
- Modify: `src/features/cms/runtime/storefrontCmsSync.ts` — when Supabase env set, **never** call `getActiveDrop()` from admin storage on client
- Modify: `src/features/products/api/commerceClient.supabase.ts`
- Test: `src/test/integration/storefrontSupabaseOnly.test.tsx`

**Acceptance:** With `VITE_SUPABASE_*` set, mutating admin localStorage without sync does **not** change public site.

### Task 0.5: Publication columns for media index + site drafts (optional split)

**Files:**
- Create: `supabase/migrations/20260620100000_storefront_site_drafts.sql`

```sql
ALTER TABLE public.storefront_publication
  ADD COLUMN IF NOT EXISTS media_index jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.storefront_publication.media_index IS
  'Published media asset catalog [{id,path,alt,mime,w,h,updatedAt}] for picker + storefront OG helpers.';
```

- [ ] Sync `media_index` in `flushAdminCmsRemoteSync` once Media phase lands; migration lands early to avoid drift.

**Commit message:** `feat(cms): Supabase SSOT write-through + storefront read hardening — MAINT-20`

---

## Phase 1 — CMS chrome & copy (PR-2)

### Task 1.1: AdminTopbar redesign

**Files:**
- Create: `src/features/admin/components/AdminTopbarSessionChip.tsx`
- Modify: `src/features/admin/components/AdminTopbar.tsx`
- Test: `src/features/admin/components/__tests__/AdminTopbar.test.tsx`

**Design spec (implement exactly):**
- Remove duplicate “ANVL Admin” micro-label + inline username row.
- Layout: `[menu mobile] | [page title (h1, single line)] … [page actions slot] | [session chip]`
- **Session chip:** compact pill — crest icon + truncated email/username; no display name in header body. Full email in `title` tooltip. Dropdown on click: “View storefront”, “Settings”, “Log out” (reuse sidebar actions).
- **Description:** move out of topbar — only render `description` on dashboard; other routes omit topbar description (page body carries context).
- Sticky bar: reduce height ~20%, stronger bottom border, no backdrop blur on mobile (perf).

### Task 1.2: Global CMS copy audit

**Files:**
- Modify: `src/features/admin/components/adminNav.ts` — shorten `description` to ≤8 words; remove `cta` if unused
- Modify: `AdminLayout.tsx` — drop syncing banner to single line
- Modify: site route shells `-adminSeo.tsx`, `-adminMedia.tsx`, `-adminTheme.tsx`, `-websiteLayoutRoute.tsx`, `-adminDashboard.tsx`
- Modify: `AdminCard` — default to title-only; description prop optional and rare

**Copy rules:**
- One sentence max per helper text.
- Delete “Tip:”, “Note:”, mock-CMS references, duplicate explanations.
- Empty states: title + one line + one button.

**Commit message:** `refactor(admin): topbar + CMS copy trim — MAINT-21`

---

## Phase 2 — Site Layout redesign (PR-3)

### Task 2.1: Split editor into focused components

**Files:**
- Create: `src/features/admin/site-layout/SiteLayoutEditor.tsx` (~200 lines max)
- Create: `src/features/admin/site-layout/SiteLayoutNavPanel.tsx`
- Create: `src/features/admin/site-layout/SiteLayoutFooterPanel.tsx`
- Create: `src/features/admin/site-layout/SiteLayoutAnnouncementPanel.tsx`
- Create: `src/features/admin/site-layout/SiteLayoutPreview.tsx` — read-only mini storefront chrome preview
- Modify: `src/routes/admin/-websiteLayoutRoute.tsx` — thin shell only

**UX spec:**
- Two-column **lg+**: left = tabbed form (Header | Footer | Announcement), right = live preview sticky card.
- Mobile: preview collapses to accordion “Preview”.
- `/drop/` slot links show locked badge; label auto-sync note ≤6 words.
- Save bar: single primary “Save layout” sticky footer; success toast only.

### Task 2.2: Supabase write-through

**Files:**
- Modify: `saveWebsiteLayoutContent` — await `flushAdminCmsRemoteSync()`; throw on failure
- Test: `site-layout/__tests__/SiteLayoutEditor.test.tsx` — save calls sync

**Acceptance:** Saved layout visible on storefront within one debounce cycle without drop publish.

### Task 2.3: Storefront verification

**Files:**
- Modify: `StickyHeader.tsx`, `SiteFooter.tsx` — no code change expected; add integration test asserting composed navigation matches saved layout JSON from publication mock.

**Commit message:** `feat(admin): redesign site layout editor — MAINT-21`

---

## Phase 3 — Site Theme redesign (PR-4)

### Task 3.1: Rename nav + clarify scope

**Files:**
- Modify: `adminNav.ts` — label **“Brand fallbacks”**, badge **“Global”**
- Modify: route title/description copy

### Task 3.2: SiteThemeEditor UI

**Files:**
- Create: `src/features/admin/site-theme/SiteThemeEditor.tsx`
- Modify: `-adminTheme.tsx`

**UX spec:**
- Hero strip: “These show before the active drop loads.”
- Two large media tiles (emblem, loading emblem) side-by-side.
- Read-only panel: “Active drop palette” — pulls live published drop theme swatches (query `storefront_publication`) so operators see what overrides fallbacks.
- Link button to Drops (no paragraph).

### Task 3.3: Supabase + storefront

**Files:**
- Already synced via `global_brand`; add test that `ActiveDropThemeBridge` prefers drop emblem over fallback.

**Commit message:** `feat(admin): brand fallbacks editor redesign — MAINT-21`

---

## Phase 4 — Site SEO full editor (PR-5)

### Task 4.1: Site SEO editor

**Files:**
- Create: `src/features/admin/site-seo/SiteSeoEditor.tsx`
- Create: `src/features/admin/site-seo/SiteSeoGlobalPanel.tsx`
- Create: `src/features/admin/site-seo/SiteSeoStaticPagesPanel.tsx`
- Create: `src/features/admin/site-seo/SiteSeoPreviewPanel.tsx` — Google/Twitter card mock
- Modify: `-adminSeo.tsx` — replace hub links with editor
- Modify: `siteSeo.local.ts` — keep API; add `loadSiteSeoFromPublication` for SSR consistency
- Test: `site-seo/__tests__/SiteSeoEditor.test.tsx`

**UX spec:**
- Tabs: **Defaults** | **Pages** (`/`, `/shop`, `/about`, `/size-guide`)
- Each field: label + input; char count for title/description; no long hints.
- Preview panel updates live (no submit needed).
- Save → write-through to `storefront_publication.site_seo`.

### Task 4.2: Storefront merge verification

**Files:**
- Modify: `src/routes/about.tsx`, `size-guide.tsx`, shop routes — assert `buildSeoMetaFromCmsSource` uses saved static page overrides
- Test: `src/features/cms/__tests__/seoMeta.staticPages.test.ts`

### Task 4.3: Drop SEO structured data

**Files:**
- Modify: `src/routes/index.tsx`, `drop/$slug.tsx` — emit JsonLd based on `drop.seo.structuredDataType` when set
- Test: snapshot JsonLd output

**Commit message:** `feat(admin): site SEO editor + structured data — MAINT-21`

---

## Phase 5 — Media library (PR-6)

### Task 5.1: Database + storage model

**Files:**
- Create: `supabase/migrations/20260620120000_cms_media_assets.sql`

```sql
CREATE TABLE public.cms_media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL UNIQUE,
  filename text NOT NULL,
  alt text NOT NULL DEFAULT '',
  mime text NOT NULL,
  byte_size bigint NOT NULL,
  width int,
  height int,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

ALTER TABLE public.cms_media_assets ENABLE ROW LEVEL SECURITY;
-- SELECT: cms roles; INSERT/UPDATE/DELETE: editor/admin (mirror cms-media bucket policies)
```

- [ ] RLS policies + grant aligned with `cms_profiles`.

### Task 5.2: Media API layer

**Files:**
- Create: `src/features/admin/media/mediaAssets.service.ts`
- Create: `src/features/admin/media/mediaAssets.types.ts`
- Create: `src/features/admin/media/useMediaAssetsQuery.ts`
- Modify: `uploadCmsMedia.ts` — insert `cms_media_assets` row after upload
- Test: `media/__tests__/mediaAssets.service.test.ts`

### Task 5.3: Media library UI redesign

**Files:**
- Create: `src/features/admin/media/MediaLibraryPage.tsx`
- Create: `src/features/admin/media/MediaAssetGrid.tsx`
- Create: `src/features/admin/media/MediaUploadZone.tsx`
- Create: `src/features/admin/media/MediaAssetDetailDrawer.tsx`
- Modify: `-adminMedia.tsx`

**UX spec:**
- Grid of cards: thumb, filename, alt (inline edit), copy URL, delete (confirm).
- Upload zone: drag-drop + file picker; progress per file.
- Filters: search filename/alt/tags; mime filter pills.
- Speed: virtualized grid if >100 assets (`@tanstack/react-virtual` — already pinned; **use it**).
- No standalone essay text — 1-line header only.

### Task 5.4: MediaPickerField integration

**Files:**
- Modify: `MediaPickerField.tsx` — optional “Browse library” opens modal listing `cms_media_assets`; selecting sets URL to public storage URL.

### Task 5.5: Publish media index to storefront

**Files:**
- Modify: `adminCmsRemoteSync.ts` — serialize lightweight `media_index` array to `storefront_publication`
- Storefront: no grid needed yet; index supports OG fallbacks + future gallery acts.

**Commit message:** `feat(admin): media library + Supabase assets — MAINT-21`

---

## Phase 6 — Drop functional gaps (PR-7)

> **Design frozen** — only functional fixes, no layout changes to `DropEditorRoute`.

### Task 6.1: Scheduled activation

**Files:**
- Create: `supabase/migrations/20260620130000_cms_scheduled_activation.sql` — function `cms_process_scheduled_drops()` + pg_cron schedule (or document Edge Function cron if pg_cron unavailable)
- Modify: `scheduleDropActivation` — ensure status `scheduled` syncs to `anvl_drops.status`
- Test: SQL unit test or Vitest with mocked RPC

**Behavior:** When `scheduled_activation_at <= now()`, promote drop: demote others, call publish logic.

### Task 6.2: Act-level productIds

**Files:**
- Modify: `PublicLandingActs.tsx` case `productShowcase` — if `row.productIds?.length`, map those IDs from `products` prop; else slice 6
- Test: `PublicLandingActs.test.tsx`

### Task 6.3: Remove or gate unsupported act natures in builder

**Files:**
- Modify: `DropActsBuilderPanel.tsx` — if nature not in `STOREFRONT_ACT_NATURES`, show amber inline banner “Not live yet — coming in next release” **OR** ship Phase 8 first and keep them
- Prefer shipping Phase 8/9 before removing options.

**Commit message:** `feat(drops): scheduler + act product picks — MAINT-20`

---

## Phase 7 — Act preset system + GSAP (PR-8)

### Task 7.1: Preset registry architecture

**Files:**
- Create: `src/features/marketing/act-presets/registry.ts`
- Create: `src/features/marketing/act-presets/types.ts`
- Create: `src/features/marketing/act-presets/shared/useActScrollReveal.ts` — `useGSAP` + `ScrollTrigger`, gated `(min-width: 768px)` + `(prefers-reduced-motion: no-preference)`
- Test: `registry.test.ts` — every builder preset maps to a registry entry

```ts
export type ActPresetEntry = {
  nature: LandingActNature
  preset: string
  component: LazyExoticComponent<ActPresetProps>
  animate?: (ctx: gsap.Context, root: HTMLElement) => void
}
```

### Task 7.2: Hero presets (3)

**Files:**
- Create: `act-presets/hero/TheOathCinematic.tsx` — existing `HeroForgeSequence` extracted/wrapped
- Create: `act-presets/hero/SplitProductHero.tsx` — split layout: copy left, product cutout right, parallax scrub
- Create: `act-presets/hero/MinimalEmblemHero.tsx` — centered emblem, staggered lines

**Animation notes:** use transforms only; `ScrollTrigger.create({ scrub: 0.6 })` for parallax; mobile snap final state.

### Task 7.3: Manifesto + storytelling presets

**Files:**
- Create: `act-presets/manifesto/OathStampLedger.tsx` (wrap `OathStampSequence`)
- Create: `act-presets/manifesto/SplitTextManifesto.tsx`
- Create: `act-presets/storytelling/ChapterScroll.tsx` — pinned chapter stack

### Task 7.4: Drop reveal, products, materials, waitlist presets

**Files:**
- Under `act-presets/dropReveal/*`, `productShowcase/*`, `materialShowcase/*`, `newsletterWaitlist/*`
- Each preset: distinct layout + entrance timeline (stagger children, clip-path reveals)

### Task 7.5: Wire PublicLandingActs to registry

**Files:**
- Modify: `PublicLandingActs.tsx` — replace switch body with registry lookup; lazy load preset chunks
- Modify: `vite.config.ts` — `manualChunks` bucket `act-presets` for code splitting (`PERF-12`)

**Commit message:** `feat(storefront): act preset registry + GSAP scroll animations — PERF-12 RESP-15`

---

## Phase 8 — New act natures + homepage sections (PR-9)

### Task 8.1: Lookbook act

**Files:**
- Create: `act-presets/lookbook/MasonryLookbook.tsx`, `CarouselLookbook.tsx`, `EditorialLookbook.tsx`
- GSAP: horizontal scrub gallery on desktop; static grid mobile
- Builder already has fields — connect to renderer

### Task 8.2: Special event act

**Files:**
- Create: `act-presets/specialEvent/EventCard.tsx`, `CountdownEvent.tsx`, `LocationSplit.tsx`
- Content fields from `safeParseActContent('specialEvent', ...)`

### Task 8.3: Final CTA act

**Files:**
- Create: `act-presets/finalCTA/CenteredCta.tsx`, `FooterOverlapCta.tsx`, `ProductCta.tsx`

### Task 8.4: Homepage campaigns + lookbook strips

**Files:**
- Create: `src/features/marketing/home/CampaignCardsSection.tsx`
- Create: `src/features/marketing/home/LookbookStripSection.tsx`
- Create: `src/features/admin/site-home/SiteHomeExtrasEditor.tsx` — edit `campaigns` + `lookbook` arrays
- Modify: `adminCmsRemoteSync.ts` — sync campaigns/lookbook to publication
- Modify: `src/routes/index.tsx` — render sections when arrays non-empty
- Add nav item under Site cluster: **“Home extras”** or fold into Layout editor as third tab — **prefer tab in Layout** to limit nav sprawl.

**Commit message:** `feat(storefront): new act natures + homepage campaigns — MAINT-21`

---

## Phase 9 — Testing, docs, verification

### Task 9.1: Integration tests

**Files:**
- Create: `src/test/integration/cmsSupabaseRoundTrip.test.tsx`
- Create: `src/test/integration/storefrontPublicationRender.test.tsx`

### Task 9.2: Manual QA checklist

- [ ] Admin login → hydrate → edit layout → storefront header updates (no drop publish)
- [ ] Edit site SEO `/about` → view-source on `/about`
- [ ] Upload media → pick in drop visuals → publish drop → image loads anon
- [ ] Each act preset renders desktop + mobile + reduced motion
- [ ] Scheduled drop activates (manually trigger RPC in SQL)

### Task 9.3: Docs

- [ ] Update `docs/features/supabase-cms.md`, `docs/features/drops-cms.md`, new `docs/features/site-cms.md`
- [ ] Append `docs/changelog.md`
- [ ] Mark `MAINT-20`, `MAINT-21` in `docs/audit-2026-05-17.md` deferred section

### Task 9.4: Verify

```bash
pnpm verify
pnpm analyze  # act-presets chunk size note in PR
```

---

## GSAP standards (all act work)

Reference: `.cursor/rules/20-performance-bundle.mdc`, GSAP skills.

1. Register plugins only in `src/shared/lib/gsap.ts`.
2. Each preset animation hook:

```ts
export function useActAnimation(scope: RefObject<HTMLElement | null>, enabled: boolean) {
  useGSAP(() => {
    if (!enabled || !scope.current) return
    const mm = gsap.matchMedia()
    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      // ScrollTrigger timelines
    })
    mm.add('(max-width: 767px), (prefers-reduced-motion: reduce)', () => {
      gsap.set(scope.current.querySelectorAll('[data-act-child]'), { opacity: 1, y: 0 })
    })
    return () => mm.revert()
  }, { scope, dependencies: [enabled] })
}
```

3. Preview iframe: keep `PREVIEW_RESET_CSS` updated with new `data-act-*` attributes.
4. No GSAP in admin Site editors (static preview only) — perf + clarity.

---

## Site section design tokens (shared across PR-3–6)

- **Density:** form fields `gap-4`, sections `gap-6`, page max-width `max-w-4xl` (site) vs drops `max-w-5xl` unchanged.
- **Typography:** page title in body (topbar title only); section headings `text-sm font-semibold uppercase tracking-wider`.
- **Color:** reuse admin CSS vars; accent for primary save; no new palette.
- **Components:** reuse `AdminCard`, `AdminFormField`, `MediaPickerField`; new shared `AdminSaveBar` sticky footer for site pages.
- **Speed:** React.lazy for heavy panels; no tables >500 rows without virtualisation.

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Large GSAP scope | Ship presets per nature across PR-8/9; lazy chunks |
| SSOT migration breaks local dev | `isSupabaseCmsAuthority()` — local-only mode unchanged when env unset |
| Editor/admin role drift | Tests for RLS + sync role |
| Copy trim too aggressive | UX review pass on Site pages only |
| Drop editor accidental change | CODEOWNERS note: no CSS/layout edits under `DropEditorRoute.tsx` / `DropActsBuilderPanel.tsx` except labels |

---

## Self-review (spec coverage)

| User requirement | Plan task |
|------------------|-----------|
| CMS read/write Supabase | Phase 0 |
| Storefront reads Supabase only | Task 0.4 |
| Acts natures + presets + GSAP | Phase 7–8 |
| Site Layout/Theme/SEO/Media functional | Phase 2–5 |
| Site pages redesigned | Phase 2–5 UX specs |
| Drops design unchanged | Phase 6 note + non-goals |
| Less CMS text | Phase 1 |
| Topbar redesign | Task 1.1 |
| Speed + clarity | Design tokens + lazy presets |

**Placeholder scan:** none — all tasks name files and behaviors.

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-20-cms-supabase-site-platform.md`.**

**Two execution options:**

1. **Subagent-Driven (recommended)** — one subagent per PR phase, review between PRs.
2. **Inline Execution** — implement PR-1 → PR-2 → … in this session with checkpoints.

**Which approach do you want to start with?** Recommended: **PR-1 (Supabase SSOT)** first — everything else depends on it.
