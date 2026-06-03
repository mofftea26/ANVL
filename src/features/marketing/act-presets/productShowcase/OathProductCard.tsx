import type { Product } from '@/features/products/types/product.types'
import { cn } from '@/shared/lib/cn'
import {
  formatProductPrice,
  productAvailabilityLabel,
  productSaleLabel,
  resolveProductHref,
} from './oathProductUtils'

type OathProductCardProps = {
  product: Product
  className?: string
  featured?: boolean
  compact?: boolean
}

export function OathProductCard({ product, className, featured, compact }: OathProductCardProps) {
  const img = product.images[0]
  const sale = productSaleLabel(product)

  return (
    <a
      href={resolveProductHref(product)}
      target="_blank"
      rel="noopener noreferrer"
      data-act-block
      data-act-micro
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[var(--act-card-radius)] border border-[var(--color-line)] bg-[var(--color-surface)]/40 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]',
        featured && 'md:col-span-2 md:row-span-2',
        className,
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-[var(--color-bg)]',
          compact ? 'aspect-[4/5] max-h-[58%]' : 'aspect-[3/4]',
        )}
      >
        {img ? (
          <img
            src={img.src}
            alt={img.alt}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[var(--color-muted)]">
            No image
          </div>
        )}
        {sale ? (
          <span
            data-act-card-meta
            className="absolute left-1.5 top-1.5 rounded bg-[var(--color-accent)] px-1.5 py-0.5 font-semibold text-[var(--color-bg)]"
          >
            {sale}
          </span>
        ) : null}
      </div>
      <div className={cn('flex min-h-0 flex-1 flex-col gap-0.5', compact ? 'p-1.5' : 'p-2.5')}>
        {!compact ? (
          <p data-act-eyebrow>{product.dropName}</p>
        ) : null}
        <h3 data-act-card-title className="line-clamp-2">
          {product.name}
        </h3>
        <p data-act-card-body className={cn(compact ? 'line-clamp-1' : 'line-clamp-2')}>
          {[product.fit, product.fabric, product.gsm].filter(Boolean).join(' · ')}
        </p>
        <div className="mt-auto flex items-center justify-between gap-1 pt-1">
          <span data-act-card-title className="font-medium normal-case tracking-normal">
            {formatProductPrice(product)}
          </span>
          <span data-act-card-meta>{productAvailabilityLabel(product)}</span>
        </div>
      </div>
    </a>
  )
}
