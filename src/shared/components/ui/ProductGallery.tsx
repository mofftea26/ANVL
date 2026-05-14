import { useMemo, useState } from 'react'
import type { Product } from '@/features/products/types/product.types'
import { cn } from '@/shared/lib/cn'

export type ProductGalleryProps = {
  product: Product
  /** When set, overrides `product.images` (e.g. colorway-specific gallery). */
  images?: Array<{ src: string; alt: string }>
}

export function ProductGallery({ product, images }: ProductGalleryProps) {
  const list = useMemo(
    () => (images && images.length > 0 ? images : product.images),
    [images, product.images],
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = list[activeIndex] ?? list[0]

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-[var(--color-line)]">
        <img
          src={activeImage?.src ?? '/brand/placeholder-product.svg'}
          alt={activeImage?.alt ?? `${product.name} product image`}
          className="aspect-[4/5] w-full object-cover"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {list.map((image, index) => (
          <button
            key={`${image.src}-${index}`}
            className={cn(
              'overflow-hidden rounded-md border',
              index === activeIndex
                ? 'border-[var(--color-accent)]'
                : 'border-[var(--color-line)]',
            )}
            onClick={() => setActiveIndex(index)}
            aria-label={`View ${product.name} image ${index + 1}`}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="aspect-square w-full object-cover"
              loading="lazy"
              decoding="async"
              fetchPriority={index === activeIndex ? 'high' : 'low'}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
