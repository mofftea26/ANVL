import { Suspense, lazy, useState } from 'react'

import { Button } from '@/shared/components/ui/Button'
import type { PassportProductContent } from '@/features/cms/passportContent/passportContent.zod'
import type { PdpProductContent } from '@/features/cms/pdpContent/pdpContent.zod'
import type { SizeProductEntry } from '@/features/cms/support/supportContent.zod'

import type { ImportTarget } from './importPlan'
import type { TechpackImportResult } from './TechpackImportModal'

/**
 * The "Import from techpack" affordance, shared by every editor that can
 * receive techpack data.
 *
 * Three editors host this — the passport wizard, the PDP content editor and
 * the size-guide field — and each authors a DIFFERENT blob. `targets` is what
 * keeps that honest: an editor only ever offers fields it can actually save,
 * because a row the host will not persist is worse than no row at all (the
 * operator ticks it, sees a success toast, and the value quietly never lands).
 *
 * The modal is lazy because it pulls in the techpack document model and the
 * mappers, which no editor needs until someone reaches for a techpack.
 */
const TechpackImportModal = lazy(() =>
  import('./TechpackImportModal').then((m) => ({ default: m.TechpackImportModal })),
)

export function TechpackImportButton({
  productSlug,
  targets,
  passport,
  size,
  pdp,
  onImport,
  disabled,
  label = 'Import from techpack',
}: {
  productSlug: string
  /** The blobs the HOST can save. Never offer a field it cannot persist. */
  targets: readonly ImportTarget[]
  passport?: PassportProductContent
  size?: SizeProductEntry
  pdp?: PdpProductContent
  onImport: (result: TechpackImportResult) => void
  disabled?: boolean
  label?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled || !productSlug}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>

      <Suspense fallback={null}>
        {open ? (
          <TechpackImportModal
            open={open}
            onClose={() => setOpen(false)}
            productSlug={productSlug}
            targets={targets}
            passport={passport}
            size={size}
            pdp={pdp}
            onImport={onImport}
          />
        ) : null}
      </Suspense>
    </>
  )
}
