import { useRef } from 'react'
import { previewPiecesFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { ActPresetShell } from '../shared/ActPresetShell'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'
import { OathProductCard } from './OathProductCard'
import { pickFeaturedProducts } from './oathProductUtils'

export function OathProductRailPreset({ landing, row, products }: ActPresetProps) {
  const rootRef = useRef<HTMLElement>(null)
  const p = previewPiecesFields(landing.pieces, row)
  const featured = pickFeaturedProducts(products, row?.productIds, 4)

  useActPresetMotion(rootRef, row, {
    staggerSelector: '[data-act-block]',
  })

  return (
    <ActPresetShell rootRef={rootRef} row={row} ariaLabel="Product rail">
      <p data-act-eyebrow className="text-[length:var(--act-eyebrow-size)] uppercase tracking-[0.28em] text-[var(--color-muted)]">
        {p.actLabel}
      </p>
      <h2 data-act-title className="mt-2 font-display uppercase text-[var(--color-fg)]">
        {p.headingLineOne} {p.headingLineTwo}
      </h2>
      <div className="mt-[var(--act-gap)] grid grid-cols-2 gap-3 sm:grid-cols-4">
        {featured.map((product) => (
          <div key={product.id} data-act-block>
            <OathProductCard product={product} compact />
          </div>
        ))}
      </div>
    </ActPresetShell>
  )
}
