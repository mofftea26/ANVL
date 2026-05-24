import { PiecesGrid } from '@/features/marketing/components/PiecesGrid'
import { previewPiecesFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { resolveProductShowcaseProducts } from '../resolveProductShowcaseProducts'
import type { ActPresetProps } from '../types'

/** Default product showcase — three-card editorial grid. */
export function ThreeCardEditorialPreset({ landing, row, products }: ActPresetProps) {
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
