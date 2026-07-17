import { useId } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/shared/lib/cn'

const trackVariants = cva(
  [
    'focus-ring relative inline-flex shrink-0 cursor-pointer items-center rounded-full',
    'transition-colors duration-200 ease-out',
    'disabled:cursor-not-allowed disabled:opacity-45',
  ],
  {
    variants: {
      size: {
        sm: 'h-[18px] w-8',
        md: 'h-[22px] w-10',
      },
      checked: {
        // On: the forged champagne track with a soft heat glow.
        true: [
          'bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)]',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_0_12px_-2px_color-mix(in_oklab,var(--color-highlight)_65%,transparent)]',
        ],
        // Off: a recessed steel channel.
        false: 'bg-[var(--color-surface-elevated)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]',
      },
    },
    defaultVariants: { size: 'md', checked: false },
  },
)

const thumbVariants = cva(
  [
    'pointer-events-none absolute rounded-full bg-[var(--color-heading)]',
    'shadow-[0_1px_3px_rgba(0,0,0,0.5)]',
    'transition-transform duration-200 ease-out',
  ],
  {
    variants: {
      size: {
        sm: 'left-[2px] h-[14px] w-[14px]',
        md: 'left-[3px] h-4 w-4',
      },
      checked: { true: '', false: 'translate-x-0' },
    },
    compoundVariants: [
      { size: 'sm', checked: true, class: 'translate-x-[14px]' },
      { size: 'md', checked: true, class: 'translate-x-[17px]' },
    ],
    defaultVariants: { size: 'md', checked: false },
  },
)

/**
 * The house switch — the ONE control for toggling a boolean anywhere (feat
 * visibility, piece sharing, settings rows, admin options).
 *
 * Single concern (SOLID): renders state, reports intent via `onChange(next)`;
 * persistence, optimism, and toasts belong to the caller. A native
 * `<button role="switch">` supplies keyboard + AT semantics.
 *
 * Layouts:
 *  - bare (no label): just the control — give it an `aria-label`.
 *  - `label`: control + clickable label on the right (compact inline use).
 *  - `label` + `description`: the settings-row layout (text left, switch
 *    right), preserving the original component's API.
 */
export function Switch({
  checked,
  onChange,
  label,
  description,
  size = 'md',
  disabled = false,
  className,
  id: idProp,
  'aria-label': ariaLabel,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  description?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
  id?: string
  'aria-label'?: string
}) {
  const generatedId = useId()
  const id = idProp ?? generatedId

  const control = (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label ? undefined : ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={trackVariants({ size, checked, className: label ? undefined : className })}
    >
      <span aria-hidden="true" className={thumbVariants({ size, checked })} />
    </button>
  )

  if (!label) return control

  // Settings-row layout: text block left, switch right.
  if (description) {
    return (
      <span className={cn('flex cursor-pointer items-start justify-between gap-4', className)}>
        <label htmlFor={id} className="min-w-0 cursor-pointer select-none">
          <span className="block text-sm font-medium text-[var(--color-text)]">{label}</span>
          <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">
            {description}
          </span>
        </label>
        <span className="mt-0.5">{control}</span>
      </span>
    )
  }

  // Compact inline layout: switch + label on the right.
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {control}
      <label
        htmlFor={id}
        className={cn(
          'cursor-pointer select-none text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors',
          checked ? 'text-[var(--color-heading)]' : 'text-[var(--color-text-muted)]',
          disabled && 'cursor-not-allowed opacity-45',
        )}
      >
        {label}
      </label>
    </span>
  )
}
