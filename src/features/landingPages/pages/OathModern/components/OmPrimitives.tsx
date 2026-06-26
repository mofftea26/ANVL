import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { SafeLink } from '@/shared/components/ui/SafeLink'

/** Uppercase ceremonial eyebrow / chapter marker. */
export function OmEyebrow({ children }: { children: string }) {
  return (
    <p
      data-om-reveal
      className="anvl-micro text-[0.7rem] uppercase tracking-[0.34em] text-[color:var(--color-text-muted)]"
    >
      {children}
    </p>
  )
}

/** Fine forged hairline used between/within chapters. */
export function OmHairline({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block h-px w-full bg-[var(--color-line)]', className)}
    />
  )
}

/**
 * Carved display heading. Words listed in `highlight` render in the wax-metal
 * accent ink; everything else stays bone. Case-insensitive, punctuation-tolerant.
 */
export function OmHeading({
  text,
  highlight = [],
  as: Tag = 'h2',
  className,
}: {
  text: string
  highlight?: string[]
  as?: 'h1' | 'h2' | 'h3'
  className?: string
}) {
  const wanted = new Set(highlight.map((w) => w.trim().toLowerCase()).filter(Boolean))
  const words = text.split(/(\s+)/)
  return (
    <Tag
      className={cn(
        'anvl-heading text-balance uppercase leading-[0.92] tracking-[0.01em] text-[color:var(--color-heading)]',
        className,
      )}
    >
      {words.map((word, i) => {
        const bare = word.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase()
        if (bare && wanted.has(bare)) {
          return (
            <span key={i} className="text-[color:var(--color-primary)]">
              {word}
            </span>
          )
        }
        return <span key={i}>{word}</span>
      })}
    </Tag>
  )
}

/**
 * Ceremonial CTA link. `primary` = wax-metal fill / forged-dark text; `ghost` =
 * bone hairline outline. CMS hrefs flow through {@link SafeLink} (sanitized).
 */
export function OmCtaLink({
  href,
  tone = 'primary',
  children,
  className,
  'data-om-magnetic': magnetic,
}: {
  href: string
  tone?: 'primary' | 'ghost'
  children: ReactNode
  className?: string
  'data-om-magnetic'?: boolean
}) {
  return (
    <SafeLink
      href={href}
      data-om-magnetic={magnetic ? '' : undefined}
      className={cn(
        'focus-ring inline-flex h-12 items-center justify-center gap-2 px-7 text-[0.72rem] font-semibold uppercase tracking-[0.22em] transition-colors duration-300',
        tone === 'primary'
          ? 'bg-[var(--color-primary)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-highlight-bright)]'
          : 'border border-[var(--color-border-strong,var(--color-line))] text-[color:var(--color-text)] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]',
        className,
      )}
    >
      {children}
    </SafeLink>
  )
}

/**
 * Chapter shell — consistent gutters, max-width, vertical rhythm, and a top
 * forged hairline. Heavy children opt into scroll reveals via `[data-om-reveal]`;
 * the master timeline (M4) keys off `[data-om-chapter]`.
 */
export function OmChapterShell({
  id,
  chapter,
  className,
  children,
}: {
  id?: string
  chapter: string
  className?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      data-om-chapter={chapter}
      className={cn(
        'relative border-t border-[var(--color-line)] px-6 py-24 lg:px-12 lg:py-32',
        className,
      )}
    >
      <div className="mx-auto max-w-[var(--anvl-content-max)]">{children}</div>
    </section>
  )
}
