# Feature — Landing Page Acts Builder

> **DEPRECATED (2026-06).** The configurable act/nature/preset landing system described below has been **removed** (`src/features/marketing/act-presets`, `cms/landing`, and the standalone `drops` feature no longer exist). Landing pages are now **code-owned** React components registered in `src/features/landingPages/registry.ts`; the CMS only picks the active landing-page key and supplies asset-slot + per-scene copy overrides. See `docs/landing-pages.md` and `docs/cms-architecture.md`. Retained only as historical context.

## Purpose
The landing page is not hard-coded as six sections anymore. It is a flexible sequence of acts controlled by the active drop.

## Act structure
```ts
type LandingAct = {
  id: string;
  nature: ActNature;
  preset: string;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  body?: string;
  media?: { imageUrl?: string; videoUrl?: string; alt?: string };
  animation?: ActAnimationConfig;
  content: Record<string, unknown>;
  productIds?: string[];
  isEnabled: boolean;
  sortOrder: number;
};
```

## Oath act natures
| Nature | Presets | Notes |
|--------|---------|-------|
| `hero` | `standardHero`, `editorialHero`, `productHero`, `cinematicScrollHero` | `cinematicScrollHero` uses `content.cinematicConfig` (sections, scroll length, nav mode); edited in **Cinematic hero** panel |
| `manifesto` | `oathTenetLedger` | Tenets list only (no body field); optional quote |
| `storytelling` | `oathNarrativeScroll` | Chapters list in CMS |
| `dropReveal` | `oathMonolithReveal` | Monolith + scroll reveal |
| `productShowcase` | `oathEditorialThree`, `oathProductRail`, `oathHeroProduct` | Shopify-aware product cards |
| `materialShowcase` | `oathMaterialFlip` | Per-product flip cards + characteristic lists |
| `lookbook` | `masonryLookbook` | Gallery items in `content.galleryItems` |
| `specialEvent` | `oathEventPulse` | Countdown, location, rules |
| `finalCTA` | `oathForgeClose` | Replaces legacy waitlist acts |

Legacy preset ids map via `actPresetAliases.ts` (`theOathCinematic` → `editorialHero`, `cinematic-full-screen` → `cinematicScrollHero`). `newsletterWaitlist` migrates to `finalCTA` on load (`migrateDrop`).

## Homepage
`/` always renders the published drop act sequence via `PublicLandingActs`. The first act may be **Cinematic scroll hero** (pinned GSAP inside the hero act only); following acts scroll normally. Site chrome (`PremiumNav`, footer) is always visible. Lenis smooth scroll applies on `/` only when a enabled `cinematicScrollHero` act is present.

## Implementation (Drop Editor)
- UI: `DropActsBuilderPanel` (`src/features/admin/drops/DropActsBuilderPanel.tsx`), lazy-loaded from `DropEditorRoute` (**Acts** tab). Each row: reorder, enable/disable, nature, preset, shared copy (eyebrow/title/subtitle/body), **act-level media** (image upload or URL, optional video URL, alt), **animation** (enabled, desktop-only, motion type key, intensity), nature-specific **content** sub-forms, and optional **product SKUs** for `productShowcase` (catalog checkboxes; empty means "use all drop products"). Nature, preset, animation intensity, and nature-specific enums (e.g. product showcase **card style**, lookbook **layout**) use **AdminSelect** (Radix, portaled dropdown) rather than native **`<select>`**, aligned with Basics field labelling (**`aria-labelledby`** + trigger **`id`**).
- Bootstrap: new drops / defaults still seed `acts` from `DropLandingContent` in `drops.defaults.ts` via `landingContentToSimpleActs`. In the editor, **Reset acts from landing copy** re-imports validated `Drop.landingContent` JSON into acts; there is no automatic on-mount sync when `acts` is empty.
- Validation: per-nature `content` objects are narrowed with `safeParseActContent` in `acts/landingActs.zod.ts` (Zod); the panel resets `content` when nature changes.
- Public pipeline: `acts/landingActs.normalize.ts` maps slot toggles to `PublicLandingAct` rows consumed by `PublicLandingActs` on `/`. For the Drop Editor preview, `composeLandingPageFromDrop(..., { editorActsPreview: true })` maps `Drop.acts` via `publicLandingActsFromDraftActs` only (no `landingActSequence` merge). **Storefront compose** (SSR + `storefront_publication`) also prefers **`Drop.acts`** when non-empty, then falls back to **`landingActSequence`**. Default **`landingContent`** slots still hydrate hero/manifesto/etc. copy on `LandingPageCmsContent`.
## Animation config
```ts
type ActAnimationConfig = {
  enabled: boolean;
  desktopOnly: boolean;
  type: 'none' | 'fadeUp' | 'wordReveal' | 'parallax' | 'calmIdle' | 'stagger' | 'default';
  intensity: 'subtle' | 'standard' | 'bold';
};
```
Drop editor preview supports **Live motion** (unfreezes GSAP) and remounts when animation fields change.

## Runtime contracts
`LandingAct`, `ActNature`, and `ActAnimationConfig` (plus `ActMedia`) are defined as Zod schemas in `src/features/landing/schemas/landing-act.schema.ts` with type re-exports in `src/features/landing/types/landing-act.types.ts`. Per-act `content` remains `Record<string, unknown>` until nature-specific content schemas are added.

## Section sizing
- Storefront acts use `.anvl-screen-section` with **content-driven height** (`overflow: visible`; no inner scroll clamp).
- `ActPresetShell` accepts `sectionSize`: `default` | `tall` | `compact` | `content` (maps to `.anvl-act-section--*` in `styles.css`).
- Drop 01 oath presets: manifesto/storytelling/products/materials/lookbook/drop reveal → **tall**; final CTA → **content**.

## Rendering rules
- Every act nature maps to a renderer component.
- Every nature has a schema for its `content` object.
- Unknown/invalid acts must fail gracefully with a hidden fallback in production and visible warning in CMS preview (`PublicLandingActs` with `cmsPreview`, plus `DropEditorPreviewErrorBoundary` in `DropEditorLivePreview` for hard render failures).
- Heavy act renderers should be lazy-loaded.
- Public homepage: composed `landingActs` follow the active drop's `landingActSequence`; the `/` route uses `PublicLandingActs` to map `nature` to existing marketing sections (lazy-loaded after Act I) and skips unknown types with a minimal notice. The Drop Editor live preview prefers `Drop.acts` when present so builder state matches immediately.
