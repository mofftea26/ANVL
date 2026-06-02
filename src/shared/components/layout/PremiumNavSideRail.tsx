import type { CinematicHeroSection } from '@/features/marketing/cinematic-hero/cinematicHero.types'
import { cn } from '@/shared/lib/cn'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'

export function PremiumNavSideRail({
  sections,
  activeSectionId,
}: {
  sections: CinematicHeroSection[]
  activeSectionId: string | null
}) {
  const enabled = sections.filter((s) => s.isEnabled)
  if (enabled.length === 0) return null

  const activeIndex = Math.max(
    0,
    enabled.findIndex((s) => s.id === activeSectionId),
  )
  const progress =
    enabled.length <= 1 ? 100 : (activeIndex / (enabled.length - 1)) * 100

  return (
    <aside
      className="pointer-events-none fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 md:block lg:left-6"
      aria-label="Cinematic scroll progress"
      data-premium-side-rail
    >
      <div className="flex items-stretch gap-3">
        <div
          className="relative w-px shrink-0 bg-[var(--color-line)]/40"
          aria-hidden="true"
        >
          <div
            className="absolute left-0 top-0 w-full origin-top bg-[var(--color-accent)] transition-[height] duration-300 ease-out motion-reduce:transition-none"
            style={{ height: `${progress}%` }}
          />
        </div>
        <ol className="flex flex-col gap-3">
          {enabled.map((section, index) => {
            const isActive =
              section.id === activeSectionId ||
              (activeSectionId == null && index === 0)
            const label =
              stripAngleBracketTags(section.eyebrow ?? section.title ?? '') ||
              `Section ${index + 1}`

            return (
              <li
                key={section.id}
                className={cn(
                  'flex items-center gap-2 transition-opacity duration-300 motion-reduce:transition-none',
                  isActive ? 'opacity-100' : 'opacity-40',
                )}
              >
                <span
                  className={cn(
                    'block shrink-0 rounded-full border transition-all duration-300 motion-reduce:transition-none',
                    isActive
                      ? 'h-2.5 w-2.5 border-[var(--color-accent)] bg-[var(--color-accent)]'
                      : 'h-1.5 w-1.5 border-[var(--color-heading)]/50 bg-transparent',
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'anvl-micro max-w-[8rem] truncate text-[9px] uppercase tracking-[0.2em]',
                    isActive
                      ? 'text-[var(--color-heading)]'
                      : 'text-[var(--color-heading)]/50',
                  )}
                >
                  {label}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </aside>
  )
}
