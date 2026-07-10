import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/cn'

export type FormFieldLabelStyle = 'display' | 'stacked' | 'filter' | 'micro'

const labelStyles: Record<FormFieldLabelStyle, string> = {
  // Storefront default — the field wrapper's original look, unchanged.
  display: 'anvl-display block text-[11px] font-medium tracking-[0.12em] text-[var(--color-text-muted)]',
  // The 3 presets folded in from the retired AdminFieldLabel.
  stacked: 'block text-xs text-[var(--color-text-muted)]',
  filter: 'block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]',
  micro: 'block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]',
}

interface FormFieldProps {
  label: ReactNode
  htmlFor?: string
  error?: string
  hint?: ReactNode
  labelStyle?: FormFieldLabelStyle
  className?: string
}

/**
 * Field wrapper: a label (4 style presets), the control, hint + error.
 * Uses an explicit `<label htmlFor>` (never an implicit label-wraps-control),
 * so composite children with their own interactive elements (e.g. a "Choose
 * media" button) never get the outer label's unrelated text folded into
 * their accessible name. When `children` is a single element,
 * `aria-invalid`/`aria-describedby` are wired onto it automatically so the
 * hint/error are announced on focus.
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  labelStyle = 'display',
  className,
  children,
}: PropsWithChildren<FormFieldProps>) {
  const hintId = useId()
  const errorId = useId()
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  const control =
    isValidElement(children) && Children.count(children) === 1
      ? cloneElement(
          // Generic a11y prop injection — the wrapped control's own prop type
          // isn't known statically here, so this is deliberately widened.
          children as ReactElement<Record<string, unknown>>,
          { 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy },
        )
      : children

  return (
    <div className={cn('block space-y-1.5', className)}>
      <label className={labelStyles[labelStyle]} htmlFor={htmlFor}>
        {label}
      </label>
      {control}
      {hint ? (
        <span id={hintId} className="block text-xs text-[var(--color-text-muted)]">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="block text-xs text-[color:var(--color-danger)]" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}
