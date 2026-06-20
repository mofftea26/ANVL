import { ThemeTintedMediaMark } from '@/shared/components/ui/ThemeTintedMediaMark'
import { cn } from '@/shared/lib/cn'

type LandingEntryOverlayProps = {
  emblemSrc: string
  emblemMarkup?: string | null
  progress: number
  exiting: boolean
  label?: string
}

export function LandingEntryOverlay({
  emblemSrc,
  emblemMarkup,
  progress,
  exiting,
  label = 'Drop 01 — The Oath',
}: LandingEntryOverlayProps) {
  const pct = Math.max(0, Math.min(100, Math.round(progress * 100)))

  return (
    <div
      aria-busy={!exiting}
      aria-live="polite"
      className={cn(
        'fixed inset-0 z-[70] flex touch-none flex-col items-center justify-center overflow-hidden overscroll-none bg-[var(--color-bg)]',
        exiting ? 'anvl-entry-overlay-exit pointer-events-none' : 'pointer-events-auto',
      )}
    >
      <span className="sr-only">
        {exiting ? 'Experience loaded' : `Loading experience — ${pct}%`}
      </span>

      <div className="anvl-entry-overlay-rise flex flex-col items-center">
        <div className="anvl-emblem-pulse">
          <ThemeTintedMediaMark
            src={emblemSrc}
            themedSvgMarkup={emblemMarkup}
            width={208}
            height={208}
            className="h-44 w-44 sm:h-52 sm:w-52"
            tint="var(--color-heading)"
            glow="var(--color-highlight)"
          />
        </div>
        <p className="mt-8 text-xs uppercase tracking-[0.16em] text-[var(--color-accent)] sm:text-sm">
          {label}
        </p>
      </div>

      <div
        aria-hidden="true"
        className="absolute bottom-[16%] h-0.5 w-52 overflow-hidden rounded-full bg-[var(--color-line)] sm:bottom-[18%] sm:w-64"
      >
        <div
          className="h-full origin-left rounded-full bg-[var(--color-accent)] transition-[width] duration-200 ease-out will-change-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
