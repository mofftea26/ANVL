import type { LabelHTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '@/shared/lib/cn'

export type AdminFieldLabelStyle = 'stacked' | 'filter' | 'micro'

const labelStyles: Record<AdminFieldLabelStyle, string> = {
  stacked: 'block text-xs text-[var(--color-text-muted)]',
  filter:
    'block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]',
  micro:
    'block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]',
}

export type AdminFieldLabelProps = PropsWithChildren<
  LabelHTMLAttributes<HTMLLabelElement> & {
    labelStyle?: AdminFieldLabelStyle
    hint?: string
  }
>

export function AdminFieldLabel({
  children,
  labelStyle = 'stacked',
  hint,
  className,
  ...props
}: AdminFieldLabelProps) {
  return (
    <label className={cn(labelStyles[labelStyle], className)} {...props}>
      {children}
      {hint ? (
        <span className="mt-1 block max-w-xl text-xs font-normal normal-case tracking-normal text-[var(--color-text-muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  )
}
