import type { PropsWithChildren, ReactNode } from 'react'
import { AdminFieldLabel, type AdminFieldLabelStyle } from '@/features/admin/components/AdminFieldLabel'
import { cn } from '@/shared/lib/cn'

export type AdminFormFieldProps = PropsWithChildren<{
  label: ReactNode
  htmlFor?: string
  error?: string
  hint?: ReactNode
  labelStyle?: AdminFieldLabelStyle
  className?: string
}>

/**
 * Admin field wrapper — oath-dark label rhythm; use with {@link AdminInput} and peers.
 * Prefer over storefront `FormField` inside `/admin` routes.
 */
export function AdminFormField({
  label,
  htmlFor,
  error,
  hint,
  labelStyle = 'stacked',
  className,
  children,
}: AdminFormFieldProps) {
  return (
    <div className={cn('block space-y-2', className)}>
      <AdminFieldLabel htmlFor={htmlFor} labelStyle={labelStyle}>
        {label}
      </AdminFieldLabel>
      {children}
      {hint ? (
        <span className="block text-xs text-[var(--color-text-muted)]">{hint}</span>
      ) : null}
      {error ? (
        <span className="block text-xs text-red-300" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}
