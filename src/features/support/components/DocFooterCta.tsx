import type { ReactNode } from 'react'
import { Container } from '@/shared/components/ui'
import { ForgeAtmosphere } from '@/shared/components/premium/ForgeAtmosphere'

/** Shared button classes so every doc CTA reads identically across pages. */
export const DOC_CTA_PRIMARY_CLASS =
  "focus-ring inline-flex h-10 items-center rounded-md border border-[var(--color-highlight)] bg-[var(--color-highlight)] px-4 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-bg)] no-underline hover:opacity-90"

export const DOC_CTA_SECONDARY_CLASS =
  "focus-ring inline-flex h-10 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text)] no-underline hover:border-[color-mix(in_oklab,var(--color-highlight)_60%,var(--color-line))]"

/**
 * Forged footer band that closes a content page with a message + action links
 * (the caller supplies the links so routing types stay out of shared code).
 * Mirrors the size-guide CTA so every legal/support page ends the same way.
 */
export function DocFooterCta({ message, children }: { message: string; children: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-t border-[var(--color-line)]">
      <ForgeAtmosphere />
      <Container className="relative z-10 flex flex-col gap-4 py-14 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
        <div className="flex flex-wrap gap-3">{children}</div>
      </Container>
    </section>
  )
}
