import { useEffect, useState } from 'react'
import { Sparkles } from '@/shared/icons'
import type { Measurements } from '@/app/config/accountContracts'
import { useStorefrontAccountSession } from '@/features/storefront-account/publicAccount.core'
import {
  clampSuggestionToSizes,
  suggestSizeFromMeasurements,
} from '@/features/products/sizing/suggestSize'
import { ICON_SIZE } from '@/shared/lib/iconSize'

/**
 * "Your size" nudge on the PDP, computed from the signed-in customer's saved
 * measurements (Account → Personal). Hidden when signed out or when there isn't
 * enough data. Clamps to sizes the product actually offers; one tap selects it.
 */
export function PdpSizeSuggestion({
  sizes,
  currentSize,
  onSelect,
}: {
  sizes: string[]
  currentSize: string
  onSelect: (size: string) => void
}) {
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  const [measurements, setMeasurements] = useState<Measurements | null>(null)

  useEffect(() => {
    if (!customerId) {
      setMeasurements(null)
      return
    }
    let active = true
    void (async () => {
      try {
        const { runtimeClients } = await import('@/app/config/runtime')
        const c = await runtimeClients.account.getCustomerProfile()
        if (active) setMeasurements(c.measurements ?? {})
      } catch {
        /* signed out or unavailable — no nudge */
      }
    })()
    return () => {
      active = false
    }
  }, [customerId])

  const suggestion = suggestSizeFromMeasurements(measurements ?? undefined)
  if (!suggestion) return null
  const size = clampSuggestionToSizes(suggestion.size, sizes)
  if (!size) return null

  const isCurrent = size === currentSize

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[color-mix(in_oklab,var(--shop-accent)_35%,var(--shop-card-border))] bg-[color-mix(in_oklab,var(--shop-accent)_8%,transparent)] px-3 py-2">
      <Sparkles size={ICON_SIZE.sm} aria-hidden="true" className="text-[var(--shop-accent)]" />
      <p className="text-xs text-[var(--shop-text)]">
        Based on your measurements, we suggest{' '}
        <span className="font-semibold text-[var(--shop-text)]">{size}</span>
        <span className="text-[var(--shop-text-muted)]"> ({suggestion.basis})</span>
      </p>
      {!isCurrent ? (
        <button
          type="button"
          onClick={() => onSelect(size)}
          className="anvl-micro focus-ring ml-auto rounded-full border border-[var(--shop-accent)] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--shop-accent)] transition-colors hover:bg-[var(--shop-accent)] hover:text-[var(--shop-bg)]"
        >
          Select {size}
        </button>
      ) : (
        <span className="anvl-micro ml-auto text-[10px] uppercase tracking-[0.14em] text-[var(--shop-text-muted)]">Selected</span>
      )}
    </div>
  )
}
