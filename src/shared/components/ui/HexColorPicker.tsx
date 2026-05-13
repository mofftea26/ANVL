import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

/** Coerce stored hex to `#rrggbb` for `<input type="color">` (falls back when invalid). */
export function normalizeHexForColorInput(hex: string | undefined): string {
  const raw = (hex ?? '').trim()
  if (!raw) return '#808080'
  const withHash = raw.startsWith('#') ? raw : `#${raw}`
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(withHash)
  if (!m) return '#808080'
  let body = m[1]
  if (body.length === 3) {
    body = body
      .split('')
      .map((c) => c + c)
      .join('')
  }
  return `#${body.toLowerCase()}`
}

type HexColorPickerProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> & {
  value: string | undefined
  onChange: (hex: string) => void
  /** Screen reader label for the swatch control */
  ariaLabel?: string
}

export function HexColorPicker({
  value,
  onChange,
  className,
  disabled,
  ariaLabel = 'Pick color',
  ...rest
}: HexColorPickerProps) {
  const normalized = normalizeHexForColorInput(value)
  const showHex = Boolean(value?.trim())

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <input
        {...rest}
        type="color"
        disabled={disabled}
        value={normalized}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'focus-ring h-11 w-[4.25rem] shrink-0 cursor-pointer rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-1',
          disabled && 'cursor-not-allowed opacity-50',
        )}
        aria-label={ariaLabel}
      />
      <span
        className="min-w-[5.5rem] font-mono text-xs tabular-nums tracking-tight text-[var(--color-text-muted)]"
        aria-hidden="true"
      >
        {showHex ? normalized : '—'}
      </span>
    </div>
  )
}
