import { Fragment, useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ShieldCheck } from '@/shared/icons'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { resolveStoryAsset } from '@/features/story/lib/resolveStoryAsset'
import type { StoryCastMember } from '@/features/story/schemas/story.schema'
import {
  castMentionHref,
  splitCastMentions,
} from '@/features/story/lib/castMentions'
import { cn } from '@/shared/lib/cn'

const POPOVER_WIDTH = 248

interface Coords {
  left: number
  top: number
  placement: 'above' | 'below'
}

/** Small monogram/avatar for the popover + non-image fallback. */
function MentionAvatar({ member, size }: { member: StoryCastMember; size: number }) {
  const avatar = resolveStoryAsset(member.avatar)
  const initial = member.name.trim().charAt(0).toUpperCase() || '·'
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-heading)]"
      style={{ width: size, height: size }}
    >
      {avatar.type === 'image' ? (
        <img src={avatar.src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="anvl-heading text-sm">{initial}</span>
      )}
    </span>
  )
}

/**
 * A cast member's name inside story text. When the athlete has a public,
 * minted armory the name renders as a highlighted link to their guest armory
 * (`/armory/<handle>`), and hover/focus opens a small forged info card
 * (avatar, name, rank, handle). Without a public handle the name is still
 * highlighted but not linked (no dead link, no popover).
 *
 * The popover is a fixed-position body portal so it is never clipped by the
 * book page's `overflow-hidden` clip; on touch the link still navigates and
 * the popover is a pure hover/focus enhancement.
 */
export function CastMention({
  member,
  label,
}: {
  member: StoryCastMember
  label: string
}) {
  const href = castMentionHref(member)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const popoverId = useId()
  const [coords, setCoords] = useState<Coords | null>(null)

  const open = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const spaceAbove = rect.top
    const placement: Coords['placement'] = spaceAbove > 160 ? 'above' : 'below'
    const rawLeft = rect.left + rect.width / 2 - POPOVER_WIDTH / 2
    const left = Math.max(12, Math.min(rawLeft, window.innerWidth - POPOVER_WIDTH - 12))
    const top = placement === 'above' ? rect.top : rect.bottom
    setCoords({ left, top, placement })
  }, [])

  const close = useCallback(() => setCoords(null), [])

  useEffect(() => {
    if (!coords) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    // Any scroll/resize invalidates the anchored position — just close.
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [coords, close])

  // No public armory → highlighted, non-linked, no popover.
  if (!href) {
    return (
      <span className="font-medium text-[var(--color-heading)] underline decoration-[var(--color-highlight)]/40 decoration-dotted underline-offset-2">
        {label}
      </span>
    )
  }

  return (
    <span
      ref={triggerRef}
      className="inline"
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
    >
      <SafeLink
        href={href}
        aria-describedby={coords ? popoverId : undefined}
        className="focus-ring rounded-[3px] font-medium text-[var(--color-heading)] underline decoration-[var(--color-highlight)] decoration-dotted underline-offset-2 transition-colors hover:text-[var(--color-highlight-bright)]"
      >
        {label}
      </SafeLink>
      {coords && typeof document !== 'undefined'
        ? createPortal(
            <div
              id={popoverId}
              role="tooltip"
              className={cn(
                'anvl-story-mention-card pointer-events-none fixed z-[120] w-[248px] rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-elevated,var(--color-surface))] p-3 shadow-[0_18px_48px_-14px_rgba(0,0,0,0.85)]',
              )}
              style={{
                left: coords.left,
                top: coords.top,
                transform: coords.placement === 'above' ? 'translateY(calc(-100% - 8px))' : 'translateY(8px)',
              }}
            >
              <div className="flex items-center gap-3">
                <MentionAvatar member={member} size={44} />
                <div className="min-w-0">
                  <p className="anvl-heading truncate text-base leading-tight text-[var(--color-heading)]">
                    {member.name}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[var(--color-highlight-bright)]">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    {member.rank || 'Recruit'}
                  </p>
                </div>
              </div>
              <p className="mt-2.5 flex items-center justify-between gap-2 border-t border-[var(--color-line)] pt-2 text-[11px] text-[var(--color-text-muted)]">
                <span className="truncate">@{member.armoryHandle}</span>
                <span className="shrink-0 text-[var(--color-highlight-bright)]">View armory →</span>
              </p>
            </div>,
            document.body,
          )
        : null}
    </span>
  )
}

/**
 * Render act-body text with cast names lit up as {@link CastMention}s. Pure
 * inline content — drop it inside a `<p>`.
 */
export function CastText({
  text,
  cast,
}: {
  text: string
  cast: readonly StoryCastMember[]
}) {
  const segments = splitCastMentions(text, cast)
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'mention' ? (
          <CastMention key={i} member={seg.member} label={seg.text} />
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        ),
      )}
    </>
  )
}
