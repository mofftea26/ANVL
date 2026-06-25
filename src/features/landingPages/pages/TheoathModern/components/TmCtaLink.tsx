import { cn } from '@/shared/lib/cn'
import { sanitizeHref } from '@/shared/lib/url'
import type { TmResolvedCta } from '../content/theoathModernContent.defaults'

/**
 * Theoath Modern CTA. Internal/relative hrefs are sanitized; `[data-tm-magnetic]`
 * enables the desktop magnetic hover (gated by the timeline on fine pointers).
 */
export function TmCtaLink({
  cta,
  kind = 'primary',
  className,
}: {
  cta: TmResolvedCta
  kind?: 'primary' | 'secondary'
  className?: string
}) {
  const href = sanitizeHref(cta.href) || '#'
  if (!cta.label) return null
  return (
    <a
      href={href}
      data-tm-magnetic
      className={cn(
        'focus-ring inline-flex h-12 items-center justify-center rounded-md border px-6 text-sm font-semibold uppercase tracking-[0.14em] transition-colors',
        kind === 'primary'
          ? 'border-[var(--color-highlight)] bg-[var(--color-highlight)] text-[color:var(--color-on-highlight)] hover:opacity-90'
          : 'border-[var(--color-line)] bg-transparent text-[color:var(--color-text)] hover:border-[var(--color-accent)] hover:text-[color:var(--color-highlight-bright)]',
        className,
      )}
    >
      {cta.label}
    </a>
  )
}
