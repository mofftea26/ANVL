import type { ReactNode } from 'react'
import { Container } from '@/shared/components/ui'
import { ForgeAtmosphere } from '@/shared/components/premium/ForgeAtmosphere'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

/**
 * Formats an ISO `YYYY-MM-DD` date deterministically (no `Date`/`Intl`, so SSR
 * and client agree regardless of locale/timezone). Returns '' for anything that
 * is not a clean date string, so a blank stamp simply hides.
 */
export function formatDocDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!match) return ''
  const [, year, month, day] = match
  const monthName = MONTHS[Number(month) - 1]
  if (!monthName) return ''
  return `${monthName} ${Number(day)}, ${year}`
}

/**
 * The shared forged hero for every legal + support content page — one cohesive
 * masthead (ForgeAtmosphere + eyebrow + title + optional intro + optional "Last
 * updated" stamp). Pure CSS atmosphere, reduced-motion safe by construction.
 */
export function DocHero({
  eyebrow,
  title,
  intro,
  updatedAt,
  children,
}: {
  eyebrow: string
  title: string
  intro?: string
  /** ISO `YYYY-MM-DD`; blank hides the "Last updated" stamp. */
  updatedAt?: string
  children?: ReactNode
}) {
  const formattedDate = updatedAt ? formatDocDate(updatedAt) : ''
  return (
    <section className="relative overflow-hidden border-b border-[var(--color-line)]">
      <ForgeAtmosphere />
      <Container className="relative z-10 py-20 md:py-28">
        <p className="anvl-display inline-flex items-center gap-2.5 text-xs tracking-[0.32em] text-[var(--color-highlight-bright)] before:h-px before:w-8 before:bg-[var(--color-highlight)] before:content-['']">
          {eyebrow}
        </p>
        <h1 className="anvl-heading mt-5 max-w-3xl font-normal leading-[0.88] tracking-[-0.01em] text-[clamp(2.5rem,8vw,5.5rem)] text-[var(--color-heading)]">
          {title}
        </h1>
        {formattedDate ? (
          <p className="anvl-micro mt-5 text-[var(--color-text-muted)]">
            Last updated {formattedDate}
          </p>
        ) : null}
        {intro ? (
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)] md:text-lg">
            {intro}
          </p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </Container>
    </section>
  )
}
