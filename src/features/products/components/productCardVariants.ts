/**
 * Theoath Modern product-card visual variants. A single config map keyed by
 * variant — components read it instead of branching on the variant name, so
 * there are no scattered conditionals. The experience system / call site chooses
 * the variant; the card just renders the resolved config.
 *
 * Compact by design: a contained media frame with the metadata BELOW it (never a
 * large text overlay), so cards stay small and dense in a grid.
 */
export type ProductCardVariant =
  | 'default'
  | 'featured'
  | 'compact'
  | 'editorial'
  | 'recommendation'

export interface ProductCardVariantConfig {
  /** Media frame aspect ratio classes. */
  frame: string
  /** Product title type scale. */
  heading: string
  showTagline: boolean
  enableQuickAdd: boolean
  enableTilt: boolean
  /** Champagne emphasis frame (the dominant compression card) — not size. */
  emphasis: boolean
}

export const PRODUCT_CARD_VARIANTS: Record<
  ProductCardVariant,
  ProductCardVariantConfig
> = {
  default: {
    frame: 'aspect-[4/5]',
    heading: 'text-sm md:text-base',
    showTagline: false,
    enableQuickAdd: true,
    enableTilt: true,
    emphasis: false,
  },
  featured: {
    frame: 'aspect-[4/5]',
    heading: 'text-base md:text-lg',
    showTagline: true,
    enableQuickAdd: true,
    enableTilt: true,
    emphasis: true,
  },
  editorial: {
    frame: 'aspect-[3/4]',
    heading: 'text-sm md:text-base',
    showTagline: true,
    enableQuickAdd: true,
    enableTilt: true,
    emphasis: false,
  },
  compact: {
    frame: 'aspect-square',
    heading: 'text-sm',
    showTagline: false,
    enableQuickAdd: true,
    enableTilt: false,
    emphasis: false,
  },
  recommendation: {
    frame: 'aspect-[4/5]',
    heading: 'text-sm',
    showTagline: false,
    enableQuickAdd: false,
    enableTilt: false,
    emphasis: false,
  },
}
