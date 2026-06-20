import { Crown, Shield, Star, Swords, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { StoryCastMember } from '@/features/story/schemas/story.schema'
import { resolveStoryAsset } from '@/features/story/lib/resolveStoryAsset'

/** Icon per known rank — color is never the sole signal (a11y). */
const RANK_ICON: Record<string, LucideIcon> = {
  General: Crown,
  Captain: Swords,
  Veteran: Shield,
  Recruit: Star,
}

function rankIcon(rank: string): LucideIcon {
  return RANK_ICON[rank] ?? Star
}

interface CastRosterProps {
  cast: StoryCastMember[]
  title?: string
  className?: string
}

/**
 * The "war roster" — CMS-authored characters (generals, recruits, loyal
 * members) shown for a chapter or act. Rank is labelled with text + an icon.
 */
export function CastRoster({ cast, title = 'The Roster', className }: CastRosterProps) {
  if (cast.length === 0) return null

  return (
    <section className={cn('mt-12', className)} aria-label={title}>
      <p className="anvl-display flex items-center gap-2.5 text-[11px] tracking-[0.3em] text-[var(--color-highlight-bright)] before:h-px before:w-8 before:bg-[var(--color-highlight)] before:content-['']">
        {title}
      </p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {cast.map((member) => {
          const Icon = rankIcon(member.rank)
          const avatar = resolveStoryAsset(member.avatar)
          return (
            <li
              key={member.id}
              className="flex gap-4 border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[color-mix(in_oklab,var(--color-highlight)_45%,var(--color-line))]"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[var(--color-line)] bg-[var(--color-bg)]">
                {avatar.type === 'image' ? (
                  <img
                    src={avatar.src}
                    alt={avatar.alt || member.name}
                    width={56}
                    height={56}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[var(--color-highlight)]">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="anvl-heading truncate text-lg leading-tight text-[var(--color-heading)]">
                  {member.name}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-[var(--color-highlight-bright)]">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {member.rank}
                </p>
                {member.blurb ? (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {member.blurb}
                  </p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
