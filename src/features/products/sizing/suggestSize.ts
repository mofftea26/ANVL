import type { Measurements } from '@/app/config/accountContracts'

export type SizeSuggestion = { size: string; basis: string; confidence: 'high' | 'medium' | 'low' }

/**
 * Rough size recommendation from a customer's saved measurements. Chest
 * circumference (cm) is the primary signal for tops; height + weight is a
 * fallback. Returns null when there isn't enough data. Buckets are intentionally
 * simple and brand-tunable — the goal is a helpful nudge, not a guarantee.
 */
export function suggestSizeFromMeasurements(m: Measurements | undefined): SizeSuggestion | null {
  if (!m) return null

  if (typeof m.chestCm === 'number' && m.chestCm > 0) {
    const c = m.chestCm
    const size =
      c < 89 ? 'XS' : c < 97 ? 'S' : c < 105 ? 'M' : c < 113 ? 'L' : c < 122 ? 'XL' : 'XXL'
    return { size, basis: 'chest measurement', confidence: 'high' }
  }

  if (typeof m.heightCm === 'number' && m.heightCm > 0 && typeof m.weightKg === 'number' && m.weightKg > 0) {
    const bmi = m.weightKg / Math.pow(m.heightCm / 100, 2)
    const size =
      bmi < 18.5 ? 'S' : bmi < 23 ? 'M' : bmi < 27 ? 'L' : bmi < 31 ? 'XL' : 'XXL'
    return { size, basis: 'height & weight', confidence: 'medium' }
  }

  if (typeof m.heightCm === 'number' && m.heightCm > 0) {
    const h = m.heightCm
    const size = h < 165 ? 'S' : h < 178 ? 'M' : h < 188 ? 'L' : 'XL'
    return { size, basis: 'height', confidence: 'low' }
  }

  return null
}

/** Only suggest a size the product actually offers; otherwise the nearest. */
export function clampSuggestionToSizes(size: string, available: string[]): string | null {
  if (available.length === 0) return null
  if (available.includes(size)) return size
  const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  const want = order.indexOf(size)
  if (want < 0) return null
  let best: string | null = null
  let bestDist = Infinity
  for (const s of available) {
    const d = Math.abs(order.indexOf(s) - want)
    if (order.indexOf(s) >= 0 && d < bestDist) {
      bestDist = d
      best = s
    }
  }
  return best
}
