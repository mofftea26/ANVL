import { useMemo, useState } from 'react'
import type { Product } from '@/features/products/types/product.types'
import { cn } from '@/shared/lib/cn'
import { withShopifyImageWidth } from '@/shared/lib/url'

/** Main gallery image renders up to ~700 CSS px wide; covers retina at that size. */
const MAIN_IMAGE_WIDTH = 1400
/** Thumbnails render at ~100-150 CSS px. */
const THUMBNAIL_IMAGE_WIDTH = 300

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
          src={withShopifyImageWidth(
            activeImage?.src ?? '/brand/placeholder-product.svg',
            MAIN_IMAGE_WIDTH,
          )}
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
            type="button"
            className={cn(
              'focus-ring overflow-hidden rounded-md border',
              index === activeIndex
                ? 'border-[var(--color-accent)]'
                : 'border-[var(--color-line)]',
            )}
            onClick={() => setActiveIndex(index)}
            aria-label={`View ${product.name} image ${index + 1}`}
            aria-pressed={index === activeIndex}
          >
            <img
              src={withShopifyImageWidth(image.src, THUMBNAIL_IMAGE_WIDTH)}
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
