import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * A single account bento card. Optional Higgsfield background sits behind a
 * legibility gradient; the bg layer (`data-card-bg`) is the parallax target the
 * carousel animates. Rounded, bordered, responsive.
 */
export function AccountBentoCard({
  bg,
  eyebrow,
  title,
  icon,
  className,
  children,
}: {
  bg?: string
  eyebrow?: string
  title?: ReactNode
  icon?: ReactNode
  className?: string
  children?: ReactNode
}) {
  return (
    <article
      data-account-card
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.8)]',
        className,
      )}
    >
      {bg ? (
        <>
          <div
            data-card-bg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 scale-[1.12] bg-cover bg-center opacity-80 transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.18]"
            style={{ backgroundImage: `url('${bg}')` }}
          />
          {/* Light legibility wash — keeps the texture visible, darkens only where text sits. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--color-surface)]/92 via-[var(--color-surface)]/45 to-[var(--color-surface)]/15"
          />
        </>
      ) : null}
      <div className="relative z-10 flex h-full min-h-0 flex-col">
        {eyebrow || icon ? (
          <div className="mb-2 flex items-center justify-between gap-2">
            {eyebrow ? (
              <p className="anvl-display text-[10px] tracking-[0.26em] text-[var(--color-accent)]">
                {eyebrow}
              </p>
            ) : <span />}
            {icon ? <span className="text-[var(--color-text-muted)]">{icon}</span> : null}
          </div>
        ) : null}
        {title ? (
          <h3 className="anvl-heading text-lg font-normal leading-snug text-[var(--color-heading)]">
            {title}
          </h3>
        ) : null}
        {children}
      </div>
    </article>
  )
}
