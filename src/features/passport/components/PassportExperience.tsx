import { useMemo, useState } from 'react'
import type { Product } from '@/features/products/types/product.types'
import type { ResolvedPdpContent } from '@/features/products/pdp/resolvePdpContent'
import {
  useHydrateStorefrontAccountSession,
  useStorefrontAccountSession,
} from '@/features/storefront-account/publicAccount.core'
import { usePassportQuery } from '../hooks/usePassport'
import { resolvePassportStage } from '../lib/passportStage'
import type { PassportView } from '../schemas/passport.schema'
import { ClaimCeremony } from './ClaimCeremony'
import { PassportNotFound } from './PassportNotFound'
import { PassportOnboarding } from './PassportOnboarding'
import { PassportPage } from './PassportPage'
import { PassportTeaser } from './PassportTeaser'

export interface PassportExperienceProps {
  token: string
  view: PassportView | null
  product: Product | null
  content: ResolvedPdpContent | null
  hasStoryBook: boolean
}

/**
 * The /p/$token state machine. The loader supplies the anon projection; this
 * component re-resolves it with the browser session (owner detection) and
 * walks: not_found → teaser (signed out) → onboarding (signed in, unclaimed)
 * → claim ceremony → owner passport, or the public authenticity view when the
 * piece belongs to someone else.
 */
export function PassportExperience({
  token,
  view: loaderView,
  product,
  content,
  hasStoryBook,
}: PassportExperienceProps) {
  useHydrateStorefrontAccountSession()
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  const passportQuery = usePassportQuery(token, loaderView)
  const [ceremony, setCeremony] = useState<'idle' | 'playing' | 'done'>('idle')
  // The claim RPC returns the owner projection immediately; hold it so the
  // ceremony/owner view renders without waiting for the query invalidation.
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

  if (!view) {
    // Loader found nothing; if a client refetch is still in flight, hold a beat.
    return passportQuery.isLoading ? <PassportLoading /> : <PassportNotFound />
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
              serialNumber={view.serialNumber}
              editionTotal={view.editionTotal}
              ownerName={view.claimedDisplayName ?? ''}
              claimedDate={claimedDate ?? ''}
              onComplete={() => setCeremony('done')}
            />
          ) : null}
          <PassportPage
            variant="owner"
            view={view}
            product={product}
            content={content}
            hasStoryBook={hasStoryBook}
            claimedDate={claimedDate}
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
          hasStoryBook={hasStoryBook}
          claimedDate={claimedDate}
        />
      )

    case 'teaser':
      return <PassportTeaser token={token} view={view} product={product} />

    case 'onboarding':
      // Session hydration is synchronous-ish (layout effect + GoTrue reconcile);
      // the claim RPC remains the real gate if the session turns out stale.
      return (
        <PassportOnboarding
          token={token}
          view={view}
          product={product}
          onClaimed={(claimed) => {
            setClaimedView(claimed)
            setCeremony('playing')
          }}
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
