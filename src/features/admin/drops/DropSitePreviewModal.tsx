import { DropEditorLivePreview } from '@/features/admin/drops/DropEditorLivePreview'
import type { DropThemePalette } from '@/features/drops/theme/dropThemePalette.types'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'
import type { Product } from '@/features/products/types/product.types'
import { Modal } from '@/shared/components/ui/Modal'

export type DropSitePreviewModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  landing: LandingPageCmsContent
  products: Product[]
  palette: DropThemePalette
  emblemUrl: string
  draftActs?: LandingAct[]
}

/** Full landing page preview — acts, theme, and linked products in one modal. */
export function DropSitePreviewModal({
  open,
  onClose,
  title = 'Landing preview',
  landing,
  products,
  palette,
  emblemUrl,
  draftActs,
}: DropSitePreviewModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      className="flex max-h-[min(94vh,calc(100vh-1.5rem))] w-[min(96vw,1280px)] min-h-0 flex-col overflow-hidden"
    >
      <p className="mb-3 shrink-0 text-xs text-[var(--color-text-muted)]">
        Full campaign landing as visitors will see it — all acts, theme tokens, and roster
        products composed together.
      </p>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/40 p-3">
        <DropEditorLivePreview
          landing={landing}
          products={products}
          palette={palette}
          emblemUrl={emblemUrl}
          draftActs={draftActs}
          freezeIntroAnimations
        />
      </div>
    </Modal>
  )
}
