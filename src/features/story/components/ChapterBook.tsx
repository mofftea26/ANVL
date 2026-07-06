import { Suspense, lazy, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import { buildBookSpreads } from '@/features/story/lib/bookSpreads'
import { isWebglAvailable } from '@/features/story/lib/webgl'
import { takeOpenOrigin } from '@/features/story/components/book3d/openOrigin'
import { resolveBookCover } from '@/features/story/components/book3d/bookConfig'
import { ChapterBookFlat } from '@/features/story/components/ChapterBookFlat'
import { BookControls } from '@/features/story/components/BookControls'

/** The WebGL book is heavy (three.js) — load it only when actually rendered. */
const ChapterBook3D = lazy(() => import('@/features/story/components/ChapterBook3D'))

/** The cinematic 3D book is tablet/desktop only — mobile gets the flat reader. */
const WIDE_QUERY = '(min-width: 768px)'

interface ChapterBookProps {
  chapter: StoryChapter
  /** Act id to open straight to (from a search deep link), instead of the cover. */
  initialAct?: string
  onClose: () => void
}

/**
 * A chapter rendered as a legendary hardcover book. On capable tablet/desktop
 * browsers it is a full three.js scene (cloth cover that swings open, parchment
 * leaves that curl per spread); on mobile, reduced-motion, or no-WebGL it falls
 * back to a lightweight flat reader (three.js never even loads there). Either
 * way: focus-trapped dialog, Escape-to-close, page controls, scroll locked.
 */
export function ChapterBook({ chapter, initialAct, onClose }: ChapterBookProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const reducedMotion = useReducedMotion()

  // Hoisted above `current` so its lazy initializer can jump straight to a
  // deep-linked act's spread instead of always starting at the cover.
  const spreads = useMemo(() => buildBookSpreads(chapter), [chapter])
  const lastIndex = spreads.length - 1

  const [current, setCurrent] = useState(() => {
    if (!initialAct) return 0
    const idx = spreads.findIndex(
      (s) => s.kind === 'spread' && s.key.startsWith(`${initialAct}-`),
    )
    return idx >= 0 ? idx : 0
  })
  const [mounted, setMounted] = useState(false)
  const [webgl, setWebgl] = useState(false)
  const [wide, setWide] = useState(false)
  const [originRect] = useState<DOMRect | null>(() => takeOpenOrigin())

  // Trap keys on `mounted` — the dialog only exists in the portal after mount,
  // so the trap must (re)engage once the panel node is really there.
  useDialogFocusTrap({ open: mounted, panelRef, onClose })

  // Client-only capability probe — drives 3D vs. flat selection.
  useEffect(() => {
    setMounted(true)
    setWebgl(isWebglAvailable())
    const mq = window.matchMedia(WIDE_QUERY)
    setWide(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setWide(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Auto-open the cover as the flight glides into its settle (~80% arrived) —
  // the pull-in and the opening read as ONE gesture: take the book, open it.
  // Skipped when a search deep link already jumped to a specific act.
  useEffect(() => {
    if (spreads.length <= 1 || initialAct) return
    const t = window.setTimeout(() => setCurrent((c) => (c === 0 ? 1 : c)), 750)
    return () => window.clearTimeout(t)
  }, [spreads.length, initialAct])

  // Arrow keys turn pages (Tab/Escape handled by the focus trap).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setCurrent((c) => Math.min(lastIndex, c + 1))
      if (e.key === 'ArrowLeft') setCurrent((c) => Math.max(0, c - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lastIndex])

  // Lock background scroll (html + body) while the book is open.
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [])

  const use3D = mounted && webgl && wide && !reducedMotion

  // Portal to <body>: the overlay must escape `main`'s stacking context so it
  // paints ABOVE the fixed top bar (no z-index inside `main` can beat a
  // sibling fixed layer). SSR renders nothing; the dialog mounts client-side.
  if (!mounted) return null

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-3 overflow-hidden bg-[color-mix(in_oklab,var(--color-bg)_88%,#000)]/95 p-3 backdrop-blur-sm sm:gap-4 sm:p-4"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 55% 45% at 50% 78%, color-mix(in srgb, var(--color-highlight) 9%, transparent) 0%, transparent 70%), radial-gradient(ellipse 120% 90% at 50% 0%, rgba(0,0,0,0.5) 0%, transparent 55%)',
      }}
    >
      <h1 id={titleId} className="sr-only">
        {chapter.title}
      </h1>
      <button
        type="button"
        onClick={onClose}
        className="focus-ring absolute right-3 top-3 z-[60] inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]/80 text-[var(--color-text)] hover:border-[var(--color-highlight)] sm:right-4 sm:top-4"
        aria-label="Close chapter"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
        {use3D ? (
          <Suspense fallback={null}>
            <ChapterBook3D
              chapter={chapter}
              spreads={spreads}
              current={current}
              originRect={originRect}
              onTurn={(dir) => setCurrent((c) => Math.max(0, Math.min(lastIndex, c + dir)))}
            />
          </Suspense>
        ) : (
          <ChapterBookFlat chapter={chapter} spreads={spreads} current={current} />
        )}
      </div>

      {/* Page-turn controls + gilded reading progress (CMS foil color) */}
      <BookControls
        spreads={spreads}
        current={current}
        foil={resolveBookCover(chapter).colors.foil}
        onPrev={() => setCurrent((c) => Math.max(0, c - 1))}
        onNext={() => setCurrent((c) => Math.min(lastIndex, c + 1))}
      />
    </div>,
    document.body,
  )
}
