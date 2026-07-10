/**
 * Fine-grained admin-only control chrome that doesn't fit the shared
 * `Input`/`Select`/`Checkbox` density variants — narrow, one-off pickers
 * (color channels, date-picker adjuncts, compact color-field rows).
 */

/** Base tokens shared by the fine-grained controls below. */
export const adminFieldChromeBase =
  'border border-[var(--color-line)] bg-[var(--color-surface-soft)] text-[var(--color-text)] transition-colors focus-ring hover:bg-[var(--color-surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50'

/** Compact numeric / HEX inputs (color picker channels). */
export const adminFieldControlFineClass = [
  'h-8 rounded-xl px-2 text-xs',
  adminFieldChromeBase,
].join(' ')

/** Small adjunct button (clear date/time). */
export const adminFieldClearButtonClass = [
  'focus-ring mt-1 flex h-9 shrink-0 items-center rounded-full px-2.5',
  adminFieldChromeBase,
  'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
  'disabled:pointer-events-none disabled:opacity-40',
].join(' ')

/** Compact color-field row container (admin drop theme / product swatches). */
export const adminFieldCompactRowClass = [
  'relative flex h-10 w-full max-w-full items-center overflow-hidden rounded-full',
  adminFieldChromeBase,
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
].join(' ')
