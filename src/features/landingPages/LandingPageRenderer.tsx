import type { MediaIndexEntry } from '@/features/admin/media/mediaAssets.types'
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Product } from '@/features/products/types/product.types'
import type { ResolvedDropAssets } from '@/features/cms/assets/resolvePublishedAssets'
import type { LandingPageThemedMarkups } from '@/features/landingPages/types'
import { LandingEntryOverlay } from '@/features/landingPages/components/LandingEntryOverlay'
import {
  LANDING_ENTRY_CHUNK_CREEP_MAX,
  LANDING_ENTRY_OVERLAY_MAX_MS,
  preloadLandingEntryAssets,
  resolveLoadingEmblemUrl,
} from '@/features/landingPages/landingEntryLoad'
import { resolveLandingPage } from './registry'
import { useLandingEntry } from '@/features/landingPages/LandingEntryContext'
import { useLockPageScroll } from '@/shared/hooks/useLockPageScroll'
import { cn } from '@/shared/lib/cn'

interface LandingPageRendererProps {
  activeKey: string | null | undefined
  products: Product[]
  assets: ResolvedDropAssets
  loadingEmblemMarkup?: string | null
  themedMarkups?: LandingPageThemedMarkups
  landingContent?: Record<string, unknown>
  mediaIndex?: MediaIndexEntry[]
}

const EXIT_MS = 680

function LandingPageReadyGate({
  assets,
  onProgress,
  onReady,
  children,
}: {
  assets: ResolvedDropAssets
  onProgress: (progress: number) => void
  onReady: () => void
  children: ReactNode
}) {
  useEffect(() => {
    let cancelled = false

    void preloadLandingEntryAssets(assets, (progress) => {
      if (!cancelled) onProgress(progress)
    }).then(() => {
      if (!cancelled) onReady()
    })

    return () => {
      cancelled = true
    }
  }, [assets, onProgress, onReady])

  return children
}

export function LandingPageRenderer({
  activeKey,
  products,
  assets,
  loadingEmblemMarkup = null,
  themedMarkups,
  landingContent,
  mediaIndex,
}: LandingPageRendererProps) {
  const { completeHomeEntry } = useLandingEntry()
  const definition = resolveLandingPage(activeKey)
  const Page = definition.component
  const emblemSrc = resolveLoadingEmblemUrl(assets)

  const [overlayVisible, setOverlayVisible] = useState(true)
  const [exiting, setExiting] = useState(false)
  const [progress, setProgress] = useState(0)
  const chunkPendingRef = useRef(true)
  const readyRef = useRef(false)

  const handleProgress = useCallback((next: number) => {
    chunkPendingRef.current = false
    setProgress((prev) => Math.max(prev, next))
  }, [])

  const handleReady = useCallback(() => {
    if (readyRef.current) return
    readyRef.current = true
    setProgress(1)
    setExiting(true)
    window.setTimeout(() => {
      setOverlayVisible(false)
      completeHomeEntry()
    }, EXIT_MS)
  }, [completeHomeEntry])

  useLockPageScroll(overlayVisible)

  useEffect(() => {
    if (!overlayVisible || exiting) return
    const id = window.setTimeout(() => {
      handleReady()
    }, LANDING_ENTRY_OVERLAY_MAX_MS)
    return () => window.clearTimeout(id)
  }, [overlayVisible, exiting, handleReady])

  useEffect(() => {
    if (!overlayVisible || !chunkPendingRef.current) return

    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      if (!chunkPendingRef.current) return
      const t = Math.min(1, (now - start) / 1400)
      setProgress((prev) =>
        Math.max(prev, t * LANDING_ENTRY_CHUNK_CREEP_MAX),
      )
      if (t < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [overlayVisible])

  return (
    <>
      {overlayVisible ? (
        <LandingEntryOverlay
          emblemSrc={emblemSrc}
          emblemMarkup={loadingEmblemMarkup}
          progress={progress}
          exiting={exiting}
        />
      ) : null}

      <div
        className={cn(
          overlayVisible &&
            'fixed inset-0 overflow-hidden overscroll-none opacity-0 pointer-events-none',
        )}
        aria-hidden={overlayVisible}
      >
        <Suspense fallback={null}>
          <LandingPageReadyGate
            assets={assets}
            onProgress={handleProgress}
            onReady={handleReady}
          >
            <Page
              products={products}
              assets={assets}
              themedMarkups={themedMarkups}
              landingContent={landingContent}
              mediaIndex={mediaIndex}
            />
          </LandingPageReadyGate>
        </Suspense>
      </div>
    </>
  )
}
