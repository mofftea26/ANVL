import type { ReactNode } from 'react'
import { Container } from '@/shared/components/ui/Container'
import { Section } from '@/shared/components/ui/Section'

export function ContentPage({
  title,
  intro,
  children,
}: {
  title: string
  intro: string
  children?: ReactNode
}) {
  return (
    <Section>
      <Container className="max-w-4xl">
        <h1 className="anvl-heading text-6xl">{title}</h1>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">{intro}</p>
        {children ? <div className="mt-8 space-y-4 text-sm text-[var(--color-text-muted)]">{children}</div> : null}
      </Container>
    </Section>
  )
}
