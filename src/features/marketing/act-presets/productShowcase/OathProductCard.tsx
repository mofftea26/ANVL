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
        'group relative flex flex-col overflow-hidden rounded border border-[var(--color-line)] bg-[var(--color-surface)]/40 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]',
        featured && 'md:col-span-2 md:row-span-2',
        className,
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-[var(--color-bg)]',
          compact ? 'aspect-[4/5]' : 'aspect-[3/4]',
        )}
      >
        {img ? (
          <img
            src={img.src}
            alt={img.alt}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[var(--color-muted)]">
            No image
          </div>
        )}
        {sale ? (
          <span className="absolute left-2 top-2 rounded bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-bg)]">
            {sale}
          </span>
        ) : null}
      </div>
      <div className={cn('flex flex-1 flex-col gap-0.5', compact ? 'p-2' : 'gap-1 p-3 sm:p-4')}>
        {!compact ? (
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
            {product.dropName}
          </p>
        ) : null}
        <h3
          data-act-title
          className={cn(
            'font-display uppercase leading-tight text-[var(--color-fg)]',
            compact ? 'text-sm' : 'text-lg sm:text-xl',
          )}
        >
          {product.name}
        </h3>
        <p
          data-act-body
          className={cn(
            'text-[var(--color-muted)]',
            compact ? 'line-clamp-1 text-xs' : 'line-clamp-2 text-sm',
          )}
        >
          {[product.fit, product.fabric, product.gsm].filter(Boolean).join(' · ')}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-medium text-[var(--color-fg)]">
            {formatProductPrice(product)}
          </span>
          <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
            {productAvailabilityLabel(product)}
          </span>
        </div>
      </div>
    </a>
  )
}
