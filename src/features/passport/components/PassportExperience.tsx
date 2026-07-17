import { useMemo, useState } from 'react'
import type { Product } from '@/features/products/types/product.types'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import type { ResolvedPassportContent } from '../lib/resolvePassportContent'
import type { PassportSizeGuide } from '../lib/sizeRecommendation'
import {
  useHydrateStorefrontAccountSession,
  useStorefrontAccountSession,
} from '@/features/storefront-account/publicAccount.core'
import { usePassportQuery } from '../hooks/usePassport'
import { resolvePassportStage } from '../lib/passportStage'
import type { PassportRelated } from '../lib/relatedProducts'
import type { PassportView } from '../schemas/passport.schema'
import { ClaimCeremony } from './ClaimCeremony'
import { PassportNotFound } from './PassportNotFound'
import { PassportOnboarding } from './PassportOnboarding'
import { PassportPage } from './PassportPage'
import { PassportTeaser } from './PassportTeaser'
import { PassportTransferAccept, PassportTransferAction } from './PassportTransfer'
import { PassportVisibilityToggle } from './PassportVisibilityToggle'

export interface PassportExperienceProps {
  token: string
  view: PassportView | null
  product: Product | null
  content: ResolvedPassportContent
  /** The product's saga chapter, embedded in the passport (null = none). */
  storyChapter: StoryChapter | null
  /** Cross-product size map (loader-built, user-independent). */
  sizeGuide: PassportSizeGuide | null
  /** Candidate related pieces (loader-built; owner filters client-side). */
  related: PassportRelated | null
  /** One-time transfer code from the share link (?transfer=). */
  transferCode?: string
}

/**
 * The /p/$token state machine. The loader supplies the anon projection; this
 * component re-resolves it with the browser session (owner detection) and
 * walks: not_found → teaser (signed out) → onboarding (signed in, unclaimed)
 * → claim ceremony → owner passport; the public authenticity view when the
 * piece belongs to someone else; and the transfer accept flow when a live
 * transfer code rides along in the URL.
 */
export function PassportExperience({
  token,
  view: loaderView,
  product,
  content,
  storyChapter,
  sizeGuide,
  related,
  transferCode,
}: PassportExperienceProps) {
  useHydrateStorefrontAccountSession()
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  const passportQuery = usePassportQuery(token, loaderView, transferCode)
  const [ceremony, setCeremony] = useState<'idle' | 'playing' | 'done'>('idle')
  // The claim/accept RPCs return the owner projection immediately; hold it so
  // the ceremony/owner view renders without waiting for query invalidation.
  const [claimedView, setClaimedView] = useState<PassportView | null>(null)

  // Freshest wins: just-claimed override → session-aware query → loader anon view.
  const view = claimedView ?? passportQuery.data ?? loaderView

  const claimedDate = useMemo(() => {
    if (!view?.claimedAt) return null
    const d = new Date(view.claimedAt)
    return Number.isNaN(d.getTime())
      ? null
      : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }, [view?.claimedAt])

  const onForged = (claimed: PassportView) => {
    setClaimedView(claimed)
    setCeremony('playing')
  }

  if (!view) {
    // Loader found nothing; if a client refetch is still in flight, hold a beat.
    return passportQuery.isLoading ? <PassportLoading /> : <PassportNotFound />
  }

  // Signed in but still resolving the owner-aware projection: hold the splash
  // instead of flashing the anon layout (teaser/public) and then swapping.
  if (customerId && !claimedView && passportQuery.isLoading) {
    return <PassportLoading />
  }

  const stage = resolvePassportStage(view, customerId)

  switch (stage) {
    case 'not_found':
      return <PassportNotFound />

    case 'owner':
      return (
        <>
          {ceremony === 'playing' ? (
            <ClaimCeremony
              productName={view.productName}
              imageUrl={
                content.piece.heroRenderUrl ??
                (view.claimedColor
                  ? product?.shop?.imagesByColorName?.[view.claimedColor]?.[0]?.src
                  : undefined) ??
                content.piece.gallery[0]?.src ??
                null
              }
              ownerName={view.claimedDisplayName ?? ''}
              onComplete={() => setCeremony('done')}
            />
          ) : null}
          <PassportPage
            variant="owner"
            view={view}
            product={product}
            content={content}
            storyChapter={storyChapter}
            sizeGuide={sizeGuide}
            related={related}
            claimedDate={claimedDate}
            actions={
              <div className="flex flex-wrap items-center justify-center gap-3">
                <PassportVisibilityToggle token={token} view={view} />
                <PassportTransferAction token={token} view={view} />
              </div>
            }
          />
        </>
      )

    case 'public':
      return (
        <PassportPage
          variant="public"
          view={view}
          product={product}
          content={content}
          storyChapter={storyChapter}
          sizeGuide={sizeGuide}
          related={related}
          claimedDate={claimedDate}
        />
      )

    case 'teaser':
      return <PassportTeaser token={token} view={view} product={product} />

    case 'transfer_teaser':
      return (
        <PassportTeaser
          token={token}
          view={view}
          product={product}
          transferCode={transferCode}
        />
      )

    case 'transfer_offer':
      return (
        <PassportTransferAccept
          token={token}
          code={transferCode ?? ''}
          view={view}
          product={product}
          onAccepted={onForged}
        />
      )

    case 'onboarding':
      // Session hydration is synchronous-ish (layout effect + GoTrue reconcile);
      // the claim RPC remains the real gate if the session turns out stale.
      return (
        <PassportOnboarding
          token={token}
          view={view}
          product={product}
          onClaimed={onForged}
        />
      )
  }
}

function PassportLoading() {
  return (
    <div className="flex min-h-[70svh] items-center justify-center bg-[var(--color-bg)]">
      <p className="anvl-micro animate-pulse text-[var(--color-text-muted)]">
        Reading the mark…
      </p>
    </div>
  )
}
