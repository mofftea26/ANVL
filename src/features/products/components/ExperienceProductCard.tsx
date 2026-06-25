import { ProductCard } from '@/shared/components/ui/ProductCard'
import { useExperienceVariant } from '@/features/experience'
import type { Product } from '@/features/products/types/product.types'
import { ProductCardTechForge } from './ProductCardTechForge'

/**
 * Experience-aware product card. Resolves the classic ANVL card or the Theoath
 * Modern technical card through the central `useExperienceVariant` seam — the
 * one approved place this swap happens, so call sites never branch on the
 * experience key. Must be rendered inside the storefront `ExperienceProvider`.
 */
export function ExperienceProductCard({ product }: { product: Product }) {
  const Card = useExperienceVariant('productCard', {
    classic: ProductCard,
    techForge: ProductCardTechForge,
  })
  return <Card product={product} />
}
