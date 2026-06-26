import type { ComponentType } from 'react'
import { ProductCard } from '@/shared/components/ui/ProductCard'
import { useExperienceVariant } from '@/features/experience'
import type { Product } from '@/features/products/types/product.types'
import type { ProductCardVariant } from './productCardVariants'
import { ProductCardCeremonial } from './ProductCardCeremonial'

export interface ExperienceProductCardProps {
  product: Product
  /** Presentation variant (ceremonial card only; classic ignores it). */
  variant?: ProductCardVariant
  /** Optional ceremonial line (featured / Armory). */
  tagline?: string
  /** Optional 1-based catalog index. */
  index?: number
}

/**
 * Experience-aware product card. Resolves the classic ANVL card (The Oath) or the
 * Oath Modern ceremonial card through the central `useExperienceVariant` seam —
 * the one approved place this swap happens, so call sites never branch on the
 * experience key. The classic card only consumes `product`; the extra
 * presentation props are ignored there and honoured by the ceremonial card. Must
 * be rendered inside the storefront `ExperienceProvider`.
 */
export function ExperienceProductCard(props: ExperienceProductCardProps) {
  const Card = useExperienceVariant<ComponentType<ExperienceProductCardProps>>(
    'productCard',
    {
      classic: ProductCard,
      techForge: ProductCardCeremonial,
    },
  )
  return <Card {...props} />
}
