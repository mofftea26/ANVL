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
 *
 * LABEL ASSOCIATION (fixed 2026-08-04): `htmlFor` is optional, and because the
 * label is EXPLICIT rather than wrapping the control, omitting it produced a
 * label pointing at nothing — i.e. a visually-labelled but programmatically
 * ANONYMOUS control. That was the single cause of ~180 unlabelled admin inputs,
 * including the admin sign-in email field. The id is now resolved here and
 * injected into the child, so every existing call site is fixed with no change:
 *
 *   1. an explicit `htmlFor` always wins (caller knows best);
 *   2. otherwise the child's own `id`, if it has one;
 *   3. otherwise a generated one, injected onto the child.
 *
 * Only step 3 mutates the child, and only when `children` is a single element —
 * a composite child (its own button + input) still cannot be auto-associated,
 * which is exactly why `htmlFor` remains available.
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
  const generatedControlId = useId()
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  const isSingleElement = isValidElement(children) && Children.count(children) === 1
  const childProps = isSingleElement
    ? ((children as ReactElement<Record<string, unknown>>).props ?? {})
    : {}
  const existingChildId =
    typeof childProps.id === 'string' && childProps.id.length > 0 ? childProps.id : undefined

  // `htmlFor` wins, then the child's own id, then a generated one. Only the
  // last case needs injecting — the first two already resolve to a real node.
  const controlId = htmlFor ?? existingChildId ?? (isSingleElement ? generatedControlId : undefined)

  const control = isSingleElement
    ? cloneElement(
        // Generic a11y prop injection — the wrapped control's own prop type
        // isn't known statically here, so this is deliberately widened.
        children as ReactElement<Record<string, unknown>>,
        {
          'aria-invalid': error ? true : undefined,
          'aria-describedby': describedBy,
          // Never clobber an id the control already carries: other code may
          // reference it (aria-controls, tests, scroll-to-field).
          ...(existingChildId || htmlFor ? {} : { id: controlId }),
        },
      )
    : children

  return (
    <div className={cn('block space-y-1.5', className)}>
      <label className={labelStyles[labelStyle]} htmlFor={controlId}>
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
