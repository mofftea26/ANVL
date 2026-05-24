import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { previewPiecesFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { PiecesGrid } from '@/features/marketing/components/PiecesGrid'
import { Container } from '@/shared/components/ui/Container'
import { gsap } from '@/shared/lib/gsap'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import { resolveProductShowcaseProducts } from '../resolveProductShowcaseProducts'
import type { ActPresetProps } from '../types'

/** Single featured product story layout. */
export function ProductStoryPreset(props: ActPresetProps) {
  const { landing, row, products } = props
  const p = previewPiecesFields(landing.pieces, row)
  const showcaseProducts = resolveProductShowcaseProducts(products, row?.productIds)
  const featured = showcaseProducts[0]
  const root = useRef<HTMLElement | null>(null)

  useActScrollReveal(root, {
    snapSelectors: ['[data-story-copy]', '[data-story-visual]'],
    onAnimate: (host) => {
      const copy = host.querySelector('[data-story-copy]')
      const visual = host.querySelector('[data-story-visual]')
      gsap.set(copy, { opacity: 0, x: -32 })
      gsap.set(visual, { opacity: 0, x: 32 })
      gsap
        .timeline({
          scrollTrigger: { trigger: host, start: 'top 78%', toggleActions: 'play none none reverse' },
        })
        .to(copy, { opacity: 1, x: 0, duration: 0.85, ease: 'power3.out' }, 0)
        .to(visual, { opacity: 1, x: 0, duration: 0.85, ease: 'power3.out' }, 0.1)
    },
  })

  if (!featured) {
    const p = previewPiecesFields(landing.pieces, row)
    const showcaseProducts = resolveProductShowcaseProducts(products, row?.productIds)
    return (
      <PiecesGrid
        products={showcaseProducts}
        actLabel={p.actLabel}
        headingLineOne={p.headingLineOne}
        headingLineTwo={p.headingLineTwo}
        viewAllLabel={p.viewAllLabel}
        viewAllHref={p.viewAllHref}
        footerLeftText={p.footerLeftText}
        footerLinkLabel={p.footerLinkLabel}
        footerLinkHref={p.footerLinkHref}
      />
    )
  }

  return (
    <section
      ref={root}
      className="border-b border-[var(--color-line)] bg-[var(--color-bg)] py-16 md:py-24"
      aria-label="Featured product"
    >
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <div data-story-copy>
          <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {p.actLabel}
          </p>
          <h2 className="anvl-display text-[clamp(2rem,4vw,3rem)] leading-tight">
            {featured.name}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {featured.storytelling || p.footerLeftText}
          </p>
          <Link
            to="/shop/$slug"
            params={{ slug: featured.slug }}
            className="anvl-btn anvl-btn-primary mt-8 inline-flex"
          >
            {p.viewAllLabel}
          </Link>
        </div>
        <Link
          to="/shop/$slug"
          params={{ slug: featured.slug }}
          data-story-visual
          className="block overflow-hidden rounded-lg border border-[var(--color-line)]"
        >
          {featured.images[0]?.src ? (
            <img
              src={featured.images[0].src}
              alt={featured.name}
              width={640}
              height={800}
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full object-cover"
            />
          ) : (
            <div className="aspect-[4/5] bg-[var(--color-surface-soft)]" />
          )}
        </Link>
      </Container>
    </section>
  )
}
