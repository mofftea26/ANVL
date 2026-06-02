import type { ReactNode } from 'react'
import { SectionShell } from './SectionShell'
import { SectionEyebrow } from './SectionEyebrow'
import { cn } from '@/shared/lib/cn'

export function PageHero({
  eyebrow,
  title,
  intro,
  children,
  className,
}: {
  eyebrow?: string
  title: string
  intro?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <SectionShell narrow className={cn('border-b border-[var(--color-line)]', className)}>
      {eyebrow ? <SectionEyebrow className="mb-3">{eyebrow}</SectionEyebrow> : null}
      <h1 className="anvl-heading text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.92] text-[var(--color-heading)]">
        {title}
      </h1>
      {intro ? (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
          {intro}
        </p>
      ) : null}
      {children ? <div className="mt-8">{children}</div> : null}
    </SectionShell>
  )
}
