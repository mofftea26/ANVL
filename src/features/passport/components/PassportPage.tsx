import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Product } from '@/features/products/types/product.types'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import type { ResolvedPassportContent } from '../lib/resolvePassportContent'
import type { PassportSizeGuide } from '../lib/sizeRecommendation'
import type { PassportView } from '../schemas/passport.schema'
import { PassportConsole } from './console/PassportConsole'
import { PassportMobile } from './PassportMobile'
import { PASSPORT_CONSOLE_MQ } from '../webgl/PassportForgeGate'

export interface PassportPageProps {
  variant: 'owner' | 'public'
  view: PassportView
  product: Product | null
  content: ResolvedPassportContent
  storyChapter: StoryChapter | null
  sizeGuide: PassportSizeGuide | null
  claimedDate: string | null
  /** Owner-only extra controls (visibility switch, transfer) in the hero. */
  actions?: ReactNode
}

/** Console tier: big screens with motion allowed get the no-scroll experience. */
function useConsoleMode(): boolean {
  const [on, setOn] = useState(false)
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
 */
export function PassportPage(props: PassportPageProps) {
  const consoleMode = useConsoleMode()

  if (props.variant === 'owner' && consoleMode) {
    return (
      <PassportConsole
        view={props.view}
        product={props.product}
        content={props.content}
        storyChapter={props.storyChapter}
        sizeGuide={props.sizeGuide}
        claimedDate={props.claimedDate}
        actions={props.actions}
      />
    )
  }

  return <PassportMobile {...props} />
}
