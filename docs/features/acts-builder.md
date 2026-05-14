# Feature — Landing Page Acts Builder

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
  media?: ActMedia;
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

## Rendering rules
- Every act nature maps to a renderer component.
- Every nature has a schema for its `content` object.
- Unknown/invalid acts must fail gracefully with a hidden fallback in production and visible warning in CMS preview.
- Heavy act renderers should be lazy-loaded.
- Public homepage: composed `landingActs` follow the active drop's `landingActSequence`; the `/` route uses `PublicLandingActs` to map `nature` to existing marketing sections (lazy-loaded after Act I) and skips unknown types with a minimal notice.
