import { useMemo } from 'react'
import type { Product } from '@/features/products/types/product.types'
import { sanitizeHref } from '@/shared/lib/url'
import { ProductCardTechForge } from '@/features/products/components/ProductCardTechForge'
import type { TmResolvedContent } from '../content/theoathModernContent.defaults'
import { TmEyebrow, TmSectionShell } from './TmPrimitives'

/**
 * Drop 01 collection — exactly three pieces, the hero product (compression shirt
 * by default) rendered as the large featured card. Uses the shared Theoath
 * Modern card (`ProductCardTechForge`) so the landing and the shop speak one
 * card language. Title/price/image come from the live catalog; only the
 * emotional tagline is CMS copy.
 */
export function TmCollection({
  content,
  products,
}: {
  content: TmResolvedContent
  products: Product[]
}) {
  const { collection } = content
  const ordered = useMemo(() => {
    const hero = products.find((p) => p.slug === collection.heroProductSlug)
    const rest = products.filter((p) => p.slug !== collection.heroProductSlug)
    return hero ? [hero, ...rest] : products
  }, [products, collection.heroProductSlug])

  return (
    <TmSectionShell id="collection" section="collection">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <TmEyebrow>{collection.eyebrow}</TmEyebrow>
          <h2
            data-tm-heading
            data-tm-reveal-m
            className="anvl-heading mt-4 text-3xl uppercase leading-tight sm:text-4xl lg:text-5xl"
          >
            {collection.title}
          </h2>
        </div>
        <a
          href={sanitizeHref(collection.viewAllHref) || '/shop'}
          className="focus-ring text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--color-highlight)] hover:underline"
        >
          {collection.viewAllLabel}
        </a>
      </div>

      <div data-tm-parallax="0.04" className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {ordered.map((product, i) => (
          <div key={product.id} data-tm-reveal-m>
            <ProductCardTechForge
              product={product}
              variant={i === 0 ? 'featured' : 'default'}
              tagline={collection.taglines[product.slug]}
              index={i + 1}
            />
          </div>
        ))}
      </div>
    </TmSectionShell>
  )
}
