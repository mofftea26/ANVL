import { Link } from '@tanstack/react-router'
import { memo } from 'react'
import type { Product } from '@/features/products/types/product.types'
import { Badge } from './Badge'

export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] transition hover:scale-[1.01]">
      <Link to="/shop/$slug" params={{ slug: product.slug }} className="block no-underline">
        <div className="aspect-[4/5] overflow-hidden border-b border-[var(--color-line)]">
          <img
            src={product.images[0]?.src ?? '/brand/placeholder-product.webp'}
            alt={product.images[0]?.alt ?? `${product.name} editorial placeholder`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="anvl-heading text-2xl">{product.name}</h3>
            <p className="text-sm text-[var(--color-text-muted)]">${product.price}</p>
          </div>
          <p className="line-clamp-2 text-sm text-[var(--color-text-muted)]">{product.role}</p>
          <div className="flex flex-wrap gap-2">
            {product.colorways.map((colorway) => (
              <Badge key={colorway.name}>{colorway.name}</Badge>
            ))}
          </div>
        </div>
      </Link>
    </article>
  )
})
