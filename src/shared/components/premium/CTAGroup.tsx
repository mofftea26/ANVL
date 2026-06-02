import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export function CTAGroup({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>{children}</div>
  )
}
