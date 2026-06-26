import type { OmResolvedContent } from '../content/oathModernContent.defaults'
import type { Product } from '@/features/products/types/product.types'
import { ExperienceProductCard } from '@/features/products/components/ExperienceProductCard'
import { OmChapterShell, OmCtaLink, OmEyebrow, OmHeading } from './OmPrimitives'

/**
 * Chapter V — The Armory. The product system enters the same world: the three
 * Drop 01 pieces staged as cards (rendered through the experience-aware
 * {@link ExperienceProductCard} seam) with their ceremonial taglines. This is the
 * pivot from story into commerce.
 */
export function OmArmory({
  content,
  products,
}: {
  content: OmResolvedContent
  products: Product[]
}) {
  const c = content.collection
  // Hero product first, then the rest, capped to the three-piece drop.
  const ordered = [
    ...products.filter((p) => p.slug === c.heroProductSlug),
    ...products.filter((p) => p.slug !== c.heroProductSlug),
  ].slice(0, 3)

  return (
    <OmChapterShell id="armory" chapter="armory">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <OmEyebrow>{c.eyebrow}</OmEyebrow>
          <OmHeading text={c.title} className="mt-6 text-4xl sm:text-5xl" />
        </div>
        <OmCtaLink href={c.viewAllHref} tone="ghost" className="h-11 px-6">
          {c.viewAllLabel}
        </OmCtaLink>
      </div>

      {ordered.length > 0 ? (
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((product, i) => (
            <div key={product.id} data-om-reveal data-om-product={product.slug}>
              <ExperienceProductCard
                product={product}
                variant={i === 0 ? 'featured' : 'editorial'}
                tagline={c.taglines[product.slug]}
                index={i + 1}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-14 text-sm text-[color:var(--color-text-muted)]">
          The drop is being forged. Check back shortly.
        </p>
      )}
    </OmChapterShell>
  )
}
