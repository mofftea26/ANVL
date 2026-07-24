import { useMemo } from 'react'
import type { MediaIndexEntry } from '@/features/cms/media/mediaIndex.types'
import type { PassportContentConfig } from '@/features/cms/passportContent/passportContent.zod'
import { usePreviewDraft } from '@/features/cms/preview'
import type { ResolvedPdpContent } from '@/features/products/pdp/resolvePdpContent'
import type { Product } from '@/features/products/types/product.types'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import type { ResolvedPassportContent } from '../lib/resolvePassportContent'
import { resolvePassportContent } from '../lib/resolvePassportContent'
import type { PassportRelated } from '../lib/relatedProducts'
import type { PassportSizeGuide } from '../lib/sizeRecommendation'
import type { PassportView } from '../schemas/passport.schema'
import { PassportPage } from './PassportPage'

export interface PassportPreviewData {
  productSlug: string
  forcedVariant: 'owner' | 'public'
  /** Re-resolution inputs so unsaved draft content applies client-side. */
  mediaIndex: MediaIndexEntry[]
  pdpResolved: ResolvedPdpContent | null
  savedPassportContent: PassportContentConfig
}

/**
 * Admin-preview-only passport host (`/p/__preview__`). Renders a representative
 * passport for a product in the forced guest/owner surface, and — when the
 * admin pushes an unsaved `passportContent` draft over the preview bridge —
 * re-resolves the section content client-side so the editor sees its edits live
 * before saving. Never reached by real visitors (synthetic sentinel token).
 */
export function PassportPreviewHost({
  view,
  product,
  content: loaderContent,
  storyChapter,
  sizeGuide,
  related,
  claimedDate,
  preview,
}: {
  view: PassportView
  product: Product | null
  content: ResolvedPassportContent
  storyChapter: StoryChapter | null
  sizeGuide: PassportSizeGuide | null
  related: PassportRelated | null
  claimedDate: string | null
  preview: PassportPreviewData
}) {
  const draft = usePreviewDraft()
  const draftPassport = draft?.passportContent

  const content = useMemo(() => {
    if (!draftPassport) return loaderContent
    return resolvePassportContent({
      product,
      passportContent: draftPassport,
      pdpContent: preview.pdpResolved,
      mediaIndex: preview.mediaIndex,
      productSlug: preview.productSlug,
    })
  }, [draftPassport, loaderContent, product, preview])

  if (!product) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--color-bg)] px-6 text-center">
        <p className="max-w-sm text-sm text-[var(--color-text-muted)]">
          No product to preview yet. Add a product to the catalog, then reopen the passport
          preview.
        </p>
      </div>
    )
  }

  return (
    <PassportPage
      variant={preview.forcedVariant}
      token={null}
      view={view}
      product={product}
      content={content}
      storyChapter={storyChapter}
      sizeGuide={sizeGuide}
      related={related}
      claimedDate={claimedDate}
    />
  )
}
