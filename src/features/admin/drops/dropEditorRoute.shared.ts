import { adminStackedFieldClass } from '@/shared/lib/cmsFieldStyles'

/** Shared form styling + tab model for the drop editor route. */

export type TabId = 'basics' | 'theme' | 'landing' | 'products' | 'seo'

export type LeaveEmptyMap = Partial<{
  logoImageUrl: boolean
  wordmarkImageUrl: boolean
  heroImageUrl: boolean
  loadingEmblemUrl: boolean
}>

export { isoToDatetimeLocalValue, localInputToIso } from '@/features/admin/lib/adminDateTime'

/** Kept name for historical imports; prefers shared `pad2` implementation. */
export { pad2 as padDt } from '@/features/admin/lib/adminDateTime'

export {
  adminFieldClearButtonClass,
  adminFieldControlClass,
  adminFieldControlFineClass,
  adminCheckboxControlClass,
} from '@/shared/lib/cmsFieldStyles'

/** Shared control chrome (width, border, typography). Pair with `mt-1` under stacked labels. */
export const fieldClass = adminStackedFieldClass

export const fieldErrorClass = 'border-red-500/60 bg-red-500/5'

export const DROP_EDITOR_SPLIT_VIEWPORT_H_CLASS =
  'lg:h-[calc(100dvh-var(--admin-topbar-height)-var(--admin-editor-tabs-height)-var(--admin-main-block-gutter)-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] lg:max-h-[calc(100dvh-var(--admin-topbar-height)-var(--admin-editor-tabs-height)-var(--admin-main-block-gutter)-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))]'

/**
 * Preview column shell: fills the split row on `lg+` when the parent chain is viewport-capped.
 */
export const DROP_EDITOR_PREVIEW_PANE_MIN_H_CLASS =
  'lg:min-h-0 lg:h-full lg:max-h-full'

/**
 * On `lg`, the split row fills the viewport below tabs so only the editor pane scrolls.
 */
export const DROP_EDITOR_SPLIT_LG_MIN_H_CLASS = `${DROP_EDITOR_SPLIT_VIEWPORT_H_CLASS} lg:min-h-0 lg:flex-1 lg:overflow-hidden`

/** @deprecated use DROP_EDITOR_SPLIT_LG_MIN_H_CLASS */
export const DROP_EDITOR_SPLIT_XL_MIN_H_CLASS = DROP_EDITOR_SPLIT_LG_MIN_H_CLASS
