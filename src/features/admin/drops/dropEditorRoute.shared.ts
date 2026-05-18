import { adminFieldControlClass } from '@/shared/lib/cmsFieldStyles'

/** Shared form styling + tab model for the drop editor route. */

export type TabId =
  | 'basics'
  | 'visuals'
  | 'theme'
  | 'landing'
  | 'products'
  | 'seo'

export type LeaveEmptyMap = Partial<{
  logoImageUrl: boolean
  wordmarkImageUrl: boolean
  heroImageUrl: boolean
  loadingEmblemUrl: boolean
}>

export { isoToDatetimeLocalValue, localInputToIso } from '@/features/admin/lib/adminDateTime'

/** Kept name for historical imports; prefers shared `pad2` implementation. */
export { pad2 as padDt } from '@/features/admin/lib/adminDateTime'

export { adminFieldControlClass, adminCheckboxControlClass } from '@/shared/lib/cmsFieldStyles'

/** Shared control chrome (width, border, typography). Pair with `mt-1` under stacked labels. */
export const fieldClass = `mt-1 ${adminFieldControlClass}`

export const fieldErrorClass = 'border-red-500/60 bg-red-500/5'

/**
 * Preview column shell: usable viewport below sticky {@link AdminTopbar}, main gutters, and
 * safe-area insets. Uses `--admin-topbar-height`, `--admin-main-block-gutter` in `src/styles.css`.
 * On `xl`, pair with {@link DROP_EDITOR_SPLIT_XL_MIN_H_CLASS} + `items-stretch` so the preview
 * stack matches the builder column (tabs + forms) height.
 */
export const DROP_EDITOR_PREVIEW_PANE_MIN_H_CLASS =
  'min-h-[calc(100dvh-var(--admin-topbar-height)-var(--admin-main-block-gutter)-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))]'

/**
 * On `xl`, the split row uses the same minimum height so a **short** builder column still leaves
 * a tall preview lane; when the builder rail is taller, flex `items-stretch` grows the preview
 * column to the full rail (including the BASICS/THEME tab row).
 */
export const DROP_EDITOR_SPLIT_XL_MIN_H_CLASS =
  'xl:min-h-[calc(100dvh-var(--admin-topbar-height)-var(--admin-main-block-gutter)-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))]'
