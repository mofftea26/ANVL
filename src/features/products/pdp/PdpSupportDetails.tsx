import { Link } from '@tanstack/react-router'
import { AccordionDisclosure } from '@/shared/components/ui/AccordionDisclosure'
import {
  CareLines,
  CARE_ICON_COMPONENTS,
  CARE_SYMBOLS_SECTION_ID,
  SizeDiagram,
  SizeTable,
} from '@/features/support/components'
import {
  resolveCareItems,
  resolveSizeTable,
  type ResolvedCareLegend,
  type ResolvedSizeMeasure,
} from '@/features/cms/support/resolveSupportContent'
import type { CareProductEntry, SizeProductEntry } from '@/features/cms/support/supportContent.zod'

export type PdpProductSupport = {
  size: SizeProductEntry | null
  care: CareProductEntry | null
  /** Schematic + lettered points for THIS product's garment type. */
  measure: ResolvedSizeMeasure
  /** Standard care-mark copy, for the compact legend under the care lines. */
  careLegend: ResolvedCareLegend
}

function hasCare(care: CareProductEntry | null): care is CareProductEntry {
  if (!care) return false
  return care.note.trim().length > 0 || resolveCareItems(care).length > 0
}

function hasSize(size: SizeProductEntry | null): size is SizeProductEntry {
  return Boolean(size && resolveSizeTable(size) !== null)
}

/**
 * The standard marks this product's care instructions actually use, in the
 * order they appear, de-duplicated. Icons outside the standard legend (the
 * `generic` fallback that legacy free-text lines resolve to) carry no agreed
 * meaning, so they are left out rather than labelled with a guess.
 */
function resolveCareSymbols(care: CareProductEntry, legend: ResolvedCareLegend) {
  const seen = new Set<string>()
  return resolveCareItems(care).flatMap((item) => {
    if (seen.has(item.icon)) return []
    seen.add(item.icon)
    const entry = legend.entries[item.icon]
    return entry ? [{ key: item.icon, label: entry.label }] : []
  })
}

/**
 * Surfaces THIS product's authored measurements + care (from `support_content`)
 * on the PDP as compact disclosures, right where a shopper decides size and
 * long-term care. Structured care items / the fixed measurement table win over
 * the legacy shapes automatically (resolution happens in `cms/support`).
 * Renders nothing when neither is authored, so the PDP is never destabilised —
 * the full guides remain one link away.
 */
export function PdpSupportDetails({ support }: { support: PdpProductSupport }) {
  const size = hasSize(support.size) ? support.size : null
  const care = hasCare(support.care) ? support.care : null
  if (!size && !care) return null

  const careSymbols = care ? resolveCareSymbols(care, support.careLegend) : []

  return (
    <div className="space-y-2">
      {size ? (
        <AccordionDisclosure title="Measurements for this piece">
          <SizeTable entry={size} />
          <div className="mt-4 grid items-start gap-4 sm:grid-cols-[minmax(0,14rem)_1fr]">
            <SizeDiagram
              garmentTypeKey={support.measure.garmentTypeKey}
              points={support.measure.points}
              className="max-w-[14rem]"
            />
            {/* Textual companion — the diagram is never the only source. */}
            <ul className="space-y-1.5">
              {support.measure.points.map((point) => (
                <li key={point.key} className="text-xs text-[var(--color-text-muted)]">
                  <span className="font-medium text-[var(--color-text)]">
                    {point.letter} · {point.label}
                  </span>{' '}
                  — {point.description}
                </li>
              ))}
            </ul>
          </div>
          <Link
            to="/size-guide"
            className="anvl-micro focus-ring mt-3 inline-block text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-highlight-bright)] hover:underline"
          >
            Full size guide
          </Link>
        </AccordionDisclosure>
      ) : null}
      {care ? (
        <AccordionDisclosure title="Care for this piece">
          <CareLines entry={care} />
          {careSymbols.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--color-line)] pt-3">
              {careSymbols.map((symbol) => {
                const Glyph = CARE_ICON_COMPONENTS[symbol.key]
                return (
                  <li
                    key={symbol.key}
                    className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]"
                  >
                    <Glyph size={18} aria-hidden="true" />
                    <span>{symbol.label}</span>
                  </li>
                )
              })}
            </ul>
          ) : null}
          <Link
            to="/care-guide"
            hash={careSymbols.length > 0 ? CARE_SYMBOLS_SECTION_ID : undefined}
            className="anvl-micro focus-ring mt-3 inline-block text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-highlight-bright)] hover:underline"
          >
            Full care guide
          </Link>
        </AccordionDisclosure>
      ) : null}
    </div>
  )
}
