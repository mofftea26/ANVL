import type { ReactNode } from 'react'
import { Container } from '@/shared/components/ui/Container'
import { Section } from '@/shared/components/ui/Section'
import { cn } from '@/shared/lib/cn'

export function SectionShell({
  children,
  className,
  narrow,
}: {
  children: ReactNode
  className?: string
  narrow?: boolean
}) {
  return (
    <Section className={cn('py-[var(--anvl-section-py,4rem)]', className)}>
      <Container className={narrow ? 'max-w-4xl' : 'max-w-[var(--anvl-content-max-wide)]'}>
        {children}
      </Container>
    </Section>
  )
}
