import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Product } from '@/features/products/types/product.types'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import type { ResolvedPassportContent } from '../lib/resolvePassportContent'
import type { PassportRelated } from '../lib/relatedProducts'
import type { PassportSizeGuide } from '../lib/sizeRecommendation'
import type { PassportView } from '../schemas/passport.schema'
import { PassportConsole } from './console/PassportConsole'
import { PassportMobile } from './PassportMobile'
import { PASSPORT_CONSOLE_MQ } from '../webgl/PassportForgeGate'

export interface PassportPageProps {
  variant: 'owner' | 'public'
  /** Claim token (owner surfaces; null on public views). */
  token: string | null
  view: PassportView
  product: Product | null
  content: ResolvedPassportContent
  storyChapter: StoryChapter | null
  sizeGuide: PassportSizeGuide | null
  related: PassportRelated | null
  claimedDate: string | null
  /** Owner-only extra controls (visibility switch, transfer) in the hero. */
  actions?: ReactNode
}

/** Console tier: big screens with motion allowed get the no-scroll experience.
 *  `null` until the browser has answered — the page shows a stable splash
 *  instead of committing to the wrong layout. */
function useConsoleMode(): boolean | null {
  const [on, setOn] = useState<boolean | null>(null)
  useEffect(() => {
    const mq = window.matchMedia(PASSPORT_CONSOLE_MQ)
    const update = () => setOn(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return on
}

/**
 * The passport itself — one experience, two surfaces:
 *  - ≥1280px + motion allowed, and you own it → the no-scroll ember console
 *  - everything else (phones, tablets, reduced motion, public views) → the
 *    stacked mobile passport
 * Both drive the same PASSPORT_SECTIONS registry and the same section-nav
 * state machine, so behavior can never drift between them.
 *
 * Until the media query answers (SSR + the first client frame) we render a
 * bare atmosphere splash — committing to either layout early is what caused
 * the visible "layout settles after load" flash on desktop.
 */
export function PassportPage(props: PassportPageProps) {
  const consoleMode = useConsoleMode()

  if (consoleMode === null) {
    return <div aria-hidden="true" className="min-h-svh bg-[var(--color-bg)]" />
  }

  if (props.variant === 'owner' && consoleMode) {
    return (
      <PassportConsole
        token={props.token}
        view={props.view}
        product={props.product}
        content={props.content}
        storyChapter={props.storyChapter}
        sizeGuide={props.sizeGuide}
        related={props.related}
        claimedDate={props.claimedDate}
        actions={props.actions}
      />
    )
  }

  return <PassportMobile {...props} />
}
