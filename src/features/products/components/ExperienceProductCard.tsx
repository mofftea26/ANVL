import { ProductCard } from '@/shared/components/ui/ProductCard'
import { useExperienceVariant } from '@/features/experience'
import type { Product } from '@/features/products/types/product.types'

/**
 * Experience-aware product card. Resolves the card variant through the central
 * `useExperienceVariant` seam — the one approved place this swap happens, so call
 * sites never branch on the experience key. The storefront currently ships a
 * single experience (The Oath, classic), so every variant resolves to the classic
 * ANVL card; the seam stays in place for future experiences. Must be rendered
 * inside the storefront `ExperienceProvider`.
 */
export function ExperienceProductCard({ product }: { product: Product }) {
  const Card = useExperienceVariant('productCard', {
    classic: ProductCard,
    techForge: ProductCard,
  })
  return <Card product={product} />
}
