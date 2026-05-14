import type { Product } from '@/features/products/types/product.types'
import type { Drop } from '@/features/admin/drops/drops.types'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import { Container, ProductCard, Section } from '@/shared/components/ui'
import { DropReleaseSection } from '@/features/drops/public/DropReleaseSection'
import { Link } from '@tanstack/react-router'

type Props = {
  drop: Drop
  products: Product[]
}

export function DropActivePageView({ drop, products }: Props) {
  const heroUrl = drop.visuals.heroImageUrl?.trim()

  return (
    <Section className="relative overflow-hidden">
      {heroUrl ? (
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
        >
          <img
            src={heroUrl}
            alt=""
            className="h-full w-full object-cover opacity-[0.22] saturate-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)] via-[var(--color-bg)]/92 to-[var(--color-bg)]" />
        </div>
      ) : null}

      <Container>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <p className="anvl-micro text-[var(--color-text-muted)]">
              Drop {drop.dropNumber}
            </p>
            <h1 className="anvl-heading mt-2 text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
              {drop.title}
            </h1>
            {drop.subtitle ? (
              <p className="mt-2 text-sm text-[var(--color-text-muted)] md:text-base">
                {drop.subtitle}
              </p>
            ) : null}
            {drop.description ? (
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base">
                {drop.description}
              </p>
            ) : null}

            <DropReleaseSection
              releaseDateIso={drop.releaseDate}
              className="mt-8 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/80 p-4 backdrop-blur-sm md:p-5"
            />

            <Link
              to="/shop"
              className="anvl-micro mt-8 inline-flex text-[var(--color-heading)] underline-offset-4 hover:underline"
            >
              Shop the full catalog →
            </Link>
          </div>

          <div className="flex justify-center lg:justify-end">
            <DropEmblemDecor
              src={drop.visuals.emblemImageUrl}
              presentationOnly
              className="h-48 w-auto opacity-95 sm:h-56 md:h-64 lg:h-80"
            />
          </div>
        </div>

        {products.length > 0 ? (
          <div className="mt-14 md:mt-20">
            <h2 className="anvl-heading text-3xl md:text-4xl">The pieces</h2>
            <p className="mt-2 max-w-lg text-sm text-[var(--color-text-muted)] md:text-base">
              Every silhouette in this drop is linked to its product page.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-14 text-sm text-[var(--color-text-muted)] md:mt-20">
            Pieces for this drop will appear here once they are assigned in the CMS.
          </p>
        )}
      </Container>
    </Section>
  )
}
