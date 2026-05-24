import { useRef } from 'react'
import { previewFinalCtaFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Product-forward final CTA — highlights first assigned product. */
export function ProductCtaPreset({ row, products }: ActPresetProps) {
  const cta = previewFinalCtaFields(row)
  const product = products[0]
  const root = useRef<HTMLElement | null>(null)

  useActScrollReveal(root, {
    snapSelectors: ['[data-product-cta-copy]', '[data-product-cta-card]'],
    staggerSelector: '[data-product-cta-line]',
  })

  return (
    <section
      ref={root}
      className="border-b border-[var(--color-line)] bg-[var(--color-bg)] py-16 md:py-24"
      aria-label="Shop call to action"
    >
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center">
        <div data-product-cta-copy>
          <p
            data-product-cta-line
            className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
          >
            {cta.actLabel}
          </p>
          <h2
            data-product-cta-line
            className="anvl-display text-[clamp(1.75rem,3.5vw,2.75rem)]"
          >
            {cta.heading}
          </h2>
          {cta.intro ? (
            <p
              data-product-cta-line
              className="mt-4 text-sm text-[var(--color-text-muted)]"
            >
              {cta.intro}
            </p>
          ) : null}
          <div data-product-cta-line className="mt-8 flex flex-wrap gap-3">
            <SafeLink href={cta.primaryCta.href} className="anvl-btn anvl-btn-primary">
              {cta.primaryCta.label}
            </SafeLink>
            {cta.tertiaryCta.label.trim() ? (
              <SafeLink href={cta.tertiaryCta.href} className="anvl-btn anvl-btn-ghost">
                {cta.tertiaryCta.label}
              </SafeLink>
            ) : null}
          </div>
        </div>
        {product ? (
          <article
            data-product-cta-card
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Featured piece
            </p>
            <h3 className="mt-3 text-lg font-semibold">{product.name}</h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {product.role} · {product.fabric}
            </p>
            <SafeLink
              href={`/shop/${product.slug}`}
              className="anvl-btn anvl-btn-ghost mt-6 inline-flex"
            >
              View {product.name}
            </SafeLink>
          </article>
        ) : null}
      </Container>
    </section>
  )
}
