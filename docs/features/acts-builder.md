# Feature â€” Landing Page Acts Builder

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

## Oath-only act natures (2026 overhaul)
| Nature | Presets | Notes |
|--------|---------|-------|
| `hero` | `theOathCinematic` | Countdown, CTAs, optional foreground media |
| `manifesto` | `oathTenetLedger` | Tenets list only (no body field); optional quote |
| `storytelling` | `oathNarrativeScroll` | Chapters list in CMS |
| `dropReveal` | `oathMonolithReveal` | Monolith + scroll reveal |
| `productShowcase` | `oathEditorialThree`, `oathProductRail`, `oathHeroProduct` | Shopify-aware product cards |
| `materialShowcase` | `oathMaterialFlip` | Per-product flip cards + characteristic lists |
| `specialEvent` | `oathEventPulse` | Countdown, location, rules |
| `finalCTA` | `oathForgeClose` | Replaces legacy waitlist acts |

Legacy preset ids map via `actPresetAliases.ts`. `lookbook` and `newsletterWaitlist` are removed on load (`migrateDrop`).

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

## Rendering rules
- Every act nature maps to a renderer component.
- Every nature has a schema for its `content` object.
- Unknown/invalid acts must fail gracefully with a hidden fallback in production and visible warning in CMS preview (`PublicLandingActs` with `cmsPreview`, plus `DropEditorPreviewErrorBoundary` in `DropEditorLivePreview` for hard render failures).
- Heavy act renderers should be lazy-loaded.
- Public homepage: composed `landingActs` follow the active drop's `landingActSequence`; the `/` route uses `PublicLandingActs` to map `nature` to existing marketing sections (lazy-loaded after Act I) and skips unknown types with a minimal notice. The Drop Editor live preview prefers `Drop.acts` when present so builder state matches immediately.
