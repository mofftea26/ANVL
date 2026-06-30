import { z } from 'zod'

/**
 * Shop Experience configuration — the CMS-controlled layout/behavior/copy blob
 * for the `/shop` page. Mirrors how `theme_config` / `landing_content` flow:
 * edited locally → `adminCmsRemoteSync` → `cms_settings.shop_config` +
 * `storefront_publication.shop_config` → SSR projection.
 *
 * Every field carries a safe default via `.catch(...)` so partial, legacy, or
 * tampered blobs never crash a render — missing/invalid keys fall back to the
 * designed default instead. There is NO color here: the shop derives all color
 * from the active theme's `--shop-*` tokens (see `themeConfigToCssVars`).
 */

/** Sort tokens the shop understands (kept in sync with `shopUrlSearch.ShopSort`). */
export const SHOP_SORT_VALUES = [
  'featured',
  'newest',
  'price-asc',
  'price-desc',
  'name-asc',
  'availability',
] as const
export type ShopSortValue = (typeof SHOP_SORT_VALUES)[number]

/** Filter groups the toolbar can show, in their default display order. */
export const SHOP_FILTER_KEYS = [
  'status',
  'category',
  'drop',
  'source',
  'color',
  'size',
  'price',
] as const
export type ShopFilterKey = (typeof SHOP_FILTER_KEYS)[number]

export const shopGridDensitySchema = z.enum(['comfortable', 'compact', 'spacious'])
export const shopCardStyleSchema = z.enum(['forged', 'banner'])
export const shopCardAnimationSchema = z.enum(['off', 'subtle', 'full'])
export const shopCardAspectSchema = z.enum(['portrait', 'square', 'tall'])
export const shopImageFitSchema = z.enum(['cover', 'contain'])
export const shopDesktopColumnsSchema = z.union([z.literal(3), z.literal(4)])

const sortValueSchema = z.enum(SHOP_SORT_VALUES)
const filterKeySchema = z.enum(SHOP_FILTER_KEYS)

export const DEFAULT_SHOP_CONFIG = {
  heading: 'The Armory',
  eyebrow: 'Drop 01 — The Oath',
  intro:
    'Premium bodybuilding gymwear forged for disciplined lifters. Filter by drop, size, and availability.',
  editorialCopy: '',
  heroVisible: true,
  gridDensity: 'comfortable' as const,
  desktopColumns: 3 as const,
  defaultSort: 'featured' as ShopSortValue,
  enabledSortOptions: [
    'featured',
    'newest',
    'price-asc',
    'price-desc',
    'name-asc',
    'availability',
  ] as ShopSortValue[],
  filterOrder: [...SHOP_FILTER_KEYS] as ShopFilterKey[],
  filterVisibility: {
    status: true,
    category: true,
    drop: true,
    source: true,
    color: true,
    size: true,
    price: true,
  } as Record<ShopFilterKey, boolean>,
  stickyFilters: false,
  cardStyle: 'forged' as const,
  cardAnimationIntensity: 'full' as const,
  cardAspectRatio: 'portrait' as const,
  // `contain` floats the product on the visible material stage; `cover` fills the
  // media zone (hiding the stage). Default to `contain` so the card material reads.
  imageFit: 'contain' as const,
  quickViewEnabled: true,
  quickAddEnabled: true,
  showPrices: true,
  showComparePrices: true,
  showBadges: true,
  showSwatches: true,
  showSizes: true,
  showInventoryUrgency: false,
  cardRadius: 14,
  gridGap: 20,
  sectionSpacing: 64,
  animationDurationMultiplier: 1,
  advancedDesktopEffects: true,
  reducedEffectsMobile: true,
  editorialBanner: {
    visible: false,
    title: '',
    body: '',
  },
  emptyState: {
    title: 'The armory is being forged',
    body: 'No pieces are available right now. Check back soon.',
  },
  noResults: {
    title: 'No pieces match',
    body: 'Try clearing a filter or widening your price range.',
  },
  /** Product detail page (PDP) controls — section toggles, related count, motion. */
  pdp: {
    showMaterials: true,
    showColorways: true,
    showDesignDetails: true,
    showStory: true,
    showStoryBook: true,
    showSizeGuide: true,
    showRelated: true,
    relatedCount: 4 as 3 | 4 | 6,
    showShare: true,
    stickyBuyPanel: true,
    animationIntensity: 'full' as 'off' | 'subtle' | 'full',
  },
}

export const shopConfigSchema = z.object({
  heading: z.string().catch(DEFAULT_SHOP_CONFIG.heading),
  eyebrow: z.string().catch(DEFAULT_SHOP_CONFIG.eyebrow),
  intro: z.string().catch(DEFAULT_SHOP_CONFIG.intro),
  editorialCopy: z.string().catch(DEFAULT_SHOP_CONFIG.editorialCopy),
  heroVisible: z.boolean().catch(DEFAULT_SHOP_CONFIG.heroVisible),
  gridDensity: shopGridDensitySchema.catch(DEFAULT_SHOP_CONFIG.gridDensity),
  desktopColumns: shopDesktopColumnsSchema.catch(DEFAULT_SHOP_CONFIG.desktopColumns),
  defaultSort: sortValueSchema.catch(DEFAULT_SHOP_CONFIG.defaultSort),
  enabledSortOptions: z
    .array(sortValueSchema)
    .catch(DEFAULT_SHOP_CONFIG.enabledSortOptions),
  filterOrder: z.array(filterKeySchema).catch(DEFAULT_SHOP_CONFIG.filterOrder),
  filterVisibility: z
    .record(filterKeySchema, z.boolean())
    .catch(DEFAULT_SHOP_CONFIG.filterVisibility),
  stickyFilters: z.boolean().catch(DEFAULT_SHOP_CONFIG.stickyFilters),
  cardStyle: shopCardStyleSchema.catch(DEFAULT_SHOP_CONFIG.cardStyle),
  cardAnimationIntensity: shopCardAnimationSchema.catch(
    DEFAULT_SHOP_CONFIG.cardAnimationIntensity,
  ),
  cardAspectRatio: shopCardAspectSchema.catch(DEFAULT_SHOP_CONFIG.cardAspectRatio),
  imageFit: shopImageFitSchema.catch(DEFAULT_SHOP_CONFIG.imageFit),
  quickViewEnabled: z.boolean().catch(DEFAULT_SHOP_CONFIG.quickViewEnabled),
  quickAddEnabled: z.boolean().catch(DEFAULT_SHOP_CONFIG.quickAddEnabled),
  showPrices: z.boolean().catch(DEFAULT_SHOP_CONFIG.showPrices),
  showComparePrices: z.boolean().catch(DEFAULT_SHOP_CONFIG.showComparePrices),
  showBadges: z.boolean().catch(DEFAULT_SHOP_CONFIG.showBadges),
  showSwatches: z.boolean().catch(DEFAULT_SHOP_CONFIG.showSwatches),
  showSizes: z.boolean().catch(DEFAULT_SHOP_CONFIG.showSizes),
  showInventoryUrgency: z.boolean().catch(DEFAULT_SHOP_CONFIG.showInventoryUrgency),
  cardRadius: z.number().min(0).max(40).catch(DEFAULT_SHOP_CONFIG.cardRadius),
  gridGap: z.number().min(4).max(64).catch(DEFAULT_SHOP_CONFIG.gridGap),
  sectionSpacing: z.number().min(16).max(160).catch(DEFAULT_SHOP_CONFIG.sectionSpacing),
  animationDurationMultiplier: z
    .number()
    .min(0.5)
    .max(2)
    .catch(DEFAULT_SHOP_CONFIG.animationDurationMultiplier),
  advancedDesktopEffects: z.boolean().catch(DEFAULT_SHOP_CONFIG.advancedDesktopEffects),
  reducedEffectsMobile: z.boolean().catch(DEFAULT_SHOP_CONFIG.reducedEffectsMobile),
  editorialBanner: z
    .object({
      visible: z.boolean().catch(false),
      title: z.string().catch(''),
      body: z.string().catch(''),
    })
    .catch(DEFAULT_SHOP_CONFIG.editorialBanner),
  emptyState: z
    .object({
      title: z.string().catch(DEFAULT_SHOP_CONFIG.emptyState.title),
      body: z.string().catch(DEFAULT_SHOP_CONFIG.emptyState.body),
    })
    .catch(DEFAULT_SHOP_CONFIG.emptyState),
  noResults: z
    .object({
      title: z.string().catch(DEFAULT_SHOP_CONFIG.noResults.title),
      body: z.string().catch(DEFAULT_SHOP_CONFIG.noResults.body),
    })
    .catch(DEFAULT_SHOP_CONFIG.noResults),
  pdp: z
    .object({
      showMaterials: z.boolean().catch(true),
      showColorways: z.boolean().catch(true),
      showDesignDetails: z.boolean().catch(true),
      showStory: z.boolean().catch(true),
      showStoryBook: z.boolean().catch(true),
      showSizeGuide: z.boolean().catch(true),
      showRelated: z.boolean().catch(true),
      relatedCount: z
        .union([z.literal(3), z.literal(4), z.literal(6)])
        .catch(DEFAULT_SHOP_CONFIG.pdp.relatedCount),
      showShare: z.boolean().catch(true),
      stickyBuyPanel: z.boolean().catch(true),
      animationIntensity: shopCardAnimationSchema.catch(
        DEFAULT_SHOP_CONFIG.pdp.animationIntensity,
      ),
    })
    .catch(DEFAULT_SHOP_CONFIG.pdp),
})

export type ShopConfig = z.infer<typeof shopConfigSchema>
export type ShopPdpConfig = ShopConfig['pdp']

/**
 * Parse any stored shop-config blob into a complete, valid {@link ShopConfig}.
 * Non-object input → full defaults. Object input → per-field `.catch` defaults
 * fill any missing/invalid keys, so old or partial blobs upgrade silently.
 */
/** Nested config objects that must be deep-merged so partial blobs keep defaults. */
const SHOP_NESTED_KEYS = ['editorialBanner', 'emptyState', 'noResults', 'pdp'] as const

export function parseShopConfig(raw: unknown): ShopConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return shopConfigSchema.parse({ ...DEFAULT_SHOP_CONFIG })
  }
  const o = raw as Record<string, unknown>
  const merged: Record<string, unknown> = { ...DEFAULT_SHOP_CONFIG, ...o }
  // Deep-merge nested objects: a stored partial (e.g. only `pdp.showRelated`)
  // must keep the designed defaults for its other keys instead of resetting the
  // whole sub-object (the field `.catch` only fixes invalid present values).
  for (const key of SHOP_NESTED_KEYS) {
    const incoming = o[key]
    if (incoming && typeof incoming === 'object' && !Array.isArray(incoming)) {
      merged[key] = { ...(DEFAULT_SHOP_CONFIG[key] as object), ...(incoming as object) }
    }
  }
  return shopConfigSchema.parse(merged)
}
