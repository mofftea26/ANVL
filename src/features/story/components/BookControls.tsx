import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { spreadLabel, type BookSpread } from '@/features/story/lib/bookSpreads'

interface BookControlsProps {
  spreads: BookSpread[]
  current: number
  /** CMS foil color of the chapter — the progress gilds to match the stamping. */
  foil: string
  onPrev: () => void
  onNext: () => void
}

const NAV_BUTTON =
  'focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text)] transition-[border-color,transform] duration-200 enabled:hover:border-[var(--color-highlight)] enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 disabled:opacity-35'

/**
 * Reader chrome under the book: a gilded reading-progress thread plus the
 * page controls, with micro-animations on every landing (the thread eases to
 * the new position, the spread label inks in). Shared by the 3D book and the
 * mobile flat reader — colors flow from the chapter's CMS palette.
 */
export function BookControls({ spreads, current, foil, onPrev, onNext }: BookControlsProps) {
  const scope = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const lastIndex = spreads.length - 1
  const progress = lastIndex > 0 ? current / lastIndex : 0
  const canPrev = current > 0
  const canNext = current < lastIndex

  useGSAP(
    () => {
      if (reduced) {
        gsap.set('[data-progress]', { scaleX: progress })
        return
      }
      gsap.to('[data-progress]', { scaleX: progress, duration: 0.7, ease: 'power3.out' })
      gsap.fromTo(
        '[data-label]',
        { opacity: 0, y: 7, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power2.out' },
      )
    },
    { scope, dependencies: [current, progress, reduced] },
  )

  return (
    <div
      ref={scope}
      className="z-[60] flex flex-col items-center gap-2.5 pb-[max(env(safe-area-inset-bottom),0px)]"
    >
      <div className="relative h-px w-44 overflow-hidden rounded-full bg-[var(--color-line)] sm:w-64">
        <span
          data-progress
          aria-hidden="true"
          className="absolute inset-0 origin-left"
          style={{
            background: `linear-gradient(90deg, ${foil}, #fff3d6)`,
            transform: 'scaleX(0)',
          }}
        />
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          className={NAV_BUTTON}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <p
          className="min-w-[9rem] overflow-hidden text-center text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)] sm:min-w-[12rem]"
          aria-live="polite"
        >
          <span data-label key={current} className="block">
            {spreadLabel(spreads[current])}
          </span>
        </p>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className={NAV_BUTTON}
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
