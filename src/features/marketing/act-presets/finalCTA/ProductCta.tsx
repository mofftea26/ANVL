import { useRef } from 'react'
import { previewFinalCtaFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { gsap } from '@/shared/lib/gsap'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Product-forward final CTA — highlights first assigned product. */
export function ProductCtaPreset({ row, products }: ActPresetProps) {
  const cta = previewFinalCtaFields(row)
  const product = products[0]
  const root = useRef<HTMLElement | null>(null)

  useActPresetMotion(root, row, {
    snapSelectors: ['[data-product-cta-copy]', '[data-product-cta-card]'],
    staggerSelector: '[data-product-cta-line]',
    onAnimate: (host) => {
      const card = host.querySelector('[data-product-cta-card]')
      if (!card) return
      gsap.fromTo(
        card,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: host, start: 'top 80%', toggleActions: 'play none none reverse' },
        },
      )
    },
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label="Shop call to action"
    >
      <ActMediaBackdrop row={row} />
      <Container className="anvl-act-content relative z-10 grid items-center gap-8 py-6 sm:gap-10 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div data-product-cta-copy>
          <p
            data-product-cta-line
            className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
          >
            {cta.actLabel}
          </p>
          <h2
            data-product-cta-line
            className="anvl-display text-[clamp(1.75rem,3.5vw,2.75rem)] text-[var(--color-heading)]"
          >
            {cta.heading}
          </h2>
          {cta.intro ? (
            <p data-product-cta-line className="mt-4 text-sm text-[var(--color-text-muted)]">
              {cta.intro}
            </p>
          ) : null}
          <div data-product-cta-line className="mt-8 flex flex-wrap gap-3">
            <SafeLink data-act-micro href={cta.primaryCta.href} className="anvl-btn anvl-btn-primary">
              {cta.primaryCta.label}
            </SafeLink>
            {cta.tertiaryCta.label.trim() ? (
              <SafeLink data-act-micro href={cta.tertiaryCta.href} className="anvl-btn anvl-btn-ghost">
                {cta.tertiaryCta.label}
              </SafeLink>
            ) : null}
          </div>
        </div>
        {product ? (
          <article
            data-product-cta-card
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/30 p-6 backdrop-blur-sm"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Featured piece
            </p>
            <h3 className="mt-3 text-lg font-semibold text-[var(--color-heading)]">{product.name}</h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {product.role} · {product.fabric}
            </p>
            <SafeLink
              data-act-micro
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
