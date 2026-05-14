# Feature — Drops CMS

## Purpose
Drops are the central content unit for ANVL campaigns. Each drop controls the landing page content, campaign theme, release date, drop page, and linked products.

## Drop statuses
- `draft`: being created, not public.
- `inactive`: ready but not active.
- `scheduled`: will activate on `scheduledActivationAt`.
- `active`: powers landing page and active drop route/nav label.
- `archived`: hidden from active selection but kept for history.

Only one drop can be active.

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

## CMS UX
The Drops section should be simple:
1. Drop list with search, status tabs, release date, scheduled activation, product count, and last edited date.
2. Clear actions: Create, Edit, Preview, Duplicate, Set Active, Schedule, Archive, Delete.
3. The admin list (`DropsAdminList` at `/admin/drops`) uses the runtime `CmsClient` for reads and mutations, TanStack Query for server state, and a small Zustand store for search and tab UI only.
4. Create Drop flow:
   - Step 1: Basic info.
   - Step 2: Theme/branding.
   - Step 3: Acts builder.
   - Step 4: Products assignment.
   - Step 5: SEO.
   - Step 6: Save options.
5. Save options:
   - Save as draft.
   - Save and set inactive.
   - Save and make active.
   - Save and schedule.

## Live preview
The CMS must show a live preview while editing:
- Theme changes update instantly.
- Act order changes update instantly.
- Media selection updates instantly.
- Desktop/mobile preview toggle.
- Preview must not mutate published data until Save.

## Active drop behavior
When a drop becomes active:
- Landing page uses that drop's acts.
- Drop nav item changes label and link to active drop.
- Header/footer/mobile links whose `href` starts with `/drop/` are rewritten to `/drop/{activeSlug}` and their **label** is set to the active drop **title** (for example “The Oath”).
- Site theme variables update to the active drop palette (SSR inline `:root` style on the public shell plus `ActiveDropThemeBridge` after hydration).
- The public `/drop/:slug` route resolves only the active drop: a mismatched slug redirects to the active slug.
- Drop page shows title, subtitle, optional hero backdrop (`visuals.heroImageUrl`), emblem, description, optional **release** block (`releaseDate` with client-side countdown after hydration), and assigned product cards linking to `/shop/$slug`.
- Products assigned to the drop become visible in the global shop if their product status allows it.

## Public homepage act pipeline
- `landingActSequence` on each drop is the ordered list of six canonical slots (`hero`, `manifesto`, `dropReveal`, `pieces`, `materials`, `waitlist`) with an `enabled` flag per slot.
- `composeLandingPageFromDrop` adds `landingActs` to `LandingPageCmsContent`: public descriptors with `nature` (e.g. `productShowcase`), `preset`, `sortOrder`, and `animation` defaults for future GSAP gating.
- The public `/` route renders `PublicLandingActs`, which switches on `nature` to existing section components (Act III onward lazy-loaded) and degrades unknown types to a small on-page notice.
- Hero GSAP runs only at `min-width: 768px` with `prefers-reduced-motion: no-preference`; mobile and reduced-motion users see a static hero layout for speed and accessibility.
