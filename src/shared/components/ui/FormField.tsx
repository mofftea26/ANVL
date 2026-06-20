import type { PropsWithChildren, ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  hint?: ReactNode
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: PropsWithChildren<FormFieldProps>) {
  return (
    <label className="block space-y-2" htmlFor={htmlFor}>
      <span className="text-sm font-semibold text-[var(--color-text)]">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-[var(--color-text-muted)]">{hint}</span> : null}
      {error ? (
        <span className="block text-xs text-[color:var(--color-danger)]" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}
