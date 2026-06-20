import { useId } from 'react'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import {
  parseColor,
  rgbaToCss,
  rgbaToHexInputValue,
  SAFE_FALLBACK_COLOR,
  type RgbaColor,
} from '@/shared/lib/color'

type ThemeColorFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  /** Show an opacity slider and serialize back to rgba() (e.g. borders/dividers). */
  allowAlpha?: boolean
}

/** Checkerboard so semi-transparent swatches read as transparent, not muddy. */
const CHECKER_STYLE = {
  backgroundImage:
    'linear-gradient(45deg,#3a3d40 25%,transparent 25%,transparent 75%,#3a3d40 75%),linear-gradient(45deg,#3a3d40 25%,transparent 25%,transparent 75%,#3a3d40 75%)',
  backgroundSize: '10px 10px',
  backgroundPosition: '0 0,5px 5px',
} as const

/**
 * Branded color picker for the theme editor — a fully rounded swatch (click to
 * open the native picker) paired with the live value and an optional opacity
 * slider. Replaces the raw square `<input type="color">` / rgba text box so the
 * controls match the rounded surfaces around them.
 */
export function ThemeColorField({
  label,
  value,
  onChange,
  allowAlpha,
}: ThemeColorFieldProps) {
  const inputId = useId()
  const parsed = parseColor(value) ?? SAFE_FALLBACK_COLOR
  const hexValue = rgbaToHexInputValue(parsed)
  const alphaPct = Math.round(parsed.a * 100)

  function emit(next: RgbaColor) {
    onChange(allowAlpha ? rgbaToCss(next) : rgbaToCss({ ...next, a: 1 }))
  }

  return (
    <AdminFormField label={label}>
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-2 pr-3.5">
        <label
          htmlFor={inputId}
          className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-inset ring-[var(--color-line)] transition-transform hover:scale-105"
          style={CHECKER_STYLE}
        >
          <span
            className="absolute inset-0 rounded-full"
            style={{ background: rgbaToCss(parsed) }}
          />
          <input
            id={inputId}
            type="color"
            value={hexValue}
            onChange={(e) => {
              const next = parseColor(e.target.value) ?? SAFE_FALLBACK_COLOR
              emit({ ...next, a: parsed.a })
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={`${label} color`}
          />
        </label>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="truncate font-mono text-xs text-[var(--color-text)]">
            {value}
          </span>
          {allowAlpha ? (
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                value={alphaPct}
                onChange={(e) =>
                  emit({ ...parsed, a: Number(e.target.value) / 100 })
                }
                aria-label={`${label} opacity`}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--color-line)]"
                style={{ accentColor: 'var(--color-text)' }}
              />
              <span className="w-9 shrink-0 text-right font-mono text-[10px] text-[var(--color-text-muted)]">
                {alphaPct}%
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </AdminFormField>
  )
}
