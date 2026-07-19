import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

const checkboxInputClass =
  'h-[1.15rem] w-[1.15rem] cursor-pointer rounded-md border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_60%,transparent)] accent-[var(--color-accent)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--color-accent)_35%,transparent)]'

export type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  /** When provided, renders the checkbox as a labeled row (folded in from the retired AdminCheckbox). */
  label?: ReactNode
  /** Extra description under the label (help text) — only used together with `label`. */
  description?: ReactNode
}

/**
 * Modern checkbox — accent-filled, rounded, subtle focus ring. Pass no
 * `label` for a bare control meant to be composed by the caller's own label
 * markup; pass `label` (+ optional `description`) for a self-contained
 * labeled row.
 *
 * `forwardRef` is REQUIRED: React Hook Form's `register()` returns a `ref`
 * that must reach the real `<input>` for RHF to read the checkbox's `checked`
 * state (and to sync its default). A plain function component silently drops
 * that ref, so `{...register('x')}` on this control would never track — the
 * cause of the "Remember me" toggle doing nothing.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, description, disabled, id, ...props },
  ref,
) {
  if (label === undefined) {
    return (
      <input
        ref={ref}
        type="checkbox"
        disabled={disabled}
        id={id}
        className={cn(checkboxInputClass, className)}
        {...props}
      />
    )
  }

  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-xl border border-transparent px-2 py-1.5 text-xs text-[var(--color-text)] transition-colors',
        'hover:border-[var(--color-line)] hover:bg-[var(--color-surface-soft)]',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <input
        ref={ref}
        id={id}
        type="checkbox"
        disabled={disabled}
        className={cn(checkboxInputClass, 'mt-0.5 shrink-0')}
        {...props}
      />
      <span className="min-w-0 flex-1">
        <span className="font-medium text-[var(--color-text)]">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-[var(--color-text-muted)]">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  )
})
