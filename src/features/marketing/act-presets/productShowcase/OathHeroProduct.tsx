import { useRef } from 'react'
import { previewPiecesFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { ActPresetShell } from '../shared/ActPresetShell'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'
import { OathProductCard } from './OathProductCard'
import { pickFeaturedProducts } from './oathProductUtils'

export function OathHeroProductPreset({ landing, row, products }: ActPresetProps) {
  const rootRef = useRef<HTMLElement>(null)
  const p = previewPiecesFields(landing.pieces, row)
  const featured = pickFeaturedProducts(products, row?.productIds, 4)
  const [hero, ...rest] = featured

  useActPresetMotion(rootRef, row, {
    staggerSelector: '[data-act-block]',
    words: '[data-act-word]',
  })

  return (
    <ActPresetShell rootRef={rootRef} row={row} ariaLabel="Hero product showcase">
      <p data-act-eyebrow className="uppercase tracking-[0.28em] text-[var(--color-muted)]">
        {p.actLabel}
      </p>
      <h2 data-act-title className="mt-2 font-display uppercase text-[var(--color-fg)]">
        <span data-act-word>{p.headingLineOne}</span>{' '}
        <span data-act-word className="text-[var(--color-muted)]">
          {p.headingLineTwo}
        </span>
      </h2>
      <div className="mt-[var(--act-gap-lg)] grid gap-4 lg:grid-cols-2">
        {hero ? (
          <div data-act-block>
            <OathProductCard product={hero} featured />
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {rest.map((product) => (
            <div key={product.id} data-act-block>
              <OathProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </ActPresetShell>
  )
}
