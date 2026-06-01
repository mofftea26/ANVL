import { useRef } from 'react'
import { previewPiecesFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { ActPresetShell } from '../shared/ActPresetShell'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import { useActIdleMotion } from '../shared/useActIdleMotion'
import type { ActPresetProps } from '../types'
import { OathProductCard } from './OathProductCard'
import { pickFeaturedProducts } from './oathProductUtils'

export function OathEditorialThreePreset({ landing, row, products }: ActPresetProps) {
  const rootRef = useRef<HTMLElement>(null)
  const p = previewPiecesFields(landing.pieces, row)
  const featured = pickFeaturedProducts(products, row?.productIds, 3)

  useActPresetMotion(rootRef, row, {
    staggerSelector: '[data-act-block]',
  })
  useActIdleMotion(rootRef, row, { floatSelector: '[data-act-eyebrow]' })

  return (
    <ActPresetShell rootRef={rootRef} row={row} ariaLabel="Product showcase">
      <p data-act-eyebrow data-act-float className="text-[length:var(--act-eyebrow-size)] uppercase tracking-[0.28em] text-[var(--color-muted)]">
        {p.actLabel}
      </p>
      <h2 data-act-title className="mt-2 max-w-3xl font-display uppercase leading-[0.95] text-[var(--color-fg)]">
        {p.headingLineOne}
        <br />
        <span className="text-[var(--color-muted)]">{p.headingLineTwo}</span>
      </h2>
      <div className="mt-[var(--act-gap-lg)] grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((product, i) => (
          <OathProductCard key={product.id} product={product} featured={i === 0} />
        ))}
      </div>
      {p.viewAllHref ? (
        <a
          data-act-micro
          href={p.viewAllHref}
          className="mt-6 inline-flex text-sm uppercase tracking-[0.2em] text-[var(--color-accent)]"
        >
          {p.viewAllLabel}
        </a>
      ) : null}
    </ActPresetShell>
  )
}
