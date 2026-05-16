import {
  type ChangeEvent,
  type CSSProperties,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  isValidColor,
  parseColor,
  rgbaToCss,
  rgbaToHex,
  rgbaToHexInputValue,
  SAFE_FALLBACK_COLOR,
  type RgbaColor,
} from '@/shared/lib/color'
import { cn } from '@/shared/lib/cn'

type ColorFieldProps = {
  value: string | undefined
  onChange: (next: string) => void
  /** Human-readable name; surfaces in aria + visible label when `inline` is false. */
  label?: string
  /** ARIA label fallback when no visible label is rendered. */
  ariaLabel?: string
  /** Tight visual variant: hides the surrounding card and labels. */
  inline?: boolean
  disabled?: boolean
  className?: string
  /** Hide alpha controls for fields that should always be fully opaque. */
  withAlpha?: boolean
  /** Allow `--color-line` style transparent palette entries. Default true. */
  allowEmpty?: boolean
}

/**
 * Full color picker: native color wheel (browser-provided), hex input, RGB inputs,
 * alpha slider, and a live swatch preview. Stores `#rrggbb` when alpha is 1,
 * else `rgba(r, g, b, a)`.
 *
 * The native `<input type="color">` is the most accessible way to launch the
 * OS color wheel/picker on every platform without shipping a heavy color-wheel
 * library; we layer hex/rgb/alpha inputs over it for precision.
 */
export function ColorField({
  value,
  onChange,
  label,
  ariaLabel,
  inline,
  disabled,
  className,
  withAlpha = true,
  allowEmpty = true,
}: ColorFieldProps) {
  const id = useId()
  const parsed = useMemo(
    () => parseColor(value) ?? SAFE_FALLBACK_COLOR,
    [value],
  )
  const [hexDraft, setHexDraft] = useState<string>(() =>
    value && isValidColor(value) ? rgbaToHex(parsed) : rgbaToHex(parsed),
  )
  const lastEmitted = useRef<string | null>(null)

  useEffect(() => {
    if (value && lastEmitted.current === value) return
    setHexDraft(rgbaToHex(parsed))
  }, [parsed, value])

  const emit = (next: RgbaColor) => {
    const css = rgbaToCss(next)
    lastEmitted.current = css
    onChange(css)
  }

  const onPickColor = (e: ChangeEvent<HTMLInputElement>) => {
    const p = parseColor(e.target.value)
    if (!p) return
    emit({ ...p, a: parsed.a })
  }

  const onHexBlur = () => {
    const p = parseColor(hexDraft)
    if (!p) {
      setHexDraft(rgbaToHex(parsed))
      return
    }
    emit({ ...p, a: parsed.a })
  }

  const onChannel = (channel: 'r' | 'g' | 'b', raw: string) => {
    const n = Math.max(0, Math.min(255, Math.round(Number(raw) || 0)))
    emit({ ...parsed, [channel]: n })
  }

  const onAlpha = (raw: string) => {
    const n = Math.max(0, Math.min(1, Number(raw)))
    emit({ ...parsed, a: Number.isFinite(n) ? n : 1 })
  }

  const swatchStyle: CSSProperties = {
    background:
      value && isValidColor(value)
        ? rgbaToCss(parsed)
        : 'transparent',
  }

  const isCurrentlyEmpty = !value || !value.trim()
  const isInvalid = Boolean(value && !isValidColor(value))

  const controls = (
    <div className="flex flex-wrap items-stretch gap-2">
      <div className="relative">
        <input
          id={id}
          type="color"
          value={rgbaToHexInputValue(parsed)}
          onChange={onPickColor}
          disabled={disabled}
          aria-label={ariaLabel ?? label ?? 'Pick color'}
          className={cn(
            'focus-ring h-11 w-14 cursor-pointer rounded-md border border-[var(--color-line)] bg-transparent p-1',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        />
        {/* Checker background only shows through when alpha < 1 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-1 rounded-sm"
          style={{
            backgroundImage:
              'linear-gradient(45deg, rgba(255,255,255,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.08) 75%)',
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
            zIndex: -1,
          }}
        />
      </div>
      <div className="flex h-11 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-2">
        <span
          className="block h-6 w-6 rounded border border-[var(--color-line)]"
          style={swatchStyle}
          aria-hidden="true"
        />
        <span className="ml-2 font-mono text-[11px] tabular-nums text-[var(--color-text-muted)]">
          {isCurrentlyEmpty ? '—' : rgbaToCss(parsed)}
        </span>
      </div>
    </div>
  )

  const fineInputs = (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-[11px] text-[var(--color-text-muted)]">
      <label
        htmlFor={`${id}-hex`}
        className="font-mono uppercase tracking-[0.18em]"
      >
        HEX
      </label>
      <input
        id={`${id}-hex`}
        type="text"
        value={hexDraft.toUpperCase()}
        spellCheck={false}
        disabled={disabled}
        onChange={(e) => setHexDraft(e.target.value)}
        onBlur={onHexBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            ;(e.target as HTMLInputElement).blur()
          }
        }}
        aria-invalid={isInvalid || undefined}
        className={cn(
          'focus-ring h-8 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-2 font-mono text-[12px] uppercase tracking-tight text-[var(--color-text)]',
          isInvalid && 'border-red-500/60',
        )}
      />

      <label className="font-mono uppercase tracking-[0.18em]">RGB</label>
      <div className="grid grid-cols-3 gap-2">
        {(['r', 'g', 'b'] as const).map((channel) => (
          <input
            key={channel}
            type="number"
            min={0}
            max={255}
            value={Math.round(parsed[channel])}
            disabled={disabled}
            onChange={(e) => onChannel(channel, e.target.value)}
            aria-label={`${channel.toUpperCase()} channel (0-255)`}
            className="focus-ring h-8 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-2 font-mono text-[12px] tabular-nums text-[var(--color-text)]"
          />
        ))}
      </div>

      {withAlpha ? (
        <>
          <label className="font-mono uppercase tracking-[0.18em]">A</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={parsed.a}
              disabled={disabled}
              onChange={(e) => onAlpha(e.target.value)}
              aria-label="Opacity (0-1)"
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--color-line)] accent-[var(--color-accent)]"
            />
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={Math.round(parsed.a * 100) / 100}
              disabled={disabled}
              onChange={(e) => onAlpha(e.target.value)}
              aria-label="Opacity numeric"
              className="focus-ring h-8 w-16 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-2 font-mono text-[12px] tabular-nums text-[var(--color-text)]"
            />
          </div>
        </>
      ) : null}
    </div>
  )

  if (inline) {
    return (
      <div className={cn('space-y-2', className)}>
        {controls}
        {fineInputs}
        {allowEmpty && !isCurrentlyEmpty ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-text)] hover:underline"
          >
            Clear color
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'space-y-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]/40 p-3',
        className,
      )}
    >
      {label ? (
        <label
          htmlFor={id}
          className="block text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]"
        >
          {label}
        </label>
      ) : null}
      {controls}
      {fineInputs}
      {isInvalid ? (
        <p role="alert" className="text-[11px] text-red-300">
          Unrecognized color value — using fallback. Edit to fix.
        </p>
      ) : null}
      {allowEmpty && !isCurrentlyEmpty ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-text)] hover:underline"
        >
          Clear color
        </button>
      ) : null}
    </div>
  )
}
