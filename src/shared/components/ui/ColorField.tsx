import * as PopoverPrimitive from '@radix-ui/react-popover'
import { SlidersHorizontal } from 'lucide-react'
import { RgbColorPicker } from 'react-colorful'
import {
  type CSSProperties,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'
import {
  isValidColor,
  parseColor,
  rgbaToClipboardHex,
  rgbaToCss,
  rgbaToHex,
  SAFE_FALLBACK_COLOR,
  type RgbaColor,
} from '@/shared/lib/color'
import { IconButton } from '@/shared/components/ui/IconButton'
import { adminFieldCompactRowClass, adminFieldControlFineClass } from '@/shared/lib/cmsFieldStyles'
import { cn } from '@/shared/lib/cn'

const CHECKERBOARD_STYLE: CSSProperties = {
  backgroundImage:
    'linear-gradient(45deg, rgba(255,255,255,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.08) 75%)',
  backgroundSize: '8px 8px',
  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
}

const colorPopoverContentClass =
  'z-[85] flex w-[min(22rem,92vw)] max-h-none flex-col gap-4 overflow-visible rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-elevated)] p-4 shadow-[inset_0_1px_0_rgba(231,228,223,0.06),0_16px_42px_rgba(0,0,0,0.55)] outline-none'

function fineInputClassName(
  fineInputControlClass: string | undefined,
  extra: string,
  invalid?: boolean,
) {
  return cn(
    fineInputControlClass ?? adminFieldControlFineClass,
    'focus-ring w-full font-mono',
    extra,
    invalid && 'border-red-500/60',
  )
}

export type ColorFieldPopoverFormProps = {
  idPrefix: string
  parsed: RgbaColor
  hexDraft: string
  setHexDraft: (next: string) => void
  onPickerColor: (next: RgbaColor) => void
  onHexBlur: () => void
  onChannel: (channel: 'r' | 'g' | 'b', raw: string) => void
  onAlpha: (raw: string) => void
  disabled?: boolean
  withAlpha?: boolean
  fineInputControlClass?: string
  isInvalid: boolean
  isCurrentlyEmpty: boolean
  onClearColor?: () => void
  allowEmpty?: boolean
  pickAriaLabel: string
  /** When false, mini swatch in the control row hides the color fill (invalid / empty). */
  showSwatchFill: boolean
}

/**
 * Inner spectrum (SV + hue via `react-colorful`), HEX / RGB / alpha, and optional clear.
 */
export function ColorFieldPopoverForm({
  idPrefix,
  parsed,
  hexDraft,
  setHexDraft,
  onPickerColor,
  onHexBlur,
  onChannel,
  onAlpha,
  disabled,
  withAlpha = true,
  fineInputControlClass,
  isInvalid,
  isCurrentlyEmpty,
  onClearColor,
  allowEmpty,
  pickAriaLabel,
  showSwatchFill,
}: ColorFieldPopoverFormProps) {
  const pickerRgb = {
    r: Math.round(parsed.r),
    g: Math.round(parsed.g),
    b: Math.round(parsed.b),
  }

  const controls = (
    <div className="space-y-2">
      <div
        data-testid="anvl-color-visual-picker"
        role="group"
        aria-label={pickAriaLabel}
        className={cn(
          'focus-ring relative w-full max-h-[13.5rem] aspect-[4/3] rounded-lg outline-none',
          disabled && 'pointer-events-none opacity-50',
        )}
        {...(disabled ? { inert: true as const } : {})}
      >
        <RgbColorPicker
          className="!absolute !inset-0 !h-full !w-full !max-h-none rounded-lg [&_.react-colorful__saturation]:rounded-t-lg [&_.react-colorful__last-control]:rounded-b-lg"
          color={pickerRgb}
          onChange={(c) => {
            if (disabled) return
            onPickerColor({
              r: Math.round(c.r),
              g: Math.round(c.g),
              b: Math.round(c.b),
              a: parsed.a,
            })
          }}
        />
      </div>
      <div className="flex min-h-10 items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-2 py-1.5">
        <span
          className="relative block h-6 w-6 shrink-0 overflow-hidden rounded border border-[var(--color-line)]"
          aria-hidden="true"
        >
          <span className="absolute inset-0 rounded-sm" style={CHECKERBOARD_STYLE} />
          <span
            className="absolute inset-0 rounded-sm"
            style={{
              background: showSwatchFill ? rgbaToCss(parsed) : 'transparent',
            }}
          />
        </span>
        <span className="ml-2 min-w-0 truncate font-mono text-[11px] tabular-nums text-[var(--color-text-muted)]">
          {isCurrentlyEmpty ? '—' : rgbaToCss(parsed)}
        </span>
      </div>
    </div>
  )

  const fineInputs = (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-[11px] text-[var(--color-text-muted)]">
      <label
        htmlFor={`${idPrefix}-hex`}
        className="font-mono uppercase tracking-[0.18em]"
      >
        HEX
      </label>
      <input
        id={`${idPrefix}-hex`}
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
        className={fineInputClassName(
          fineInputControlClass,
          'uppercase tracking-tight',
          isInvalid,
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
            className={fineInputClassName(
              fineInputControlClass,
              'tabular-nums',
            )}
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
              className={fineInputClassName(
                fineInputControlClass,
                'w-16 tabular-nums',
              )}
            />
          </div>
        </>
      ) : null}
    </div>
  )

  return (
    <div className="space-y-3">
      {controls}
      {fineInputs}
      {allowEmpty && !isCurrentlyEmpty && onClearColor ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onClearColor}
          className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-text)] hover:underline disabled:opacity-50"
        >
          Clear color
        </button>
      ) : null}
    </div>
  )
}

export type ColorFieldDensity = 'comfortable' | 'compact'

type ColorFieldProps = {
  value: string | undefined
  onChange: (next: string) => void
  /** Human-readable name; surfaces in aria + visible label when `inline` is false. */
  label?: string
  /** ARIA label fallback when no visible label is rendered. */
  ariaLabel?: string
  /** Tight visual variant: hides the surrounding card and labels. */
  inline?: boolean
  /** Swatch tile sizing for popover layout (`inline` ignores this). Default `comfortable`. */
  density?: ColorFieldDensity
  disabled?: boolean
  className?: string
  /** Hide alpha controls for fields that should always be fully opaque. */
  withAlpha?: boolean
  /** Allow `--color-line` style transparent palette entries. Default true. */
  allowEmpty?: boolean
  /** Merged into HEX / numeric channel inputs (e.g. shared `adminFieldControlFineClass`). */
  fineInputControlClass?: string
  /** Compact row shell (defaults to admin chip row when unset in admin wrappers). */
  compactContainerClassName?: string
}

/**
 * Full color picker: in-panel SV + hue (`react-colorful`), hex input, RGB inputs,
 * alpha slider, and a live swatch preview. Stores `#rrggbb` when alpha is 1,
 * else `rgba(r, g, b, a)`.
 *
 * Default layout: swatch-first tile (checkerboard under alpha) + popover editor.
 * `density="compact"` renders a **`h-10`** bordered row (**input-height**) with a small swatch chip
 * (dense forms / modal grids — avoids tall **`items-stretch`** columns).
 * `inline` keeps compact controls on the page (e.g. product swatch row).
 */
export function ColorField({
  value,
  onChange,
  label,
  ariaLabel,
  inline,
  density = 'comfortable',
  disabled,
  className,
  withAlpha = true,
  allowEmpty = true,
  fineInputControlClass,
  compactContainerClassName,
}: ColorFieldProps) {
  const id = useId()
  const parsed = useMemo(
    () => parseColor(value) ?? SAFE_FALLBACK_COLOR,
    [value],
  )
  const [hexDraft, setHexDraft] = useState<string>(() => rgbaToHex(parsed))
  const lastEmitted = useRef<string | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)

  useEffect(() => {
    if (value && lastEmitted.current === value) return
    setHexDraft(rgbaToHex(parsed))
  }, [parsed, value])

  const emit = (next: RgbaColor) => {
    const css = rgbaToCss(next)
    lastEmitted.current = css
    onChange(css)
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

  const isCurrentlyEmpty = !value || !value.trim()
  const isInvalid = Boolean(value && !isValidColor(value))
  const pickAriaLabel = ariaLabel ?? label ?? 'Pick color'

  const showSwatchFill =
    Boolean(value?.trim()) && !isInvalid

  const displayHex =
    showSwatchFill ? rgbaToClipboardHex(parsed) : null

  const handleCopyHex = async () => {
    if (!displayHex) return
    try {
      await navigator.clipboard.writeText(displayHex)
      toast.success('Copied to clipboard.')
    } catch {
      toast.error('Clipboard unavailable.')
    }
  }

  const swatchFillStyle: CSSProperties = {
    background: showSwatchFill ? rgbaToCss(parsed) : 'transparent',
  }

  const onClearColor =
    allowEmpty && !isCurrentlyEmpty
      ? () => {
          onChange('')
          if (!inline) setPopoverOpen(false)
        }
      : undefined

  const popoverFormBase = {
    idPrefix: id,
    parsed,
    hexDraft,
    setHexDraft,
    onPickerColor: emit,
    onHexBlur,
    onChannel,
    onAlpha,
    disabled,
    withAlpha,
    fineInputControlClass,
    isInvalid,
    isCurrentlyEmpty,
    allowEmpty,
    onClearColor,
    pickAriaLabel,
    showSwatchFill,
  }

  if (inline) {
    return (
      <div className={cn('space-y-2', className)}>
        <ColorFieldPopoverForm {...popoverFormBase} />
        {isInvalid ? (
          <p role="alert" className="text-[11px] text-red-300">
            Unrecognized color value — using fallback. Edit to fix.
          </p>
        ) : null}
      </div>
    )
  }

  const labelId = `${id}-field-label`
  const openLabel = label ?? ariaLabel ?? 'Open color editor'
  const isCompact = density === 'compact'

  return (
    <div className={cn('flex flex-col', isCompact ? 'gap-1' : 'gap-2', className)}>
      {label ? (
        <p
          id={labelId}
          className="block text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]"
        >
          {label}
        </p>
      ) : null}

      <PopoverPrimitive.Root
        modal={false}
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
      >
        <PopoverPrimitive.Anchor asChild>
          <div
            className={cn(
              'relative w-full max-w-full',
              isCompact ? 'h-10 max-h-10 shrink-0' : '',
            )}
          >
            {isCompact ? (
              <div
                className={cn(
                  compactContainerClassName ?? adminFieldCompactRowClass,
                )}
                data-anvl-color-field-density={density}
              >
                <button
                  type="button"
                  disabled={disabled}
                  aria-expanded={popoverOpen}
                  aria-haspopup="dialog"
                  aria-labelledby={label ? labelId : undefined}
                  aria-label={label ? undefined : openLabel}
                  onClick={() => {
                    if (!disabled) setPopoverOpen(true)
                  }}
                  className={cn(
                    'focus-ring absolute inset-0 z-0 rounded-full outline-offset-[-1px]',
                    'transition-[box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                />
                <div className="relative z-[1] flex min-w-0 flex-1 items-center gap-2 px-3 pointer-events-none">
                  <span
                    aria-hidden="true"
                    className="relative h-6 w-6 shrink-0 overflow-hidden rounded border border-[var(--color-line)]"
                  >
                    <span
                      className="pointer-events-none absolute inset-0 rounded-sm"
                      style={CHECKERBOARD_STYLE}
                    />
                    <span
                      className="pointer-events-none absolute inset-0 rounded-sm"
                      style={swatchFillStyle}
                    />
                  </span>
                  <button
                    type="button"
                    disabled={disabled || !displayHex}
                    onClick={(e) => {
                      e.preventDefault()
                      void handleCopyHex()
                    }}
                    aria-label={
                      displayHex
                        ? `Copy color ${displayHex}`
                        : 'Copy color (no value)'
                    }
                    className={cn(
                      'focus-ring pointer-events-auto min-w-0 flex-1 truncate rounded border border-transparent bg-transparent px-0 py-0 text-left font-mono tabular-nums text-sm text-[var(--color-text)]',
                      (!displayHex || disabled) &&
                        'cursor-not-allowed opacity-50',
                    )}
                  >
                    {displayHex ?? '—'}
                  </button>
                </div>
                <IconButton
                  type="button"
                  disabled={disabled}
                  aria-label={`Edit color${label ? ` (${label})` : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!disabled) setPopoverOpen(true)
                  }}
                  className={cn(
                    'relative z-[2] mr-1 h-8 w-8 shrink-0 border-[color:color-mix(in_srgb,var(--anvl-bone)_22%,transparent)] bg-[color:color-mix(in_srgb,var(--color-bg)_88%,transparent)] shadow-sm backdrop-blur-[2px]',
                  )}
                >
                  <SlidersHorizontal size={16} aria-hidden className="opacity-90" />
                </IconButton>
              </div>
            ) : (
              <>
                <div className="relative w-full overflow-hidden rounded-2xl">
                  <div data-anvl-color-field-density={density}>
                    <div
                      aria-hidden
                      className={cn(
                        'pointer-events-none absolute inset-0 isolate',
                        'border border-[var(--color-line)] bg-[var(--color-surface)]',
                        'shadow-[inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-1px_0_rgba(0,0,0,0.42),0_1px_0_rgba(255,255,255,0.04),0_20px_56px_-36px_rgba(0,0,0,0.82)]',
                        'ring-1 ring-inset ring-[color:color-mix(in_srgb,var(--anvl-bone)_10%,transparent)]',
                      )}
                    >
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--anvl-bone)_14%,transparent)_0%,transparent_42%),linear-gradient(to_bottom,color-mix(in_srgb,var(--color-surface-elevated)_38%,transparent)_0%,transparent_55%)] opacity-90"
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={CHECKERBOARD_STYLE}
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={swatchFillStyle}
                      />
                    </div>

                    <button
                      type="button"
                      disabled={disabled}
                      aria-expanded={popoverOpen}
                      aria-haspopup="dialog"
                      aria-labelledby={label ? labelId : undefined}
                      aria-label={label ? undefined : openLabel}
                      onClick={() => {
                        if (!disabled) setPopoverOpen(true)
                      }}
                      className={cn(
                        'focus-ring absolute inset-0 z-0 rounded-2xl',
                        'min-h-[7rem] sm:min-h-[7.5rem]',
                        'transition-[box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                        'hover:border-[color:color-mix(in_srgb,var(--anvl-bone)_28%,transparent)]',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                      )}
                    />

                    <div
                      className={cn(
                        'relative z-[1] flex min-h-[7rem] flex-col justify-end p-3 pt-10 sm:min-h-[7.5rem]',
                      )}
                    >
                      <div className="pointer-events-none flex w-full items-end justify-between gap-2">
                        <button
                          type="button"
                          disabled={disabled || !displayHex}
                          onClick={(e) => {
                            e.preventDefault()
                            void handleCopyHex()
                          }}
                          aria-label={
                            displayHex
                              ? `Copy color ${displayHex}`
                              : 'Copy color (no value)'
                          }
                          className={cn(
                            'focus-ring pointer-events-auto max-w-[min(100%,14rem)] truncate rounded-md border border-[color:color-mix(in_srgb,var(--anvl-bone)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--color-bg)_76%,transparent)] px-2 py-1 font-mono text-[11px] tabular-nums text-[var(--color-text)] backdrop-blur-[2px]',
                            'hover:border-[color:color-mix(in_srgb,var(--anvl-bone)_32%,transparent)]',
                            (!displayHex || disabled) &&
                              'cursor-not-allowed opacity-50',
                          )}
                        >
                          {displayHex ?? '—'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <IconButton
                  type="button"
                  disabled={disabled}
                  aria-label={`Edit color${label ? ` (${label})` : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!disabled) setPopoverOpen(true)
                  }}
                  className={cn(
                    'absolute right-2 top-2 z-[2] h-11 w-11 border-[color:color-mix(in_srgb,var(--anvl-bone)_22%,transparent)] bg-[color:color-mix(in_srgb,var(--color-bg)_88%,transparent)] shadow-sm backdrop-blur-[2px]',
                  )}
                >
                  <SlidersHorizontal size={18} aria-hidden className="opacity-90" />
                </IconButton>
              </>
            )}
          </div>
        </PopoverPrimitive.Anchor>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            side="bottom"
            align="start"
            sideOffset={8}
            collisionPadding={8}
            className={colorPopoverContentClass}
          >
            <ColorFieldPopoverForm {...popoverFormBase} />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {isInvalid ? (
        <p role="alert" className="text-[11px] text-red-300">
          Unrecognized color value — using fallback. Edit to fix.
        </p>
      ) : null}
    </div>
  )
}
