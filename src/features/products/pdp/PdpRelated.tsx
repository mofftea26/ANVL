import type { Product } from '@/features/products/types/product.types'
import { PdpSection } from '@/features/products/pdp/PdpSection'
import { PdpRelatedCard } from '@/features/products/pdp/PdpRelatedCard'

/**
 * Related products as description cards. Count is CMS-controlled
 * (`pdp.relatedCount`). Each item reveals via the parent's `data-reveal` sweep.
 */
export function PdpRelated({ products, count }: { products: Product[]; count: number }) {
  const list = products.slice(0, count)
  if (list.length === 0) return null
  return (
    <PdpSection eyebrow="Complete the kit">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4">
        {list.map((p) => (
          <div key={p.id} data-reveal>
            <PdpRelatedCard product={p} />
          </div>
        ))}
      </div>
    </PdpSection>
  )
}
