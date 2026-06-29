import type { ReactNode } from 'react'
import { Container } from '@/shared/components/ui'
import { cn } from '@/shared/lib/cn'

/** Shared PDP section frame — consistent vertical rhythm + top hairline. */
export function PdpSection({
  eyebrow,
  className,
  children,
}: {
  eyebrow?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('border-t border-[var(--shop-card-border)] py-10 md:py-14', className)}>
      <Container className="max-w-5xl">
        {eyebrow ? (
          <p
            data-reveal
            className="anvl-display mb-5 inline-flex items-center gap-2 text-[10px] tracking-[0.26em] text-[var(--shop-accent)] before:h-px before:w-6 before:bg-[var(--shop-accent)] before:content-['']"
          >
            {eyebrow}
          </p>
        ) : null}
        {children}
      </Container>
    </section>
  )
}
