import type { PropsWithChildren } from 'react'

export function Badge({ children }: PropsWithChildren) {
  return (
    <span className="anvl-micro inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-chip)] px-3 py-1">
      {children}
    </span>
  )
}
