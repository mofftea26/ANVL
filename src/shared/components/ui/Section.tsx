import type { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '@/shared/lib/cn'

export function Section({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return (
    <section className={cn('py-12 md:py-20', className)} {...props}>
      {children}
    </section>
  )
}
