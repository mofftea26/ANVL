import type { ReactNode } from 'react'
import { AnvlCrest } from '@/shared/assets/brand'
import { Container } from '@/shared/components/ui/Container'
import { GrainOverlay } from '@/shared/components/layout/GrainOverlay'
import { SectionEyebrow } from './SectionEyebrow'
import { cn } from '@/shared/lib/cn'

/**
 * Cinematic editorial page hero — a tall full-bleed duotone plane with grain and
 * a crest watermark, used by the static content pages (About, Story, Size guide)
 * to match the landing's premium language without the heavy pinned scroll cinema.
 */
export function EditorialHero({
  eyebrow,
  title,
  intro,
  children,
  tone = '#17191c',
  className,
}: {
  eyebrow?: string
  title: ReactNode
  intro?: string
  children?: ReactNode
  /** Duotone base for the backdrop. */
  tone?: string
  className?: string
}) {
  return (
    <section
      className={cn(
        'relative flex min-h-[62svh] w-full items-center overflow-hidden border-b border-[var(--color-line)]',
        className,
      )}
      style={{ background: `linear-gradient(160deg, ${tone} 0%, var(--color-bg) 78%)` }}
    >
      <GrainOverlay />
      <AnvlCrest
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-1/2 z-0 h-[120%] w-auto -translate-y-1/2 text-[var(--color-heading)] opacity-[0.06] md:-right-24 md:opacity-[0.08]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 90% 80% at 50% 45%, transparent 35%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      <Container className="relative z-10 py-20 md:py-28">
        {eyebrow ? <SectionEyebrow className="mb-4">{eyebrow}</SectionEyebrow> : null}
        <h1 className="anvl-heading max-w-4xl font-normal leading-[0.9] tracking-[-0.01em] text-[clamp(2.75rem,8vw,6rem)] text-[var(--color-heading)]">
          {title}
        </h1>
        {intro ? (
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)] md:text-lg">
            {intro}
          </p>
        ) : null}
        {children ? <div className="mt-9">{children}</div> : null}
      </Container>
    </section>
  )
}
