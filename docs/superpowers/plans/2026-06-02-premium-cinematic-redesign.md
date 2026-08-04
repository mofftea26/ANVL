# ANVL Premium Cinematic Commerce Redesign

> **ARCHIVED — historical plan (2026-06-02).** Predates the 2026-06-20 merge of The Oath I + II into the single continuous cinematic landing. For the shipped design see `docs/landing-pages.md` and `docs/animation-guidelines.md`. Retained as a record of the original design reasoning.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Run `pnpm verify` before declaring any phase done.

**Goal:** Cinematic landing becomes a CMS hero preset (`cinematicScrollHero`); homepage continues with act sections below; premium nav + storefront redesign.

**Architecture:** Unify on `PublicLandingActs` + `drop.acts[]`; lazy-load cinematic GSAP only for `cinematicScrollHero`; replace `StickyHeader` with phase-aware `PremiumNav`.

---

## Phase 0 — Audit (2026-06-02)

### Homepage fork (current)

| Mode | Route | Chrome | Data |
|------|-------|--------|------|
| `default` | `DefaultCinematicLanding` → `BrandShowcaseExperience` | No header/footer (`useBrandShowcaseShell`) | `landingContent` slices, pinned GSAP monolith |
| `custom` | `PublicLandingActs` | Full chrome | `drop.acts[]` via publication |

**Key files:** `src/routes/index.tsx`, `src/features/cms/siteHomepage.settings.ts`, `src/routes/__root.tsx`, `src/features/cms/hooks/useBrandShowcaseShell.ts`

### Hero registry (current)

- **One registered hero:** `theOathCinematic` → `HeroForgeSequence`
- **Orphans:** `MinimalEmblemHero`, `SplitProductHero` (aliased to `theOathCinematic`)
- **Brand showcase:** separate stack in `default-landing/` (not act preset)
- **No `cinematicScrollHero`** in registry or Zod

### Publication

Acts live in `storefront_publication.published_drop_snapshot.acts[]`. Publish via `cms_publish_drop` RPC. No schema change needed for `cinematicConfig` — nested in `act.content`.

### Safest integration path

1. Extend `heroContentSchema` with `cinematicConfig`
2. Register 4 hero presets including `cinematicScrollHero` (lazy chunk)
3. Extract pinned scroll from `BrandShowcaseExperience` into `cinematic-hero/` act preset
4. Always render `PublicLandingActs` on `/`; deprecate `homepageMode === 'default'`
5. Wire `CinematicHeroEditor` in `DropActsBuilderPanel`
6. Replace `StickyHeader` with `PremiumNav` (cinematic → commerce phase)

### Storefront / nav gaps

- `PremiumNav` does not exist
- Design tokens in `src/styles.css`; no shared `SectionShell` / `PageHero` yet
- `lookbook` preset exists on disk but not in `LANDING_ACT_NATURES`

---

## Phase 2 — Data model

- `landingActs.zod.ts`: `cinematicConfigSchema`, `cinematicHeroSectionSchema`
- `cinematic-hero/cinematicHero.types.ts`, `cinematicHero.defaults.ts`
- Registry: `standardHero`, `editorialHero`, `productHero`, `cinematicScrollHero`
- Aliases: `theOathCinematic` → `editorialHero`
- Migration: `20260602120000_cinematic_hero_layouts.sql`
- Seed: Drop 01 hero → `cinematicScrollHero`
- Deprecate homepage `default` mode (parse → `custom`)

## Phase 3 — Admin UX

- `src/features/admin/drops/cinematic/*` editor with sections list, tabs, global settings
- Wire into `DropActsBuilderPanel` when preset is `cinematicScrollHero`
- Vitest: `cinematicConfig.zod.test.ts`, `CinematicHeroEditor.test.tsx`

## Phase 4 — Cinematic hero storefront

- `CinematicScrollHero.tsx`, `CinematicHeroRoot.tsx`, `useCinematicHeroTimeline.ts`
- Bounded pin container; normal scroll after hero
- `index.tsx`: always `PublicLandingActs`; Lenis only when cinematic hero act
- Register `lookbook` nature + `masonryLookbook` preset
- Phase store for nav: `cinematicHeroPhase.store.ts`

## Phase 5 — Navigation

- `PremiumNav` + topbar, side rail, mobile drawer, `AnnouncementRail`
- Swap in `__root.tsx`; preserve CMS nav + cart

## Phase 6 — Design system + pages

- `src/shared/components/premium/*`
- Batches: home/drop → shop/PDP → cart/checkout → auth/static

## Phase 7–8 — Polish

- Vite chunk for `cinematic-hero/`
- Docs: `acts-builder.md`, `drops-cms.md`, `design-system.md`, `changelog.md`
- `pnpm verify`
