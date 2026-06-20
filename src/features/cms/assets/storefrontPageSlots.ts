import type { AssetSlotDefinition } from '@/features/landingPages/assetSlots'

/**
 * A storefront (non-landing) page that exposes code-defined asset slots in the
 * CMS Assets editor. Assignments are stored under `asset_config.pages[key]` and
 * resolved per page via {@link resolveStorefrontPageAssets}.
 *
 * To add a page: append an entry here, then consume its assets in the route's
 * loader with `resolveStorefrontPageAssets(projection.assets, key, mediaIndex)`.
 */
export type StorefrontPageDefinition = {
  /** Stable key used as the `asset_config.pages` bucket and editor scope. */
  key: string
  /** Editor-facing label (shown in the scope picker). */
  name: string
  /** The storefront route this page maps to (documentation/admin only). */
  route: string
  slots: AssetSlotDefinition[]
}

/** Reusable "social share image" slot — Open Graph / Twitter card. */
const ogImageSlot: AssetSlotDefinition = {
  key: 'ogImage',
  label: 'Social share image',
  kind: 'image',
  section: 'Social',
  hint: '1200×630 (1.91:1). WebP/JPG ~80q, < 300 KB. Used for link previews.',
}

export const STOREFRONT_PAGE_REGISTRY: StorefrontPageDefinition[] = [
  {
    key: 'shop',
    name: 'Shop — Armory',
    route: '/shop',
    slots: [
      {
        key: 'heroImage',
        label: 'Hero backdrop',
        kind: 'image',
        section: 'Hero',
        hint: '16:9 landscape, 1920×1080. WebP ~80q, 250–500 KB. Subject off the left third (headline sits there); layers above the ember atmosphere.',
      },
      {
        key: 'emptyStateImage',
        label: 'Empty-state illustration',
        kind: 'image',
        section: 'Empty state',
        hint: 'Square or 4:3, ~1000×1000. Transparent PNG/WebP, < 200 KB. Shown when filters match nothing.',
      },
      ogImageSlot,
    ],
  },
  {
    key: 'pdp',
    name: 'Product detail',
    route: '/shop/:slug',
    slots: [
      {
        key: 'galleryFallback',
        label: 'Gallery fallback',
        kind: 'image',
        section: 'Gallery',
        hint: '3:4 portrait, 1200×1600. WebP ~80q, < 400 KB. Shown when a piece has no media yet.',
      },
      ogImageSlot,
    ],
  },
  {
    key: 'cart',
    name: 'Cart',
    route: '/cart',
    slots: [
      {
        key: 'emptyStateImage',
        label: 'Empty-cart illustration',
        kind: 'image',
        section: 'Empty state',
        hint: 'Square ~1000×1000. Transparent PNG/WebP, < 200 KB.',
      },
      ogImageSlot,
    ],
  },
  {
    key: 'checkout',
    name: 'Checkout',
    route: '/checkout',
    slots: [ogImageSlot],
  },
  {
    key: 'checkout-success',
    name: 'Order confirmed',
    route: '/checkout/success',
    slots: [
      {
        key: 'heroImage',
        label: 'Confirmation backdrop',
        kind: 'image',
        section: 'Hero',
        hint: '16:9 landscape, 1920×1080. WebP ~80q, 250–500 KB.',
      },
      ogImageSlot,
    ],
  },
  {
    key: 'about',
    name: 'About',
    route: '/about',
    slots: [
      {
        key: 'heroImage',
        label: 'Hero image',
        kind: 'image',
        section: 'Hero',
        hint: '16:9 landscape, 1920×1080. WebP ~80q, 250–500 KB.',
      },
      {
        key: 'portraitImage',
        label: 'Founder / atelier portrait',
        kind: 'image',
        section: 'Story',
        hint: '3:4 portrait, 1200×1600. WebP ~80q, < 400 KB.',
      },
      {
        key: 'midSectionImage',
        label: 'Mid-section image',
        kind: 'image',
        section: 'Story',
        hint: 'Landscape ~1600×1066. WebP ~70q, 120–250 KB.',
      },
      ogImageSlot,
    ],
  },
  {
    key: 'contact',
    name: 'Contact',
    route: '/contact',
    slots: [
      {
        key: 'heroImage',
        label: 'Hero image',
        kind: 'image',
        section: 'Hero',
        hint: '16:9 landscape, 1920×1080. WebP ~80q, 250–500 KB.',
      },
      ogImageSlot,
    ],
  },
  {
    key: 'story',
    name: 'Story / Saga',
    route: '/story',
    slots: [ogImageSlot],
  },
  {
    key: 'auth',
    name: 'Sign in / Sign up',
    route: '/auth/*',
    slots: [
      {
        key: 'brandPanelImage',
        label: 'Brand panel image',
        kind: 'image',
        section: 'Layout',
        hint: 'Portrait/landscape side panel, ~1200×1600. WebP ~80q, < 400 KB.',
      },
      ogImageSlot,
    ],
  },
  {
    key: 'account',
    name: 'Account',
    route: '/account',
    slots: [ogImageSlot],
  },
  {
    key: 'size-guide',
    name: 'Size guide',
    route: '/size-guide',
    slots: [
      {
        key: 'heroImage',
        label: 'Hero image',
        kind: 'image',
        section: 'Hero',
        hint: '16:9 landscape, 1920×1080. WebP ~80q, 250–500 KB.',
      },
      {
        key: 'diagramImage',
        label: 'Measurement diagram',
        kind: 'image',
        section: 'Reference',
        hint: 'Square/landscape, ~1400×1000. Transparent PNG/WebP, < 250 KB.',
      },
      ogImageSlot,
    ],
  },
  {
    key: 'care-guide',
    name: 'Care guide',
    route: '/care-guide',
    slots: [
      {
        key: 'heroImage',
        label: 'Hero image',
        kind: 'image',
        section: 'Hero',
        hint: '16:9 landscape, 1920×1080. WebP ~80q, 250–500 KB.',
      },
      ogImageSlot,
    ],
  },
  {
    key: 'returns',
    name: 'Returns',
    route: '/returns',
    slots: [ogImageSlot],
  },
  {
    key: 'privacy',
    name: 'Privacy policy',
    route: '/privacy',
    slots: [ogImageSlot],
  },
  {
    key: 'terms',
    name: 'Terms of service',
    route: '/terms',
    slots: [ogImageSlot],
  },
]

const STOREFRONT_PAGE_SLOTS: Record<string, AssetSlotDefinition[]> =
  Object.fromEntries(STOREFRONT_PAGE_REGISTRY.map((p) => [p.key, p.slots]))

const STOREFRONT_PAGE_KEYS = new Set(STOREFRONT_PAGE_REGISTRY.map((p) => p.key))

export function isStorefrontPageKey(key: string): boolean {
  return STOREFRONT_PAGE_KEYS.has(key)
}

export function getStorefrontPageSlots(pageKey: string): AssetSlotDefinition[] {
  return STOREFRONT_PAGE_SLOTS[pageKey] ?? []
}

export function getStorefrontPagePassthroughKeys(pageKey: string): Set<string> {
  return new Set(
    getStorefrontPageSlots(pageKey)
      .filter((slot) => slot.passthrough)
      .map((slot) => slot.key),
  )
}

/** Picker-facing metadata for the Assets editor scope list. */
export function listStorefrontPages(): { key: string; name: string }[] {
  return STOREFRONT_PAGE_REGISTRY.map(({ key, name }) => ({ key, name }))
}
