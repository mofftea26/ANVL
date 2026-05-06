import { useState } from 'react'
import type { Product } from '@/features/products/types/product.types'
import { cn } from '@/shared/lib/cn'

export function ProductGallery({ product }: { product: Product }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = product.images[activeIndex] ?? product.images[0]

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-[var(--color-line)]">
        <img
          src={activeImage?.src ?? '/brand/placeholder-product.webp'}
          alt={activeImage?.alt ?? `${product.name} product image`}
          className="aspect-[4/5] w-full object-cover"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {product.images.map((image, index) => (
          <button
            key={image.src}
            className={cn(
              'overflow-hidden rounded-md border',
              index === activeIndex
                ? 'border-[var(--color-accent)]'
                : 'border-[var(--color-line)]',
            )}
            onClick={() => setActiveIndex(index)}
            aria-label={`View ${product.name} image ${index + 1}`}
          >
            <img src={image.src} alt={image.alt} className="aspect-square w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
