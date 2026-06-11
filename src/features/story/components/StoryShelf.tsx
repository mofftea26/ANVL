import { Suspense, lazy, useEffect, useState } from 'react'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import { isWebglAvailable } from '@/features/story/lib/webgl'
import { ChapterShelf } from '@/features/story/components/ChapterShelf'

/** WebGL shelf (three.js) — loaded only on capable clients, never in the entry. */
const StoryShelf3D = lazy(() => import('@/features/story/components/StoryShelf3D'))

/** Live 3D covers are tablet/desktop only — mobile gets the lean CSS shelf. */
const WIDE_QUERY = '(min-width: 768px)'

interface StoryShelfProps {
  chapters: StoryChapter[]
  onOpen: (slug: string) => void
}

/**
 * Picks the shelf renderer: live 3D book covers on capable tablet/desktop
 * clients, the accessible CSS shelf on the server, mobile, reduced-motion, or
 * no-WebGL. The CSS shelf is also the Suspense fallback, so it is never blank.
 */
export function StoryShelf({ chapters, onOpen }: StoryShelfProps) {
  const reducedMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const [webgl, setWebgl] = useState(false)
  const [wide, setWide] = useState(false)

  useEffect(() => {
    setMounted(true)
    setWebgl(isWebglAvailable())
    const mq = window.matchMedia(WIDE_QUERY)
    setWide(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setWide(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const fallback = <ChapterShelf chapters={chapters} onOpen={onOpen} />

  if (!mounted || !webgl || !wide || reducedMotion) return fallback

  return (
    <Suspense fallback={fallback}>
      <StoryShelf3D chapters={chapters} onOpen={onOpen} />
    </Suspense>
  )
}
