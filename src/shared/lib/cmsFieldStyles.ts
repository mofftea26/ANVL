/**
 * Control chrome shared by admin form primitives and CMS pickers (`MediaPickerField` URL row).
 * Aligned with `adminChipButtonVariants` default — surface-soft pills + subtle borders.
 */

/** Base tokens shared with {@link adminChipButtonVariants} default variant. */
export const adminFieldChromeBase =
  'border border-[var(--color-line)] bg-[var(--color-surface-soft)] text-[var(--color-text)] transition-colors focus-ring hover:bg-[var(--color-surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50'

/** Single-line text controls (input, select trigger, URL field). Matches chip height (`h-9`). */
export const adminFieldControlClass = [
  'w-full h-9 rounded-full px-3 text-xs',
  adminFieldChromeBase,
  'placeholder:text-[var(--color-text-muted)]',
].join(' ')

/** Multiline controls — softer radius for readability. */
export const adminFieldTextareaClass = [
  'w-full min-h-[5rem] rounded-xl px-3 py-2 text-xs',
  adminFieldChromeBase,
  'placeholder:text-[var(--color-text-muted)]',
].join(' ')

/** Compact numeric / HEX inputs (color picker channels). */
export const adminFieldControlFineClass = [
  'h-8 rounded-xl px-2 text-xs',
  adminFieldChromeBase,
].join(' ')

/** Invalid-field border treatment shared by admin form controls. */
export const fieldErrorClass = 'border-red-500/60 bg-red-500/5'

/** Native checkbox inside `AdminCheckbox` and MediaPicker “leave empty” toggle. */
export const adminCheckboxControlClass =
  'focus-ring mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--color-line)] bg-[var(--color-surface-soft)] text-[var(--color-accent)] accent-[var(--color-accent)]'

/** Stacked label + control spacing for admin forms. */
export const adminStackedFieldClass = `mt-1 ${adminFieldControlClass}`

/** Radix select trigger — same chrome as single-line fields. */
export const adminSelectTriggerClass = [
  adminFieldControlClass,
  'flex items-center justify-between gap-2 text-left outline-none',
  'data-[placeholder]:text-[var(--color-text-muted)]',
].join(' ')

/** Select dropdown panel — elevated surface, readable list. */
export const adminSelectContentClass =
  'z-[85] max-h-[min(280px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-elevated)] p-1 shadow-[inset_0_1px_0_rgba(231,228,223,0.06),0_12px_32px_rgba(0,0,0,0.5)] outline-none'

/** Select item row inside dropdown. */
export const adminSelectItemClass =
  'relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2.5 text-xs leading-snug outline-none transition-colors focus:bg-[var(--color-chip)] focus:text-[var(--color-text)] data-[highlighted]:bg-[var(--color-chip)] data-[highlighted]:text-[var(--color-text)] data-[state=checked]:text-[var(--color-accent)] data-[disabled]:pointer-events-none data-[disabled]:opacity-40'

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
