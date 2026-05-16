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

## Runtime contracts
Zod schemas and inferred TypeScript types for the canonical `Drop`, `DropTheme`, and `DropBranding` shapes live in `src/features/drops/schemas/drop.schema.ts` and `src/features/drops/types/drop.types.ts`. Example validated data for Drop 01 — The Oath is exported from `src/content/seed/drop-01-the-oath.seed.ts`.

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
- Site theme variables update to the active drop palette.
- Drop page uses that drop's title, subtitle, visuals, description, and product cards.
- Products assigned to the drop become visible in the global shop if their product status allows it.

## Drop editor shell (local CMS)
The `/admin/drops/$dropId` route renders a mobile-first scroll layout with an `xl+` preview column placeholder:

1. **Basic info** — identity fields; status shown read-only (changed via save options).
2. **Theme & branding** — palette preset, colors, emblem/logo assets.
3. **Acts builder** — placeholder until the acts builder ships.
4. **Products assignment** — placeholder with linked product count.
5. **SEO** — placeholder; persisted SEO remains until a future editor writes changes.
6. **Save & publish** — validates title, slug, and known theme preset; optional activate-after-save; optional schedule (`datetime-local` → `scheduledActivationAt`); confirmation modal; brief "Saved" state on the primary button.

Draft edits stay in React state until `saveDrop` runs so public data does not change until save.

## Storefront runtime clients
Public routes and loaders should depend on `runtimeClients` from `src/app/config/runtime.ts`, not ad hoc `localStorage` reads.

- **Server (`isServer: true`)**: `createRuntimeClients` wires **seed** CMS/commerce/SEO/site-settings adapters. They use composed defaults (active oath drop + default layout) so SSR is deterministic and never touches `window.localStorage`.
- **Browser (`isServer: false`)**: the same factory wires **localStorage-backed** adapters that delegate to admin services (`getLandingCmsContent`, drops storage, products storage, layout storage) so CMS edits and the storefront stay in sync.

`SeoClient` resolves per-path SEO (including `/shop`); `SiteSettingsClient` exposes header/footer layout for future chrome loaders.

`landingActSequence` on each persisted `Drop` is normalized when merging from storage (`normalizeLandingActSequence` in `drops.actSequence.ts`) so every landing slot exists in canonical order; new drops use `defaultLandingActSequence()`.

TODO hooks in adapter modules mark where Medusa or a headless CMS client will replace the implementation later.

## Active drop storefront theme (runtime CMS)
- `CmsClient.getActiveDrop()` returns the campaign drop used for public storefront theming (or `null` when none). Seed and localStorage adapters delegate to `drops.service` / seed snapshots as appropriate.
- The root route loads `activeDrop` with landing CMS content, skips it for `/admin` paths, and emits serialized palette CSS in `head` so SSR and the client share the same `:root` variables (see `docs/design-system.md`).
- `ActiveDropThemeProvider` wraps public header, main, and footer; it subscribes to drop storage changes and refreshes via the runtime CMS client. Official header/footer logos remain global brand assets, not drop campaign marks.
