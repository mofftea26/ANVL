import { type InputHTMLAttributes, type ReactNode } from 'react'
import { adminCheckboxControlClass } from '@/shared/lib/cmsFieldStyles'
import { cn } from '@/shared/lib/cn'

type AdminCheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'children'
> & {
  label: ReactNode
  /** Extra description under the label (help text). */
  description?: ReactNode
}

export function AdminCheckbox({
  label,
  description,
  className,
  id,
  disabled,
  ...rest
}: AdminCheckboxProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-lg border border-transparent py-1 text-sm text-[var(--color-text)]',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        disabled={disabled}
        className={adminCheckboxControlClass}
        {...rest}
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
}
