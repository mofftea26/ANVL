/**
 * Control chrome shared by admin form primitives and CMS pickers (`MediaPickerField` URL row).
 * Keep in sync with `AdminInput` / `AdminCheckbox` expectations.
 */

/** Text-like controls (input, textarea, URL field). */
export const adminFieldControlClass =
  'w-full rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus-ring'

/** Native checkbox inside `AdminCheckbox` and MediaPicker “leave empty” toggle. */
export const adminCheckboxControlClass =
  'focus-ring mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-accent)] accent-[var(--color-accent)]'

/** Stacked label + control spacing for admin forms. */
export const adminStackedFieldClass = `mt-1 ${adminFieldControlClass}`
