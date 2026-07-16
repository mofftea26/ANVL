import type { Product } from '@/features/products/types/product.types'
import { getPassportCountry } from './passportCountries'
import type { ResolvedPassportContent } from './resolvePassportContent'
import type { PassportView } from '../schemas/passport.schema'

/**
 * The verification lines that tick in during the registration ceremony.
 *
 * Every line is a TRUE statement pulled from the record that was just written
 * — the piece, its material, where it was made, its drop, the registration
 * date. Nothing is invented and nothing implies a check that didn't happen:
 * a line with no real value is simply omitted.
 */
export interface CeremonyLine {
  label: string
  value: string
}

export function buildCeremonyLines(input: {
  view: PassportView
  product: Product | null
  content: ResolvedPassportContent
  claimedDate: string | null
}): CeremonyLine[] {
  const { view, product, content, claimedDate } = input
  const lines: CeremonyLine[] = []

  const push = (label: string, value: string | null | undefined) => {
    const trimmed = value?.trim()
    if (trimmed) lines.push({ label, value: trimmed })
  }

  push('Piece', view.productName)
  push('Drop', product?.dropName)
  push('Material', content.material.title || product?.fabric)
  push('Origin', getPassportCountry(content.origin.madeIn)?.label)
  push('Colorway', view.claimedColor)
  push('Size', view.claimedSize)
  push('Registered', claimedDate)

  return lines
}
