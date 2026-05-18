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

## Recommended act natures
1. `hero`
   - Purpose: first impression.
   - Content: title, subtitle, CTA, countdown, background image/video, emblem/watermark.
   - Presets: cinematic full-screen, split product hero, minimal emblem hero.

2. `manifesto`
   - Purpose: brand belief and emotional hook.
   - Content: headline, story paragraphs, quote, background image/emblem.
   - Presets: centered oath text, split text/image, scroll-stacked statements.

3. `dropReveal`
   - Purpose: introduce the active drop.
   - Content: drop title, subtitle, release date, CTA, preview product visuals.
   - Presets: countdown reveal, product trio, emblem-first reveal.

4. `productShowcase`
   - Purpose: show assigned products.
   - Content: selected products, card style, CTA label.
   - Presets: horizontal carousel, 3-card editorial grid, full-width product story.

5. `materialShowcase`
   - Purpose: explain fabric, GSM, fit, construction.
   - Content: material name, GSM, composition, fit notes, quality checks, close-up media.
   - Presets: specs grid, split detail, fabric cards.

6. `fitGuidePreview`
   - Purpose: reduce sizing friction.
   - Content: fit description, size guide CTA, model stats, garment measurements summary.
   - Presets: compact guide, model card, comparison cards.

7. `storytelling`
   - Purpose: long-form campaign narrative.
   - Content: story title, story body, chapters, symbolic visuals.
   - Presets: chapter scroll, editorial article, image-led story.

8. `specialEvent`
   - Purpose: launch event, giveaway, pop-up, limited preorder, waitlist.
   - Content: event title, date/time, location/link, CTA, rules, form embed.
   - Presets: event card, countdown event, location split.

9. `lookbook`
   - Purpose: visual campaign gallery.
   - Content: images/videos, captions, layout type.
   - Presets: masonry, carousel, editorial grid.

10. `socialProof`
   - Purpose: testimonials, UGC, waitlist count later.
   - Content: testimonials, creator quotes, Instagram previews.
   - Presets: quote row, creator cards, UGC grid.

11. `newsletterWaitlist`
   - Purpose: collect leads.
   - Content: headline, input fields, preferred product options, consent copy.
   - Presets: minimal form, full-width oath form, split form.

12. `finalCTA`
   - Purpose: close the landing page.
   - Content: CTA title, body, buttons, emblem/background.
   - Presets: centered, footer-overlap, product CTA.

## Implementation (Drop Editor)
- UI: `DropActsBuilderPanel` (`src/features/admin/drops/DropActsBuilderPanel.tsx`), lazy-loaded from `DropEditorRoute` (**Acts** tab). Each row: reorder, enable/disable, nature, preset, shared copy (eyebrow/title/subtitle/body), **act-level media** (image upload or URL, optional video URL, alt), **animation** (enabled, desktop-only, motion type key, intensity), nature-specific **content** sub-forms, and optional **product SKUs** for `productShowcase` (catalog checkboxes; empty means "use all drop products"). Nature, preset, animation intensity, and nature-specific enums (e.g. product showcase **card style**, lookbook **layout**) use **AdminSelect** (Radix, portaled dropdown) rather than native **`<select>`**, aligned with Basics field labelling (**`aria-labelledby`** + trigger **`id`**).
- Bootstrap: new drops / defaults still seed `acts` from `DropLandingContent` in `drops.defaults.ts` via `landingContentToSimpleActs`. In the editor, **Reset acts from landing copy** re-imports validated `Drop.landingContent` JSON into acts; there is no automatic on-mount sync when `acts` is empty.
- Validation: per-nature `content` objects are narrowed with `safeParseActContent` in `acts/landingActs.zod.ts` (Zod); the panel resets `content` when nature changes.
- Public pipeline: `acts/landingActs.normalize.ts` maps slot toggles to `PublicLandingAct` rows consumed by `PublicLandingActs` on `/`. For the Drop Editor preview, `composeLandingPageFromDrop(..., { editorActsPreview: true })` maps `Drop.acts` via `publicLandingActsFromDraftActs` only (no `landingActSequence` merge). The transitional `useDraftActsPipeline` option still prefers acts when non-empty for tools/tests. Default storefront compose still hydrates `hero` / `manifesto` / `dropReveal` / `pieces` / `materials` / `waitlist` on `LandingPageCmsContent` from `Drop.landingContent`; the **`landingActs`** rail uses `landingActSequence` when `acts` is empty unless a caller passes `useDraftActsPipeline` / full acts pipeline options.
## Animation config
```ts
type ActAnimationConfig = {
  enabled: boolean;
  desktopOnly: boolean;
  type: 'fadeUp' | 'parallax' | 'pinReveal' | 'stagger' | 'videoScrub' | 'none';
  intensity: 'low' | 'medium' | 'high';
  duration?: number;
  scrub?: boolean;
};
```

## Runtime contracts
`LandingAct`, `ActNature`, and `ActAnimationConfig` (plus `ActMedia`) are defined as Zod schemas in `src/features/landing/schemas/landing-act.schema.ts` with type re-exports in `src/features/landing/types/landing-act.types.ts`. Per-act `content` remains `Record<string, unknown>` until nature-specific content schemas are added.

## Rendering rules
- Every act nature maps to a renderer component.
- Every nature has a schema for its `content` object.
- Unknown/invalid acts must fail gracefully with a hidden fallback in production and visible warning in CMS preview (`PublicLandingActs` with `cmsPreview`, plus `DropEditorPreviewErrorBoundary` in `DropEditorLivePreview` for hard render failures).
- Heavy act renderers should be lazy-loaded.
- Public homepage: composed `landingActs` follow the active drop's `landingActSequence`; the `/` route uses `PublicLandingActs` to map `nature` to existing marketing sections (lazy-loaded after Act I) and skips unknown types with a minimal notice. The Drop Editor live preview prefers `Drop.acts` when present so builder state matches immediately.
