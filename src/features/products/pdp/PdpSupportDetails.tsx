import { Link } from '@tanstack/react-router'
import { AccordionDisclosure } from '@/shared/components/ui/AccordionDisclosure'
import { CareLines, SizeTable } from '@/features/support/components'
import type { CareProductEntry, SizeProductEntry } from '@/features/cms/support/supportContent.zod'

export type PdpProductSupport = {
  size: SizeProductEntry | null
  care: CareProductEntry | null
}

function hasCare(care: CareProductEntry | null): care is CareProductEntry {
  if (!care) return false
  return care.note.trim().length > 0 || care.lines.some((line) => line.trim().length > 0)
}

function hasSize(size: SizeProductEntry | null): size is SizeProductEntry {
  return Boolean(size && size.rows.length > 0)
}

/**
 * Surfaces THIS product's authored measurements + care (from `support_content`)
 * on the PDP as compact disclosures, right where a shopper decides size and
 * long-term care. Renders nothing when neither is authored, so the PDP is never
 * destabilised — the full guides remain one link away.
 */
export function PdpSupportDetails({ support }: { support: PdpProductSupport }) {
  const size = hasSize(support.size) ? support.size : null
  const care = hasCare(support.care) ? support.care : null
  if (!size && !care) return null

  return (
    <div className="space-y-2">
      {size ? (
        <AccordionDisclosure title="Measurements for this piece">
          <SizeTable entry={size} />
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
          <Link
            to="/care-guide"
            className="anvl-micro focus-ring mt-3 inline-block text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-highlight-bright)] hover:underline"
          >
            Full care guide
          </Link>
        </AccordionDisclosure>
      ) : null}
    </div>
  )
}
